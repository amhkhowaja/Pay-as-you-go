package com.payasyougo.payment.controller

import com.payasyougo.payment.dto.PaymentRequest
import com.payasyougo.payment.dto.PaymentResponse
import com.payasyougo.payment.service.PaymentService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/payments")
class PaymentController(private val paymentService: PaymentService) {

    @PostMapping
    fun createPayment(@RequestBody request: PaymentRequest): ResponseEntity<PaymentResponse> {
        val response = paymentService.createPayment(request)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{subscriptionId}")
    fun getPaymentIntent(@PathVariable subscriptionId: String): ResponseEntity<PaymentResponse> {
        val response = paymentService.getPaymentIntent(subscriptionId)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/confirm/{subscriptionId}")
    fun confirmPayment(@PathVariable subscriptionId: String): ResponseEntity<String> {
        paymentService.confirmPayment(subscriptionId)
        return ResponseEntity.ok("Payment confirmed")
    }

    @PostMapping("/webhook")
    fun handleWebhook(
        @RequestBody payload: String,
        @RequestHeader("Stripe-Signature") signature: String
    ): ResponseEntity<String> {
        val result = paymentService.handleWebhook(payload, signature)
        return ResponseEntity.ok(result)
    }
}
