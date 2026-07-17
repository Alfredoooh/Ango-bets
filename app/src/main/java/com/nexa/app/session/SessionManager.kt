package com.nexa.app.session

import android.content.Context
import android.content.SharedPreferences

/**
 * Guarda o token de sessão em SharedPreferences simples.
 * (Se a versão anterior usava EncryptedSharedPreferences, avisa que troco
 * para essa variante — aqui fica a versão mínima para compilar já.)
 */
object SessionManager {

    private const val PREFS_NAME = "nexa_session"
    private const val KEY_TOKEN = "auth_token"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveToken(context: Context, token: String) {
        prefs(context).edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(context: Context): String? {
        return prefs(context).getString(KEY_TOKEN, null)
    }

    fun isLoggedIn(context: Context): Boolean {
        return !getToken(context).isNullOrEmpty()
    }

    fun clear(context: Context) {
        prefs(context).edit().remove(KEY_TOKEN).apply()
    }
}