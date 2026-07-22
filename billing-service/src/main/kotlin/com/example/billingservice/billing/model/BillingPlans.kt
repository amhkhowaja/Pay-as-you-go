package com.example.billingservice.billing.model

import org.bson.types.Decimal128
import org.bson.types.ObjectId
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "BillingPlans")
data class BillingPlans (
    @Id val id : String = ObjectId().toHexString(),
    val name: String,
    val price : Int,
    val billingCycle: BillingCycle,
    val createdAt: Instant,
    val updatedAt: Instant
)
