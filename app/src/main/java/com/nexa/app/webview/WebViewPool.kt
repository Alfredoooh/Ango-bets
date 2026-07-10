// app/src/main/java/com/nexa/app/webview/WebViewPool.kt
package com.nexa.app.webview

import android.content.Context
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebView
import com.nexa.app.nav.RouteMap

/**
 * Mantém um WebView vivo por rota, em memória, para navegação instantânea
 * entre páginas já visitadas. A primeira visita a uma rota cria o WebView
 * e carrega a URL (mostrando o loadingOverlay em HomeActivity enquanto isso);
 * visitas seguintes só trocam qual WebView está visível no container.
 *
 * O pool vive preso ao processo da app (object singleton), não à Activity,
 * para sobreviver a recriações de configuração (rotação, etc.) — mas NÃO
 * sobrevive à morte do processo pelo sistema (app em background há muito
 * tempo, pouca memória, etc.). É por isso que HomeActivity nunca deve
 * confiar sozinho no routeStack/currentRoute restaurados do
 * savedInstanceState para decidir se mostra o loader nativo: esse Bundle
 * sobrevive à morte do processo, este pool não. hasWebView() é a pergunta
 * certa a fazer nessa hora.
 */
object WebViewPool {

    private val webViews = mutableMapOf<String, WebView>()
    private val loadedRoutes = mutableSetOf<String>()

    /**
     * Devolve o WebView da rota, criando-o (e iniciando o carregamento) se
     * for a primeira vez que esta rota é visitada nesta sessão da app.
     * onFirstLoadFinished é chamado uma única vez, quando essa primeira
     * carga terminar — é o sinal para esconder o loadingOverlay. Recebe a
     * própria rota, para quem escuta (HomeActivity.handleFirstLoadFinished)
     * confirmar que ainda é a rota atual sem depender de closures antigas.
     */
    fun get(
        context: Context,
        route: String,
        isDark: Boolean,
        onThemeChanged: (isDark: Boolean) -> Unit,
        onExternalRoute: (route: String, url: String) -> Unit,
        onOpenAccountDrawer: (() -> Unit)?,
        onFirstLoadFinished: (route: String) -> Unit,
        onPermissionRequest: ((PermissionRequest) -> Unit)? = null,
        onShowFileChooser: ((ValueCallback<Array<android.net.Uri>>, android.webkit.WebChromeClient.FileChooserParams) -> Boolean)? = null
    ): WebView {
        val existing = webViews[route]
        if (existing != null) {
            return existing
        }

        // Nasce com o fundo nativo já certo (dark/light), para nunca haver
        // um frame branco por trás do loadingOverlay enquanto a página
        // ainda está a carregar o CSS/tema real via JS.
        val bg = if (isDark) android.graphics.Color.parseColor("#0F0F0F") else android.graphics.Color.WHITE
        val webView = WebView(context.applicationContext).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(bg)
        }

        webView.setupNexaWebView(
            context = context,
            currentRoute = route,
            onThemeChanged = onThemeChanged,
            onExternalRoute = onExternalRoute,
            onOpenAccountDrawer = onOpenAccountDrawer,
            onFirstPageFinished = {
                loadedRoutes.add(route)
                onFirstLoadFinished(route)
            },
            onPermissionRequest = onPermissionRequest,
            onShowFileChooser = onShowFileChooser
        )

        webViews[route] = webView
        webView.loadUrl(RouteMap.pageUrl(route))
        return webView
    }

    /**
     * Se esta rota já tem um WebView vivo NESTE processo, não há loader
     * nativo a mostrar — mesmo que a app tenha sido recriada depois de o
     * sistema matar o processo em background e o utilizador "voltar" para
     * uma rota que o Bundle diz que já era a atual. isAlreadyLoaded() por si
     * só não chega para essa distinção, porque loadedRoutes também é limpo
     * sempre que o processo morre; hasWebView() é a mesma verdade
     * (existência real do WebView), então as duas ficam sempre coerentes
     * dentro do mesmo processo.
     */
    fun isAlreadyLoaded(route: String): Boolean = route in loadedRoutes

    fun hasWebView(route: String): Boolean = webViews.containsKey(route)

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