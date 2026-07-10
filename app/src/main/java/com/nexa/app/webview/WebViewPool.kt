package com.nexa.app.webview

import android.content.Context
import android.view.ViewGroup
import android.webkit.WebView
import com.nexa.app.nav.RouteMap

/**
 * Mantém um WebView vivo por rota, em memória, para navegação instantânea
 * entre páginas já visitadas. A primeira visita a uma rota cria o WebView
 * e carrega a URL (mostrando o loadingOverlay em HomeActivity enquanto isso);
 * visitas seguintes só trocam qual WebView está visível no container.
 *
 * O pool vive preso ao processo da app (object singleton), não à Activity,
 * para sobreviver a recriações de configuração (rotação, etc.).
 */
object WebViewPool {

    private val webViews = mutableMapOf<String, WebView>()
    private val loadedRoutes = mutableSetOf<String>()

    /**
     * Devolve o WebView da rota, criando-o (e iniciando o carregamento) se
     * for a primeira vez que esta rota é visitada nesta sessão da app.
     * onFirstLoadFinished é chamado uma única vez, quando essa primeira
     * carga terminar — é o sinal para esconder o loadingOverlay.
     */
    fun get(
        context: Context,
        route: String,
        onThemeChanged: (isDark: Boolean) -> Unit,
        onExternalRoute: (route: String, url: String) -> Unit,
        onOpenAccountDrawer: (() -> Unit)?,
        onFirstLoadFinished: () -> Unit
    ): WebView {
        val existing = webViews[route]
        if (existing != null) {
            return existing
        }

        val webView = WebView(context.applicationContext).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        webView.setupNexaWebView(
            context = context,
            currentRoute = route,
            onThemeChanged = onThemeChanged,
            onExternalRoute = onExternalRoute,
            onOpenAccountDrawer = onOpenAccountDrawer,
            onFirstPageFinished = {
                if (loadedRoutes.add(route)) {
                    onFirstLoadFinished()
                }
            }
        )

        webViews[route] = webView
        webView.loadUrl(RouteMap.pageUrl(route))
        return webView
    }

    /**
     * Se a rota já foi carregada pelo menos uma vez, não há loader a mostrar.
     */
    fun isAlreadyLoaded(route: String): Boolean = route in loadedRoutes

    /**
     * Remove um WebView do pool e destrói-o — usar apenas em casos como
     * logout, onde a sessão muda e as páginas em cache ficam desatualizadas.
     */
    fun clearAll() {
        webViews.values.forEach { it.destroy() }
        webViews.clear()
        loadedRoutes.clear()
    }
}