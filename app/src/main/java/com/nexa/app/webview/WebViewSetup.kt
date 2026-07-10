package com.nexa.app.webview

import android.annotation.SuppressLint
import android.content.Context
import android.net.http.SslError
import android.webkit.CookieManager
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager

/**
 * Configuração partilhada do WebView usada tanto por HomeActivity como por
 * WebPageActivity, para não duplicar a lógica de JS, cookies, injeção de
 * sessão e interceção de navegação entre rotas.
 *
 * O site (src/shared/auth-guard.js) verifica sessão via
 * localStorage.getItem('nexa_user'), não via cookie — por isso a sessão
 * nativa é injetada como localStorage, com o mesmo shape que
 * AuthApiService.login()/register() gravam no browser (token, id, name,
 * email, credits). Sem isto o site pede sempre login, mesmo já autenticado
 * nativamente.
 *
 * onExternalRoute é chamado sempre que o WebView tentar navegar para uma
 * rota do site (ex.: /chat/) diferente da rota atual — quem chama decide
 * se abre uma nova Activity nativa (via RouteMap.openRoute) ou ignora.
 *
 * onOpenAccountDrawer é chamado quando o AppHeader.svelte da Home invoca
 * window.AndroidDrawer.openAccountDrawer() — só faz sentido passar isto
 * em HomeActivity; em WebPageActivity pode ser omitido (lambda vazia).
 */
@SuppressLint("SetJavaScriptEnabled")
fun WebView.setupNexaWebView(
    context: Context,
    currentRoute: String,
    onThemeChanged: (isDark: Boolean) -> Unit,
    onExternalRoute: (route: String, url: String) -> Unit,
    onOpenAccountDrawer: (() -> Unit)? = null
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

    webViewClient = object : WebViewClient() {

        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest
        ): Boolean {
            val uri = request.url
            val url = uri.toString()

            if (uri.host != RouteMap.HOST) {
                return false
            }

            val route = RouteMap.routeSegment(uri.path ?: "/")
            if (route != currentRoute) {
                onExternalRoute(route, url)
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
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError
        ) {
            super.onReceivedError(view, request, error)
        }

        override fun onReceivedSslError(
            view: WebView,
            handler: SslErrorHandler,
            error: SslError
        ) {
            handler.cancel()
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