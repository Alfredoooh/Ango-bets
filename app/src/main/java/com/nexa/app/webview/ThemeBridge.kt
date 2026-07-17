// app/src/main/java/com/nexa/app/webview/ThemeBridge.kt
package com.nexa.app.webview

import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.nexa.app.session.ThemePreference

/**
 * Ponte JS -> Kotlin de tema. O WebApp (shared/theme.js) chama, dentro
 * de syncTheme(), sempre que o tema muda (manual ou por prefers-color-scheme):
 *
 *   if (window.AndroidTheme) window.AndroidTheme.onThemeChanged(isDark);
 *
 * Isto grava o valor em ThemePreference (para Activities nativas sem
 * WebView o lerem no arranque) e repinta a status bar/nav bar da
 * Activity atual imediatamente, sem esperar recriação.
 */
class ThemeBridge(private val activity: Activity) {

    @JavascriptInterface
    fun onThemeChanged(isDark: Boolean) {
        activity.runOnUiThread {
            ThemePreference.saveIsDark(activity, isDark)
            (activity as? ThemeAware)?.applyStatusBarAppearance(isDark)
        }
    }

    companion object {
        fun attach(activity: Activity, webView: WebView) {
            webView.addJavascriptInterface(ThemeBridge(activity), "AndroidTheme")
        }
    }
}

/** Implementada por qualquer Activity com WebView que precise de repintar a status bar ao vivo. */
interface ThemeAware {
    fun applyStatusBarAppearance(isDark: Boolean)
}