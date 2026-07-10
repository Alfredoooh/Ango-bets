package com.nexa.app.webview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.http.SslError
import android.view.View
import android.webkit.CookieManager
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager

/**
 * Configuração partilhada do WebView usada tanto por HomeActivity como por
 * WebPageActivity, para não duplicar a lógica de JS, cookies, progress bar,
 * injeção de token e interceção de navegação entre rotas.
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
    progressBar: LinearProgressIndicator?,
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

    // Injeta o token de sessão como cookie para o Svelte (src/shared/api.js)
    // conseguir autenticar pedidos feitos a partir da própria página, se aplicável.
    SessionManager.getToken(context)?.let { token ->
        CookieManager.getInstance().setCookie(
            "https://${RouteMap.HOST}",
            "nexa_token=$token; Path=/; Secure"
        )
    }

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
                // Link para fora do site (ex.: termos de serviço externos) -> deixa o
                // sistema tratar, não abre Activity nativa nenhuma para isto.
                return false
            }

            val route = RouteMap.routeSegment(uri.path ?: "/")
            if (route != currentRoute) {
                onExternalRoute(route, url)
                return true
            }

            // Mesma rota (ex.: navegação interna dentro do Chat para uma conversa
            // específica) continua dentro do mesmo WebView.
            return false
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
            super.onPageStarted(view, url, favicon)
            progressBar?.visibility = View.VISIBLE
        }

        override fun onPageFinished(view: WebView, url: String?) {
            super.onPageFinished(view, url)
            progressBar?.visibility = View.GONE
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError
        ) {
            super.onReceivedError(view, request, error)
            progressBar?.visibility = View.GONE
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
        override fun onProgressChanged(view: WebView, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            progressBar?.progress = newProgress
            progressBar?.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
        }
    }
}