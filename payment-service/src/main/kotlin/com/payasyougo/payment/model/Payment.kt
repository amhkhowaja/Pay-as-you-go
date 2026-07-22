package com.payasyougo.payment.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "payments")
class Payment(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @Column(nullable = false)
    var userId: String = "",

    @Column(nullable = false)
    var subscriptionId: String = "",

    @Column(nullable = false)
    var amount: Long = 0,

    @Column(nullable = false)
    var currency: String = "usd",

    @Column(unique = true)
    var stripePaymentIntentId: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PaymentStatus = PaymentStatus.PENDING,

    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(nullable = false)
    var updatedAt: Instant = Instant.now()
)

enum class PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED,
    CANCELED
}
