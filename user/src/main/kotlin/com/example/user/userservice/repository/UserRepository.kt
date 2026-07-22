package com.example.user.userservice.repository

import com.example.user.userservice.model.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface UserRepository: JpaRepository<User, UUID> {
    fun findByKeycloakUserId(keycloakUserId: String): User?
    fun findByEmail(email: String): User?
}
