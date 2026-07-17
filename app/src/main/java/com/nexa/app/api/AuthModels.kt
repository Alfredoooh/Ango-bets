// app/src/main/java/com/nexa/app/api/AuthModels.kt
package com.nexa.app.api

import com.google.gson.annotations.SerializedName

/**
 * Modelos espelhando exatamente o body/resposta de worker.js:
 * handleRegister (POST /auth/register) e handleLogin (POST /auth/login).
 */

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val id: String,
    val name: String,
    val email: String,
    val credits: Int
)

/**
 * O worker devolve sempre {"error": "mensagem"} em falhas (ver função error()
 * em worker.js), com status 400/401/403/500 conforme o caso.
 */
data class ApiErrorResponse(
    @SerializedName("error") val error: String?
)