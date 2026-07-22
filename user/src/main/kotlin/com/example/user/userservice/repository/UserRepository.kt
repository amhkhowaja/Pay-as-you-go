package com.example.user.userservice.repository

import com.example.user.userservice.model.User
import org.springframework.data.mongodb.repository.MongoRepository

interface UserRepository: MongoRepository<User, String> {
    fun findByKeycloakUserId(keycloakUserId: String): User?
    fun findByEmail(email: String): User?
}