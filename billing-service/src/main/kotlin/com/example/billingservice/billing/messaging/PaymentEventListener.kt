package com.example.billingservice.billing.messaging

import com.example.billingservice.billing.service.SubscriptionService
import org.springframework.stereotype.Component

@Component
class PaymentEventListener(private val subscriptionService: SubscriptionService) {
    
    fun receiveMessage(event: Map<String, Any>) {
        val eventType = event["eventType"] as? String
        val subscriptionId = event["subscriptionId"] as? String
        
        if (eventType == "PAYMENT_SUCCESS" && subscriptionId != null) {
            subscriptionService.activateSubscription(subscriptionId)
        }
    }
}
