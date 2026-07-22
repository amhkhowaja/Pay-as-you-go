package com.example.billingservice.billing.dto

import com.example.billingservice.billing.model.BillingCycle
import org.bson.types.ObjectId
import org.springframework.data.annotation.Id
import java.time.Instant

data class CreatePlanRequest (
    val name: String,
    val price : Int,
    val billingCycle: BillingCycle,
)