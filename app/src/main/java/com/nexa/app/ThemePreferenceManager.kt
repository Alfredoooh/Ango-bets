package com.nexa.app.util

import android.content.Context
import android.content.SharedPreferences
import androidx.appcompat.app.AppCompatDelegate

/**
 * Gere a preferência de tema do utilizador (Claro / Escuro / Automático)
 * e aplica-a via AppCompatDelegate.setDefaultNightMode, que é o mecanismo
 * correto do AppCompat para forçar o modo dia/noite independentemente do
 * que o sistema operativo estiver a usar.
 *
 * IMPORTANTE: applyStoredTheme() deve ser chamado o mais cedo possível em
 * cada Activity — idealmente na Application.onCreate() e/ou antes de
 * super.onCreate() em cada Activity — porque o AppCompatDelegate só tem
 * efeito visual correto se for definido antes do setContentView() correr.
 */
object ThemePreferenceManager {

    const val THEME_LIGHT = "light"
    const val THEME_DARK = "dark"
    const val THEME_AUTO = "auto"

    private const val PREFS_NAME = "nexa_prefs"
    private const val KEY_THEME_MODE = "theme_mode"

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /** Devolve o modo atualmente guardado (por omissão: Automático). */
    fun getThemeMode(context: Context): String {
        return prefs(context).getString(KEY_THEME_MODE, THEME_AUTO) ?: THEME_AUTO
    }

    /** Guarda a escolha e aplica-a imediatamente via AppCompatDelegate. */
    fun setThemeMode(context: Context, mode: String) {
        prefs(context).edit().putString(KEY_THEME_MODE, mode).apply()
        applyMode(mode)
    }

    /**
     * Aplica o modo atualmente guardado nas preferências. Chamar isto no
     * arranque da app (Application.onCreate) e no arranque de cada Activity
     * antes de super.onCreate()/setContentView(), para garantir que o
     * primeiro frame já nasce com o tema correto (evita "flash" de tema
     * errado).
     */
    fun applyStoredTheme(context: Context) {
        applyMode(getThemeMode(context))
    }

    private fun applyMode(mode: String) {
        val nightMode = when (mode) {
            THEME_LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
            THEME_DARK -> AppCompatDelegate.MODE_NIGHT_YES
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }
        if (AppCompatDelegate.getDefaultNightMode() != nightMode) {
            AppCompatDelegate.setDefaultNightMode(nightMode)
        }
    }

    /**
     * Devolve true se, dado o modo guardado e o estado atual do sistema,
     * o resultado visual efetivo é "claro". Útil para decidir ícones/
     * tintas que não sejam automaticamente resolvidos por values/values-night.
     */
    fun isEffectivelyLight(context: Context): Boolean {
        return context.resources.getBoolean(com.nexa.app.R.bool.isLightTheme)
    }
}