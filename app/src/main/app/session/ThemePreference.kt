// app/src/main/java/com/nexa/app/session/ThemePreference.kt
package com.nexa.app.session

import android.content.Context
import android.content.SharedPreferences

/**
 * Fonte de verdade do tema do lado nativo. Gravada sempre que o PWA
 * chama window.AndroidTheme.onThemeChanged(isDark) (ver ThemeBridge.kt).
 * Isto permite que Activities nativas SEM WebView (LoginActivity,
 * EmailLoginActivity, RegisterActivity) leiam o tema atual do PWA antes
 * de desenhar a própria UI, mantendo nativo + web sempre alinhados,
 * incluindo quando o utilizador escolheu "seguir o sistema".
 */
object ThemePreference {

    private const val PREFS_NAME = "nexa_theme_prefs"
    private const val KEY_IS_DARK = "is_dark"
    private const val KEY_HAS_VALUE = "has_value"

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /** Chamado pelo ThemeBridge sempre que o PWA reporta o seu tema atual. */
    fun saveIsDark(context: Context, isDark: Boolean) {
        prefs(context).edit()
            .putBoolean(KEY_IS_DARK, isDark)
            .putBoolean(KEY_HAS_VALUE, true)
            .apply()
    }

    /**
     * Resolve o tema atual: usa o último valor reportado pelo PWA se
     * existir; caso contrário (primeiríssimo arranque, antes de qualquer
     * WebView ter carregado), cai no prefers-color-scheme do próprio
     * Android — o mesmo fallback que o theme.js usa via matchMedia.
     */
    fun resolveIsDark(context: Context): Boolean {
        val p = prefs(context)
        if (p.getBoolean(KEY_HAS_VALUE, false)) {
            return p.getBoolean(KEY_IS_DARK, true)
        }
        val uiMode = context.resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK
        return uiMode == android.content.res.Configuration.UI_MODE_NIGHT_YES
    }
}