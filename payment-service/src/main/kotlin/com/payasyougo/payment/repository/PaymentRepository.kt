package com.payasyougo.payment.repository

import com.payasyougo.payment.model.Payment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface PaymentRepository : JpaRepository<Payment, UUID> {
    fun findByStripePaymentIntentId(stripePaymentIntentId: String): Payment?
    fun findBySubscriptionId(subscriptionId: String): Payment?
}
