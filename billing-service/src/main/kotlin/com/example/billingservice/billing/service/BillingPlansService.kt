package com.example.billingservice.billing.service

import com.example.billingservice.billing.dto.CreatePlanRequest
import com.example.billingservice.billing.model.BillingPlans
import com.example.billingservice.billing.repository.BillingPlanRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class BillingPlansService(val planRepository: BillingPlanRepository){
    fun createPlan(createPlanRequest: CreatePlanRequest): BillingPlans{
        val billingPlan = BillingPlans(
            name = createPlanRequest.name,
            price = createPlanRequest.price,
            billingCycle = createPlanRequest.billingCycle,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        return planRepository.save(billingPlan)
    }

    fun listPlans(): List<BillingPlans> = planRepository.findAll()

    fun getPlanByPlanId(planId: String): BillingPlans? {
        val uuid = try {
            UUID.fromString(planId)
        } catch (e: IllegalArgumentException) {
            return null
        }
        return planRepository.findByIdOrNull(uuid)
    }
}
