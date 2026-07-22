package com.example.user.userservice.dto

import java.time.Instant

data class UserResponse (
    val id: String,
    val username: String,
    val email: String,
    val createdAt: Instant
)
