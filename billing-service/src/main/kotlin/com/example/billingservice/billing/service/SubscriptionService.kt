package com.example.billingservice.billing.service

import com.example.billingservice.billing.client.PaymentRequest
import com.example.billingservice.billing.client.PaymentServiceClient
import com.example.billingservice.billing.dto.CreateSubscriptionRequest
import com.example.billingservice.billing.model.BillingCycle
import com.example.billingservice.billing.model.SubscriptionStatus
import com.example.billingservice.billing.model.Subscriptions
import com.example.billingservice.billing.repository.BillingPlanRepository
import com.example.billingservice.billing.repository.SubscriptionRepository
import org.bson.types.ObjectId
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit

@Service
class SubscriptionService(
    private val subscriptionRepository: SubscriptionRepository,
    private val planService: BillingPlansService,
    private val paymentServiceClient: PaymentServiceClient
) {
    fun listSubscriptions(): List<Subscriptions> {
         return subscriptionRepository.findAll()
    }

    fun getUserSubscriptions(userId: String): List<Subscriptions> {
        return subscriptionRepository.findByUserId(userId)
    }

    fun createSubscription(subscriptionRequest: CreateSubscriptionRequest) : Subscriptions{
        val billingPlan = planService.getPlanByPlanId(subscriptionRequest.planId)
            ?: throw IllegalArgumentException("Plan not found")
        
        // Check for duplicate active subscription
        val existingActive = subscriptionRepository.findByUserIdAndPlanIdAndStatus(
            subscriptionRequest.userId, subscriptionRequest.planId, SubscriptionStatus.ACTIVE
        )
        if (existingActive != null) {
            throw IllegalStateException("Active subscription already exists for this plan")
        }
        
        // Create subscription first
        val endDateValue = getSubscriptionEndData(Instant.now(), billingPlan.billingCycle)
        val subscription = Subscriptions(
            userId = subscriptionRequest.userId,
            serviceId = subscriptionRequest.serviceId,
            planId = subscriptionRequest.planId,
            status = SubscriptionStatus.PENDING,
            startDate = Instant.now(),
            endDate = endDateValue,
            updatedAt = Instant.now(),
        )
        val savedSubscription = subscriptionRepository.save(subscription)
        
        // Create payment with actual subscription ID
        val paymentRequest = PaymentRequest(
            userId = subscriptionRequest.userId,
            subscriptionId = savedSubscription.id,
            amount = (billingPlan.price * 100).toLong(),
            currency = "usd"
        )
        
        try {
            paymentServiceClient.createPayment(paymentRequest)
        } catch (e: Exception) {
            // Rollback: delete subscription if payment creation fails
            subscriptionRepository.delete(savedSubscription)
            throw IllegalStateException("Failed to create payment: ${e.message}", e)
        }
        
        return savedSubscription
    }
    
    fun activateSubscription(subscriptionId: String) {
        val subscription = subscriptionRepository.findById(subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found") }
        
        val updatedSubscription = subscription.copy(
            status = SubscriptionStatus.ACTIVE,
            updatedAt = Instant.now()
        )
        subscriptionRepository.save(updatedSubscription)
    }

    private fun getSubscriptionEndData(startDate: Instant, billingCycle: BillingCycle?) : Instant {
        if (billingCycle == BillingCycle.WEEKLY) {
            return startDate.plus(7, ChronoUnit.DAYS)
        } else if (billingCycle == BillingCycle.MONTHLY) {
            return startDate.
            atZone(ZoneId.of("UTC")).
            plusMonths(1).
            toInstant()
        } else if (billingCycle == BillingCycle.YEARLY) {
            return startDate
                .atZone(ZoneId.of("UTC"))
                .plusYears(1)
                .toInstant()
        }
        return startDate
    }
}