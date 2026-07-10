package com.nexa.app.api

import com.google.gson.Gson
import retrofit2.Response

/**
 * Extrai a mensagem de erro de um Response<T> falhado, assumindo o shape
 * { "error": "mensagem" } que worker.js devolve sempre em respostas de erro.
 */
object ApiErrorParser {

    private val gson = Gson()

    fun extractMessage(response: Response<*>, fallback: String): String {
        val raw = response.errorBody()?.string()
        if (raw.isNullOrBlank()) return fallback
        return try {
            val parsed = gson.fromJson(raw, ApiErrorResponse::class.java)
            parsed?.error?.takeIf { it.isNotBlank() } ?: fallback
        } catch (e: Exception) {
            fallback
        }
    }
}