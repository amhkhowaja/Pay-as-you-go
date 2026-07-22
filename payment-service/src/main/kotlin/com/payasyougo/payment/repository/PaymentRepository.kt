package com.payasyougo.payment.repository

import com.payasyougo.payment.model.Payment
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface PaymentRepository : MongoRepository<Payment, String> {
    fun findByStripePaymentIntentId(stripePaymentIntentId: String): Payment?
    fun findBySubscriptionId(subscriptionId: String): Payment?
}
