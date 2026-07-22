package com.example.billingservice.billing.dto

import com.example.billingservice.billing.model.BillingCycle

data class CreatePlanRequest (
    val name: String,
    val price : Int,
    val billingCycle: BillingCycle,
)
