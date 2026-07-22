package com.example.billingservice.billing.client

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate

@Component
class PaymentServiceClient(
    private val restTemplate: RestTemplate,
    @Value("\${payment.service.url}") private val paymentServiceUrl: String
) {
    fun createPayment(request: PaymentRequest): PaymentResponse {
        return restTemplate.postForObject(
            "$paymentServiceUrl/payments",
            request,
            PaymentResponse::class.java
        ) ?: throw RuntimeException("Payment creation failed")
    }
}

data class PaymentRequest(
    val userId: String,
    val subscriptionId: String,
    val amount: Long,
    val currency: String = "usd"
)

data class PaymentResponse(
    val paymentId: String,
    val status: String,
    val clientSecret: String?
)
