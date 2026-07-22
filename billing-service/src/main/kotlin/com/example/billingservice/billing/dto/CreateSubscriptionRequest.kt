package com.example.billingservice.billing.dto

import org.bson.types.ObjectId

data class CreateSubscriptionRequest (
    val userId: String,
    val serviceId: String,
    val planId: String,
)