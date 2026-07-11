// app/src/main/java/com/nexa/app/webview/ThemeBridge.kt
package com.nexa.app.webview

import android.webkit.JavascriptInterface

/**
 * Ponte JS -> Kotlin para sincronizar tema em tempo real.
 * O lado Svelte (src/shared/theme.js) tem de chamar, dentro de syncTheme():
 *
 *   if (window.AndroidTheme) window.AndroidTheme.onThemeChanged(isDark);
 *
 * injetado no WebView com addJavascriptInterface(ThemeBridge(cb), "AndroidTheme").
 *
 * Cada chamada faz a status bar nativa inverter imediatamente a sua
 * aparência (ícones/texto claros ou escuros) em relação ao tema atual do
 * WebApp — nunca pinta um fundo sólido, porque a status bar é sempre
 * transparente e o conteúdo do WebView é que fica visível por trás dela.
 */
class ThemeBridge(private val onThemeChanged: (isDark: Boolean) -> Unit) {

    @JavascriptInterface
    fun onThemeChanged(isDark: Boolean) {
        onThemeChanged.invoke(isDark)
    }
}