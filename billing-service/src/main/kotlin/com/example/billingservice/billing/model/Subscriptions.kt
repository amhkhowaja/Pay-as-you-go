package com.example.billingservice.billing.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "subscriptions")
class Subscriptions(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @Column(nullable = false)
    var userId: String = "",

    @Column(nullable = false)
    var serviceId: String = "",

    @Column(nullable = false)
    var planId: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: SubscriptionStatus = SubscriptionStatus.PENDING,

    @Column(nullable = false)
    var startDate: Instant = Instant.now(),

    @Column(nullable = false)
    var endDate: Instant = Instant.now(),

    @Column(nullable = false)
    var updatedAt: Instant = Instant.now()
)
