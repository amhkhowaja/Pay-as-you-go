package com.example.user.userservice.config

import com.example.user.userservice.model.User
import com.example.user.userservice.repository.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Instant

@Component
class JwtUserFilter(private val userRepository: UserRepository) : OncePerRequestFilter() {
    
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val authentication = SecurityContextHolder.getContext().authentication
        
        if (authentication?.principal is Jwt) {
            val jwt = authentication.principal as Jwt
            val keycloakUserId = jwt.subject
            val username = jwt.getClaimAsString("preferred_username") ?: keycloakUserId
            val email = jwt.getClaimAsString("email") ?: "$username@payasyougo.com"
            
            userRepository.findByKeycloakUserId(keycloakUserId) ?: run {
                userRepository.save(User(
                    keycloakUserId = keycloakUserId,
                    username = username,
                    email = email,
                    createdAt = Instant.now()
                ))
            }
        }
        
        filterChain.doFilter(request, response)
    }
}
