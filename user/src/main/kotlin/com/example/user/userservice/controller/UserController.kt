package com.example.user.userservice.controller

import com.example.user.userservice.dto.UserResponse
import com.example.user.userservice.dto.CreateUserRequest
import com.example.user.userservice.service.UserService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/user-service")
class UserController(private val userService: UserService) {
    
    @GetMapping("/users/{userId}")
    fun getUserById(@PathVariable userId: String): ResponseEntity<UserResponse> {
        val user = userService.getUserById(userId)
        return ResponseEntity.ok(user)
    }

    @GetMapping("/users/me")
    fun getCurrentUser(@AuthenticationPrincipal jwt: Jwt): ResponseEntity<UserResponse> {
        val username = jwt.getClaim<String>("preferred_username") ?: jwt.subject
        val email = jwt.getClaim<String>("email") ?: "$username@example.com"
        val user = userService.getOrCreateUserByKeycloakId(jwt.subject, username, email)
        return ResponseEntity.ok(user)
    }

    @PreAuthorize("hasAuthority('admin')")
    @PostMapping("/users")
    fun createUser(@Valid @RequestBody request: CreateUserRequest): ResponseEntity<String> {
        val savedUser = userService.createUser(request)
        return ResponseEntity.ok(savedUser.id.toString())
    }
    
    @PreAuthorize("hasAuthority('admin')")
    @GetMapping("/users")
    fun listUsers(): ResponseEntity<List<UserResponse>> {
        val users = userService.listUsers()
        return ResponseEntity.ok(users)
    }
}
