package com.example.billingservice.billing.repository

import com.example.billingservice.billing.model.Subscriptions
import com.example.billingservice.billing.model.SubscriptionStatus
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface SubscriptionRepository: JpaRepository<Subscriptions, UUID> {
    fun findByUserId(userId: String): List<Subscriptions>
    fun findByUserIdAndPlanIdAndStatus(userId: String, planId: String, status: SubscriptionStatus): Subscriptions?
}
