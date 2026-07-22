package com.example.billingservice.billing.repository

import com.example.billingservice.billing.model.Subscriptions
import org.springframework.data.mongodb.repository.MongoRepository

interface SubscriptionRepository: MongoRepository<Subscriptions, String> {
    fun findByUserId(userId: String): List<Subscriptions>
    fun findByUserIdAndPlanIdAndStatus(userId: String, planId: String, status: com.example.billingservice.billing.model.SubscriptionStatus): Subscriptions?
}