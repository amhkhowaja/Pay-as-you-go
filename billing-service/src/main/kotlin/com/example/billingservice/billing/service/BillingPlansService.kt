package com.example.billingservice.billing.service

import com.example.billingservice.billing.dto.CreatePlanRequest
import com.example.billingservice.billing.model.BillingPlans
import com.example.billingservice.billing.repository.BillingPlanRepository
import org.bson.types.ObjectId
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import java.time.Instant

@Service
class BillingPlansService(val planRepository: BillingPlanRepository){
    fun createPlan(@RequestBody createPlanRequest: CreatePlanRequest): BillingPlans{
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

    fun getPlanByPlanId(@PathVariable planId: String): BillingPlans? {
        return planRepository.findByIdOrNull(planId)
    }
}
