package com.nexa.app.webview

import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.nexa.app.session.ThemePreference

/**
 * Ponte bidirecional de tema entre o WebApp (Svelte) e o shell nativo.
 * O WebApp chama setTheme() via JS quando o utilizador muda o tema lá dentro;
 * o nativo aplica o tema guardado assim que a Activity arranca.
 */
class ThemeBridge(private val activity: Activity) {

    @JavascriptInterface
    fun setTheme(mode: String) {
        activity.runOnUiThread {
            ThemePreference.saveTheme(activity, mode)
            ThemePreference.applyStoredTheme(activity)
        }
    }

    @JavascriptInterface
    fun getTheme(): String {
        return ThemePreference.getStoredTheme(activity)
    }

    companion object {
        fun attach(activity: Activity, webView: WebView) {
            webView.addJavascriptInterface(ThemeBridge(activity), "NativeTheme")
        }
    }
}