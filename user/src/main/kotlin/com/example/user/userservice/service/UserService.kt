package com.example.user.userservice.service

import com.example.user.userservice.dto.CreateUserRequest
import com.example.user.userservice.dto.UserResponse
import com.example.user.userservice.model.User
import com.example.user.userservice.repository.UserRepository
import org.bson.types.ObjectId
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class UserService(val userRepository: UserRepository) {
    
    fun getUserById(userId: String): UserResponse {
        val user: User = userRepository.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
        }
        return user.toGetUserResponse()
    }

    fun getUserByKeycloakId(keycloakUserId: String): UserResponse {
        val user = userRepository.findByKeycloakUserId(keycloakUserId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
        return user.toGetUserResponse()
    }

    fun getOrCreateUserByKeycloakId(keycloakUserId: String, username: String, email: String): UserResponse {
        val existingUser = userRepository.findByKeycloakUserId(keycloakUserId)
        if (existingUser != null) {
            return existingUser.toGetUserResponse()
        }
        
        // Check if user exists by email and return it
        val userByEmail = userRepository.findByEmail(email)
        if (userByEmail != null) {
            return userByEmail.toGetUserResponse()
        }
        
        val newUser = User(
            keycloakUserId = keycloakUserId,
            username = username,
            email = email,
            createdAt = java.time.Instant.now()
        )
        val savedUser = userRepository.save(newUser)
        return savedUser.toGetUserResponse()
    }

    fun createUser(request: CreateUserRequest): User {
        // Check for duplicate keycloak ID
        if (userRepository.findByKeycloakUserId(request.keycloakUserId) != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "User with this Keycloak ID already exists")
        }
        
        // Check for duplicate email
        if (userRepository.findByEmail(request.email) != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email already exists")
        }
        
        val user = User(
            keycloakUserId = request.keycloakUserId,
            username = request.username,
            email = request.email,
            createdAt = java.time.Instant.now()
        )
        return userRepository.save(user)
    }
    
    fun listUsers(): List<UserResponse> {
        return userRepository.findAll().map { it.toGetUserResponse() }
    }
}

private fun User.toGetUserResponse(): UserResponse {
    return UserResponse(
        id = this.id,
        email = this.email,
        createdAt = this.createdAt,
        username = this.username,
    )
}