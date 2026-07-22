package com.payasyougo.payment.dto

data class PaymentRequest(
    val userId: String,
    val subscriptionId: String,
    val amount: Long,
    val currency: String = "usd"
)

data class PaymentResponse(
    val paymentId: String,
    val status: String,
    val clientSecret: String? = null
)
