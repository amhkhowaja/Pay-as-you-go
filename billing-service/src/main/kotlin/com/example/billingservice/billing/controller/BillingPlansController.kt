package com.example.billingservice.billing.controller

import com.example.billingservice.billing.dto.CreatePlanRequest
import com.example.billingservice.billing.model.BillingPlans
import com.example.billingservice.billing.model.Subscriptions
import com.example.billingservice.billing.service.BillingPlansService
import org.bson.types.ObjectId
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable

import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class BillingPlansController(private val planService: BillingPlansService) {
    @PreAuthorize("hasAuthority('admin')")
    @PostMapping("/plans")
    fun createPlan(@RequestBody billingPlanRequest: CreatePlanRequest): ResponseEntity<String> {
        val savedPlan = planService.createPlan(billingPlanRequest)
        return ResponseEntity.ok(savedPlan.id)
    }

    @GetMapping("/plans")
    fun listPlans(): List<BillingPlans> = planService.listPlans()

    @GetMapping("/plans/{planId}")
    fun getPlanById(@PathVariable planId: String): BillingPlans?{
        return planService.getPlanByPlanId(planId)
    }
}