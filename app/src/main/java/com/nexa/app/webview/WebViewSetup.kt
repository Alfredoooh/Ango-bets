// app/src/main/java/com/nexa/app/webview/WebViewSetup.kt
package com.nexa.app.webview

import android.annotation.SuppressLint
import android.content.Context
import android.net.http.SslError
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager

/**
 * Configuração partilhada do WebView, usada pelo WebViewPool para cada
 * rota. O site (src/shared/auth-guard.js) verifica sessão via
 * localStorage.getItem('nexa_user'), não via cookie — por isso a sessão
 * nativa é injetada como localStorage, com o mesmo shape que
 * AuthApiService.login()/register() gravam no browser (token, id, name,
 * email, credits).
 *
 * onFirstPageFinished é chamado uma única vez, na primeira vez que esta
 * instância de WebView termina de carregar — sinal para o WebViewPool
 * marcar a rota como já carregada e esconder o loader nativo.
 *
 * onPermissionRequest e onShowFileChooser são repassados para fora
 * (HomeActivity) porque pedir permissão runtime e abrir o seletor de
 * ficheiros do sistema exige uma Activity — o WebView em si não tem
 * acesso a ActivityResultLauncher.
 */
@SuppressLint("SetJavaScriptEnabled")
fun WebView.setupNexaWebView(
    context: Context,
    currentRoute: String,
    onThemeChanged: (isDark: Boolean) -> Unit,
    onExternalRoute: (route: String, url: String) -> Unit,
    onOpenAccountDrawer: (() -> Unit)? = null,
    onFirstPageFinished: (() -> Unit)? = null,
    onPermissionRequest: ((PermissionRequest) -> Unit)? = null,
    onShowFileChooser: ((ValueCallback<Array<android.net.Uri>>, android.webkit.WebChromeClient.FileChooserParams) -> Boolean)? = null
) {
    val settings = this.settings
    settings.javaScriptEnabled = true
    settings.domStorageEnabled = true
    settings.databaseEnabled = true
    settings.loadWithOverviewMode = true
    settings.useWideViewPort = true
    settings.mediaPlaybackRequiresUserGesture = false
    settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
    settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
    settings.setSupportZoom(true)
    settings.builtInZoomControls = false

    CookieManager.getInstance().setAcceptCookie(true)
    CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)

    addJavascriptInterface(ThemeBridge(onThemeChanged), "AndroidTheme")

    if (onOpenAccountDrawer != null) {
        addJavascriptInterface(AccountDrawerBridge(onOpenAccountDrawer), "AndroidDrawer")
    }

    var firstFinishReported = false

    webViewClient = object : WebViewClient() {

        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest
        ): Boolean {
            val uri = request.url

            if (uri.host != RouteMap.HOST) {
                return false
            }

            val route = RouteMap.routeSegment(uri.path ?: "/")
            if (route != currentRoute) {
                onExternalRoute(route, uri.toString())
                return true
            }

            return false
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
            super.onPageStarted(view, url, favicon)
            injectSession(view, context)
        }

        override fun onPageFinished(view: WebView, url: String?) {
            super.onPageFinished(view, url)
            injectSession(view, context)
            if (!firstFinishReported) {
                firstFinishReported = true
                onFirstPageFinished?.invoke()
            }
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError
        ) {
            super.onReceivedError(view, request, error)
            if (!firstFinishReported) {
                firstFinishReported = true
                onFirstPageFinished?.invoke()
            }
        }

        override fun onReceivedSslError(
            view: WebView,
            handler: SslErrorHandler,
            error: SslError
        ) {
            handler.cancel()
        }
    }

    webChromeClient = object : WebChromeClient() {

        // Disparado quando a página chama getUserMedia() (câmera/microfone
        // via JS, ex: gravação de áudio do App.svelte). Sem isto, o
        // WebView nega automaticamente qualquer pedido, e o getUserMedia
        // falha em silêncio no lado do JS.
        override fun onPermissionRequest(request: PermissionRequest) {
            if (onPermissionRequest != null) {
                onPermissionRequest(request)
            } else {
                request.deny()
            }
        }

        // Disparado quando a página abre um <input type="file">, incluindo
        // capture="camera" ou capture="user" para foto direta. Sem isto,
        // clicar no input não abre nada — é o mesmo tipo de silêncio que
        // afetava o pedido de câmera acima.
        override fun onShowFileChooser(
            webView: WebView,
            filePathCallback: ValueCallback<Array<android.net.Uri>>,
            fileChooserParams: FileChooserParams
        ): Boolean {
            val handler = onShowFileChooser
            return if (handler != null) {
                handler(filePathCallback, fileChooserParams)
            } else {
                false
            }
        }
    }
}

/**
 * Escreve o utilizador autenticado nativamente no localStorage do WebView,
 * com o mesmo shape que LoginPage.svelte/RegisterPage.svelte gravam
 * (JSON.stringify do AuthResponse), para src/shared/auth-guard.js
 * reconhecer a sessão e não pedir login de novo.
 */
private fun injectSession(view: WebView, context: Context) {
    val token = SessionManager.getToken(context) ?: return
    val userId = SessionManager.getUserId(context) ?: return
    val name = SessionManager.getName(context) ?: ""
    val email = SessionManager.getEmail(context) ?: ""
    val credits = SessionManager.getCredits(context)

    val json = org.json.JSONObject().apply {
        put("token", token)
        put("id", userId)
        put("name", name)
        put("email", email)
        put("credits", credits)
    }.toString()

    val escaped = json.replace("\\", "\\\\").replace("'", "\\'")
    view.evaluateJavascript(
        "localStorage.setItem('nexa_user', '$escaped');",
        null
    )
}