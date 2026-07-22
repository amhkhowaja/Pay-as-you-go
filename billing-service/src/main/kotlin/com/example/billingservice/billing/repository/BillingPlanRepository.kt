package com.example.billingservice.billing.repository

import com.example.billingservice.billing.model.BillingPlans
import org.springframework.data.mongodb.repository.MongoRepository

interface BillingPlanRepository: MongoRepository<BillingPlans, String> {
}