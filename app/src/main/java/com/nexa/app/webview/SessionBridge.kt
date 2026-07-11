// app/src/main/java/com/nexa/app/webview/SessionBridge.kt
package com.nexa.app.webview

import android.webkit.JavascriptInterface

/**
 * Ponte JS -> Kotlin para o logout. O AppDrawer.svelte, dentro de
 * confirmLogout(), depois de tratar do logout no lado web (limpar
 * localStorage/redirecionar), também chama:
 *
 *   if (window.AndroidSession) window.AndroidSession.onLogout();
 *
 * injetada no WebView com addJavascriptInterface(SessionBridge(cb), "AndroidSession").
 * Isto limpa a sessão nativa (SessionManager) e devolve o utilizador ao
 * ecrã de Login nativo.
 */
class SessionBridge(private val onLogout: () -> Unit) {

    @JavascriptInterface
    fun onLogout() {
        onLogout.invoke()
    }
}