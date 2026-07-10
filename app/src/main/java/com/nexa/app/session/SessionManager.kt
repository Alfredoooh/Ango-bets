package com.nexa.app.session

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Guarda o token JWT devolvido por /auth/login e /auth/register de forma
 * encriptada em disco (EncryptedSharedPreferences), e expõe os dados básicos
 * do utilizador para uso rápido nas Activities (nome, email, credits).
 */
object SessionManager {

    private const val PREFS_NAME = "nexa_session"
    private const val KEY_TOKEN = "token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_NAME = "name"
    private const val KEY_EMAIL = "email"
    private const val KEY_CREDITS = "credits"

    @Volatile
    private var prefs: SharedPreferences? = null

    private fun get(context: Context): SharedPreferences {
        return prefs ?: synchronized(this) {
            prefs ?: build(context.applicationContext).also { prefs = it }
        }
    }

    private fun build(context: Context): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        return EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveSession(
        context: Context,
        token: String,
        userId: String,
        name: String,
        email: String,
        credits: Int
    ) {
        get(context).edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_NAME, name)
            .putString(KEY_EMAIL, email)
            .putInt(KEY_CREDITS, credits)
            .apply()
    }

    fun getToken(context: Context): String? = get(context).getString(KEY_TOKEN, null)

    fun getUserId(context: Context): String? = get(context).getString(KEY_USER_ID, null)

    fun getName(context: Context): String? = get(context).getString(KEY_NAME, null)

    fun getEmail(context: Context): String? = get(context).getString(KEY_EMAIL, null)

    fun getCredits(context: Context): Int = get(context).getInt(KEY_CREDITS, 0)

    fun isLoggedIn(context: Context): Boolean = getToken(context) != null

    fun clear(context: Context) {
        get(context).edit().clear().apply()
    }

    /**
     * Header pronto a usar em pedidos autenticados: "Bearer <token>".
     * Devolve null se não houver sessão.
     */
    fun authHeader(context: Context): String? {
        val token = getToken(context) ?: return null
        return "Bearer $token"
    }
}