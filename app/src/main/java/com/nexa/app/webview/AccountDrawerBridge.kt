package com.nexa.app.webview

import android.webkit.JavascriptInterface

/**
 * Ponte JS -> Kotlin para o AppHeader.svelte abrir o drawer de conta nativo.
 * Chamada pelo profile-btn em AppHeader.svelte:
 *   window.AndroidDrawer.openAccountDrawer()
 * injetado no WebView com addJavascriptInterface(AccountDrawerBridge(cb), "AndroidDrawer").
 */
class AccountDrawerBridge(private val onOpen: () -> Unit) {

    @JavascriptInterface
    fun openAccountDrawer() {
        onOpen.invoke()
    }
}