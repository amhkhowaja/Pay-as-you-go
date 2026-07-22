package com.example.billingservice.billing.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpRequest
import org.springframework.http.client.ClientHttpRequestExecution
import org.springframework.http.client.ClientHttpRequestInterceptor
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.client.RestTemplate

@Configuration
class RestTemplateConfig {
    @Bean
    fun restTemplate(): RestTemplate {
        val factory = org.springframework.http.client.SimpleClientHttpRequestFactory()
        factory.setConnectTimeout(5000)
        factory.setReadTimeout(5000)
        val restTemplate = RestTemplate(factory)
        restTemplate.interceptors.add(jwtForwardingInterceptor())
        return restTemplate
    }
    
    private fun jwtForwardingInterceptor() = ClientHttpRequestInterceptor { request, body, execution ->
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication is JwtAuthenticationToken) {
            request.headers.setBearerAuth(authentication.token.tokenValue)
        }
        execution.execute(request, body)
    }
}
