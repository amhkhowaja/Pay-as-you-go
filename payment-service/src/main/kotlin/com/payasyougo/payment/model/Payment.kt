package com.payasyougo.payment.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "payments")
data class Payment(
    @Id
    val id: String? = null,
    val userId: String,
    val subscriptionId: String,
    val amount: Long,
    val currency: String = "usd",
    val stripePaymentIntentId: String? = null,
    val status: PaymentStatus = PaymentStatus.PENDING,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)

enum class PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED,
    CANCELED
}
