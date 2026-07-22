package com.payasyougo.payment.service

import com.payasyougo.payment.dto.PaymentRequest
import com.payasyougo.payment.dto.PaymentResponse
import com.payasyougo.payment.model.Payment
import com.payasyougo.payment.model.PaymentStatus
import com.payasyougo.payment.repository.PaymentRepository
import com.stripe.Stripe
import com.stripe.model.PaymentIntent
import com.stripe.param.PaymentIntentCreateParams
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import jakarta.annotation.PostConstruct

@Service
class PaymentService(
    private val paymentRepository: PaymentRepository,
    @Value("\${stripe.api.key}") private val stripeApiKey: String,
    @Value("\${stripe.webhook.secret}") private val webhookSecret: String,
    private val rabbitTemplate: org.springframework.amqp.rabbit.core.RabbitTemplate
) {
    @PostConstruct
    fun init() {
        Stripe.apiKey = stripeApiKey
    }

    fun createPayment(request: PaymentRequest): PaymentResponse {
        val idempotencyKey = "${request.subscriptionId}-${System.currentTimeMillis()}"
        
        val params = PaymentIntentCreateParams.builder()
            .setAmount(request.amount)
            .setCurrency(request.currency)
            .putMetadata("userId", request.userId)
            .putMetadata("subscriptionId", request.subscriptionId)
            .build()

        val paymentIntent = PaymentIntent.create(params, com.stripe.net.RequestOptions.builder()
            .setIdempotencyKey(idempotencyKey)
            .build())

        val payment = Payment(
            userId = request.userId,
            subscriptionId = request.subscriptionId,
            amount = request.amount,
            currency = request.currency,
            stripePaymentIntentId = paymentIntent.id,
            status = PaymentStatus.PENDING
        )

        val saved = paymentRepository.save(payment)

        return PaymentResponse(
            paymentId = saved.id!!,
            status = saved.status.name,
            clientSecret = paymentIntent.clientSecret
        )
    }

    fun getPaymentIntent(subscriptionId: String): PaymentResponse {
        val payment = paymentRepository.findBySubscriptionId(subscriptionId)
            ?: throw IllegalArgumentException("Payment not found for subscription: $subscriptionId")
        
        return PaymentResponse(
            paymentId = payment.id!!,
            status = payment.status.name,
            clientSecret = PaymentIntent.retrieve(payment.stripePaymentIntentId).clientSecret
        )
    }

    fun handleWebhook(payload: String, signature: String): String {
        val event = try {
            com.stripe.net.Webhook.constructEvent(payload, signature, webhookSecret)
        } catch (e: com.stripe.exception.SignatureVerificationException) {
            throw IllegalArgumentException("Invalid webhook signature")
        }
        
        when (event.type) {
            "payment_intent.succeeded" -> {
                val paymentIntent = event.dataObjectDeserializer.`object`.orElse(null) as? PaymentIntent
                    ?: throw IllegalArgumentException("Failed to deserialize PaymentIntent")
                val subscriptionId = paymentIntent.metadata["subscriptionId"]
                    ?: throw IllegalArgumentException("Missing subscriptionId in metadata")
                
                updatePaymentStatus(paymentIntent.id, PaymentStatus.SUCCEEDED)
                notifyBillingService(subscriptionId)
            }
            "payment_intent.payment_failed" -> {
                val paymentIntent = event.dataObjectDeserializer.`object`.orElse(null) as? PaymentIntent
                    ?: throw IllegalArgumentException("Failed to deserialize PaymentIntent")
                updatePaymentStatus(paymentIntent.id, PaymentStatus.FAILED)
            }
            "payment_intent.canceled" -> {
                val paymentIntent = event.dataObjectDeserializer.`object`.orElse(null) as? PaymentIntent
                    ?: throw IllegalArgumentException("Failed to deserialize PaymentIntent")
                updatePaymentStatus(paymentIntent.id, PaymentStatus.CANCELED)
            }
        }
        
        return "success"
    }

    private fun notifyBillingService(subscriptionId: String) {
        try {
            val event = mapOf(
                "eventType" to "PAYMENT_SUCCESS",
                "subscriptionId" to subscriptionId,
                "timestamp" to java.time.Instant.now().toString()
            )
            rabbitTemplate.convertAndSend("payment.events", event)
        } catch (e: Exception) {
            println("Failed to send payment event: ${e.message}")
        }
    }

    private fun updatePaymentStatus(stripePaymentIntentId: String, status: PaymentStatus) {
        paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId)?.let {
            paymentRepository.save(it.copy(status = status, updatedAt = java.time.Instant.now()))
        }
    }
}
