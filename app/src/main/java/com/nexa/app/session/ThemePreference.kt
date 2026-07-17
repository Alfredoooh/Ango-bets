package com.nexa.app.session

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate

/**
 * Guarda e aplica a preferência de tema (light/dark/system).
 */
object ThemePreference {

    private const val PREFS_NAME = "nexa_theme"
    private const val KEY_MODE = "mode"

    const val MODE_LIGHT = "light"
    const val MODE_DARK = "dark"
    const val MODE_SYSTEM = "system"

    fun saveTheme(context: Context, mode: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_MODE, mode)
            .apply()
    }

    fun getStoredTheme(context: Context): String {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_MODE, MODE_SYSTEM) ?: MODE_SYSTEM
    }

    fun applyStoredTheme(context: Context) {
        val mode = getStoredTheme(context)
        val nightMode = when (mode) {
            MODE_LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
            MODE_DARK -> AppCompatDelegate.MODE_NIGHT_YES
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }
        AppCompatDelegate.setDefaultNightMode(nightMode)
    }
}