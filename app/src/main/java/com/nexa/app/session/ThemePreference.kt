// app/src/main/java/com/nexa/app/session/ThemePreference.kt
package com.nexa.app.session

import android.content.Context
import android.content.SharedPreferences

/**
 * Guarda a escolha de tema feita pelo utilizador dentro da app (drawer:
 * dark/light/system) num SharedPreferences simples e nativo, independente
 * do WebView.
 *
 * IMPORTANTE: esta classe NUNCA chama AppCompatDelegate.setDefaultNightMode.
 * Essa chamada força o Android a recriar automaticamente TODAS as
 * Activities vivas da app (é o comportamento nativo do AppCompatDelegate
 * ao mudar o night mode global) — era exatamente isso que causava o bug
 * de "trocar o tema muda tudo": o drawer fechava sozinho, o WebView
 * desaparecia e reaparecia, o loader nativo entrava de repente, porque a
 * Activity inteira estava a ser destruída e recriada só para mudar uma
 * cor. A app já resolve o tema manualmente e de forma местa (status bar
 * nativa via applyNativeStatusBar() + o próprio WebView via
 * window.__nexaSetTheme JS), então não há nenhuma necessidade do night
 * mode global do AppCompat — resolveIsDark() abaixo já é a única fonte
 * de verdade usada em todo o app.
 */
object ThemePreference {

    private const val PREFS_NAME = "nexa_theme_prefs"
    private const val KEY_THEME = "theme_mode"

    const val THEME_DARK = "dark"
    const val THEME_LIGHT = "light"
    const val THEME_SYSTEM = "system"

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /**
     * Grava apenas a preferência em disco. NÃO toca em nenhum mecanismo
     * global de recriação de Activity — quem chama isto (HomeActivity)
     * é responsável por repintar a UI nativa manualmente com
     * applyNativeStatusBar(resolveIsDark(context)) na mesma chamada.
     */
    fun save(context: Context, theme: String) {
        prefs(context).edit().putString(KEY_THEME, theme).apply()
    }

    fun get(context: Context): String =
        prefs(context).getString(KEY_THEME, THEME_SYSTEM) ?: THEME_SYSTEM

    /**
     * Mantido apenas por compatibilidade de chamada (ex.: Application.onCreate,
     * LoginActivity/RegisterActivity antes de setContentView) — mas agora é
     * um no-op intencional. Essas Activities já leem resolveIsDark(context)
     * diretamente para pintar a UI nativa; não precisam de nenhum efeito
     * colateral global aqui.
     */
    fun applyStoredTheme(context: Context) {
        // Intencionalmente vazio — ver comentário da classe.
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