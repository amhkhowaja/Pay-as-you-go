package com.example.billingservice.billing.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "billing_plans")
class BillingPlans(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @Column(nullable = false)
    var name: String = "",

    @Column(nullable = false)
    var price: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var billingCycle: BillingCycle = BillingCycle.MONTHLY,

    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(nullable = false)
    var updatedAt: Instant = Instant.now()
)
