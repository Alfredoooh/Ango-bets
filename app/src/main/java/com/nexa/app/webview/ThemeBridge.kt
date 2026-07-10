package com.nexa.app.webview

import android.webkit.JavascriptInterface

/**
 * Ponte JS -> Kotlin para sincronizar tema em tempo real.
 * O lado Svelte (src/shared/theme.js) tem de chamar, dentro de syncTheme():
 *
 *   if (window.AndroidTheme) window.AndroidTheme.onThemeChanged(isDark);
 *
 * injetado no WebView com addJavascriptInterface(ThemeBridge(cb), "AndroidTheme").
 */
class ThemeBridge(private val onThemeChanged: (isDark: Boolean) -> Unit) {

    @JavascriptInterface
    fun onThemeChanged(isDark: Boolean) {
        onThemeChanged.invoke(isDark)
    }
}