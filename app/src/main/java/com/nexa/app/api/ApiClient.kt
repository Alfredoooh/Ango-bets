// app/src/main/java/com/nexa/app/api/ApiClient.kt
package com.nexa.app.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Base URL confirmada no projeto web (src/shared/api.js):
 * export const API_BASE = 'https://ipc.alfredopjonas.workers.dev';
 *
 * É a mesma API que a versão web usa — login feito no app e no site
 * batem no mesmo Worker/KV, por isso a conta é a mesma dos dois lados.
 */
object ApiClient {

    private const val BASE_URL = "https://ipc.alfredopjonas.workers.dev/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .addInterceptor(loggingInterceptor)
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val authApi: AuthApi by lazy { retrofit.create(AuthApi::class.java) }
}