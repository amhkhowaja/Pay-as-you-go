package com.example.billingservice.billing.model

import org.bson.types.ObjectId
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "subscriptions")
data class Subscriptions (
    @Id val id: String = ObjectId().toHexString(),
    val userId: String,
    val serviceId: String,
    val planId: String,
    val status: SubscriptionStatus,
    val startDate: Instant,
    val endDate: Instant,
    val updatedAt: Instant,
)
