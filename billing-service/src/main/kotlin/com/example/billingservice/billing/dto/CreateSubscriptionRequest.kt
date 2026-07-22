package com.example.billingservice.billing.dto

data class CreateSubscriptionRequest (
    val userId: String,
    val serviceId: String,
    val planId: String,
)
