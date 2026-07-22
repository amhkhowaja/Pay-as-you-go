package com.example.user.userservice.model

import org.bson.types.ObjectId
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "users")
data class User (
    @Id val id: String = ObjectId().toHexString(),
    val keycloakUserId: String,
    val username: String,
    val email: String,
    val createdAt: Instant
)
