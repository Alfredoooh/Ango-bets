package com.nexa.app.session

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object SessionManager {

    private const val PREFS_NAME = "nexa_session"
    private const val KEY_TOKEN = "token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_NAME = "name"
    private const val KEY_EMAIL = "email"
    private const val TAG = "SessionManager"

    @Volatile
    private var prefs: SharedPreferences? = null

    private fun get(context: Context): SharedPreferences {
        return prefs ?: synchronized(this) {
            prefs ?: build(context.applicationContext).also { prefs = it }
        }
    }

    private fun build(context: Context): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Throwable) {
            Log.e(TAG, "EncryptedSharedPreferences falhou, a usar fallback: ${e.message}")
            try {
                context.deleteSharedPreferences(PREFS_NAME)
            } catch (ignored: Exception) {}
            context.applicationContext.getSharedPreferences(
                "${PREFS_NAME}_fallback",
                Context.MODE_PRIVATE
            )
        }
    }

    fun saveSession(context: Context, token: String, userId: String, name: String, email: String) {
        get(context).edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_NAME, name)
            .putString(KEY_EMAIL, email)
            .apply()
    }

    fun getToken(context: Context): String? = get(context).getString(KEY_TOKEN, null)

    fun getUserId(context: Context): String? = get(context).getString(KEY_USER_ID, null)

    fun getName(context: Context): String? = get(context).getString(KEY_NAME, null)

    fun getEmail(context: Context): String? = get(context).getString(KEY_EMAIL, null)

    fun isLoggedIn(context: Context): Boolean = getToken(context) != null

    fun clear(context: Context) {
        get(context).edit().clear().apply()
    }
}