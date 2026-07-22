package com.example.billingservice.billing.controller

import com.example.billingservice.billing.dto.CreateSubscriptionRequest
import com.example.billingservice.billing.model.BillingPlans
import com.example.billingservice.billing.model.Subscriptions
import com.example.billingservice.billing.repository.SubscriptionRepository
import com.example.billingservice.billing.service.SubscriptionService
import org.bson.types.ObjectId
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
class SubscriptionController(private val subscriptionService: SubscriptionService) {

    @GetMapping("/subscriptions")
    fun listSubscriptions(): ResponseEntity<List<Subscriptions>> {
        val subscriptions = subscriptionService.listSubscriptions()
        return ResponseEntity.ok(subscriptions)
    }

    @GetMapping("/subscriptions/user/{userId}")
    fun getUserSubscriptions(@PathVariable userId: String): ResponseEntity<List<Subscriptions>> {
        val subscriptions = subscriptionService.getUserSubscriptions(userId)
        return ResponseEntity.ok(subscriptions)
    }

    @PostMapping("/subscriptions")
    fun createSubscription(@RequestBody subscriptionRequest: CreateSubscriptionRequest): ResponseEntity<String> {
        val subscription = subscriptionService.createSubscription(subscriptionRequest)
        return ResponseEntity.ok(subscription.id)
    }
    
    @PostMapping("/webhooks/payment-success")
    fun handlePaymentSuccess(@RequestBody event: Map<String, String>): ResponseEntity<String> {
        val subscriptionId = event["subscriptionId"] 
            ?: return ResponseEntity.badRequest().body("Missing subscriptionId")
        subscriptionService.activateSubscription(subscriptionId)
        return ResponseEntity.ok("Subscription activated")
    }
}

