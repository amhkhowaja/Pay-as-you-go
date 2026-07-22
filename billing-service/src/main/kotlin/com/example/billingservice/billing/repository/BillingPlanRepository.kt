package com.example.billingservice.billing.repository

import com.example.billingservice.billing.model.BillingPlans
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface BillingPlanRepository: JpaRepository<BillingPlans, UUID> {
}
