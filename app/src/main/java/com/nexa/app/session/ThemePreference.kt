package com.nexa.app.session

import android.content.Context
import android.content.SharedPreferences
import androidx.appcompat.app.AppCompatDelegate

/**
 * Guarda a escolha de tema feita pelo utilizador dentro da app (drawer:
 * dark/light/system) num SharedPreferences simples e nativo, independente
 * do WebView. Isto é o que faltava: sem isto, LoginActivity/RegisterActivity
 * (que não têm WebView nenhuma) não tinham como saber a escolha do
 * utilizador, e o Android só olhava para o modo do SISTEMA (values-night),
 * ignorando qualquer seleção feita dentro da app.
 *
 * Chamar applyTheme(context) no onCreate() de TODA Activity nativa, ANTES
 * de super.onCreate()/setContentView(), para o tema certo já estar ativo
 * antes do primeiro layout pass.
 */
object ThemePreference {

    private const val PREFS_NAME = "nexa_theme_prefs"
    private const val KEY_THEME = "theme_mode"

    const val THEME_DARK = "dark"
    const val THEME_LIGHT = "light"
    const val THEME_SYSTEM = "system"

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun save(context: Context, theme: String) {
        prefs(context).edit().putString(KEY_THEME, theme).apply()
        applyNightMode(theme)
    }

    fun get(context: Context): String =
        prefs(context).getString(KEY_THEME, THEME_SYSTEM) ?: THEME_SYSTEM

    /**
     * Aplica o AppCompatDelegate.setDefaultNightMode global — isto é o que
     * força values-night a ativar independentemente do modo do sistema.
     * Deve ser chamado o mais cedo possível (idealmente na Application,
     * e de novo em cada Activity antes de setContentView, para cobrir o
     * caso de a Activity ser recriada isoladamente).
     */
    fun applyStoredTheme(context: Context) {
        applyNightMode(get(context))
    }

    private fun applyNightMode(theme: String) {
        val mode = when (theme) {
            THEME_DARK -> AppCompatDelegate.MODE_NIGHT_YES
            THEME_LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }
        AppCompatDelegate.setDefaultNightMode(mode)
    }

    fun resolveIsDark(context: Context): Boolean {
        val theme = get(context)
        return when (theme) {
            THEME_DARK -> true
            THEME_LIGHT -> false
            else -> {
                val uiMode = context.resources.configuration.uiMode and
                    android.content.res.Configuration.UI_MODE_NIGHT_MASK
                uiMode == android.content.res.Configuration.UI_MODE_NIGHT_YES
            }
        }
    }
}