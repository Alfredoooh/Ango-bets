package com.nexa.app.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

/**
 * Espelha as rotas de auth definidas em worker.js:
 *   POST /auth/register  { name, email, password } -> AuthResponse (201)
 *   POST /auth/login     { email, password }        -> AuthResponse (200)
 * Em erro, o worker devolve sempre { "error": "mensagem" } (ver ApiErrorResponse).
 */
interface AuthApi {

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>
}