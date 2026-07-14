// app/src/main/java/com/nexa/app/webview/WebViewSetup.kt (ficheiro completo, corrigido)
package com.nexa.app.webview

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.net.http.SslError
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import com.nexa.app.localserver.StorageBridge
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference

/**
 * Configuração do WebView único da app. O site (src/shared/auth-guard.js)
 * verifica sessão via localStorage.getItem('nexa_user'), não via cookie —
 * por isso a sessão nativa é injetada como localStorage, com o mesmo shape
 * que AuthApiService.login()/register() gravam no browser (token, id, name,
 * email, credits).
 *
 * Toda a navegação interna do host da app (mobilewebin.onrender.com) fica
 * por conta do próprio WebView — não há mais interceção de rota nem troca
 * de Activity nativa: shouldOverrideUrlLoading só intercepta links que
 * saiam do host da app, abrindo-os numa Chrome Custom Tab (ExternalLinkHandler),
 * exatamente como o ChatGPT faz: sem sair da app, mas com o motor e a
 * sessão do browser do sistema.
 *
 * ERRO DE REDE: em vez da tela nativa feia do WebView (o "ERR_INTERNET_
 * DISCONNECTED" com o dinossauro/ícone do sistema), onReceivedError troca
 * o conteúdo do WebView por uma overlay nativa mínima — só um botão
 * "Recarregar" centrado — mas SÓ quando o erro é do próprio pedido
 * principal (request.isForMainFrame), nunca para falhas de recursos
 * secundários (imagens, fontes, analytics) que não devem esconder a
 * página inteira.
 *
 * onThemeChanged é chamado pela ponte AndroidTheme sempre que o WebApp
 * mudar de tema, para a Activity poder inverter a aparência da status bar.
 *
 * onLogout é chamado pela ponte AndroidSession sempre que o utilizador
 * confirmar "Terminar sessão" dentro do WebApp (AppDrawer.svelte), para a
 * Activity limpar a sessão nativa e voltar ao ecrã de Login.
 *
 * onPermissionRequest e onShowFileChooser são repassados para fora
 * (HomeActivity) porque pedir permissão runtime e abrir o seletor de
 * ficheiros do sistema exige uma Activity — o WebView em si não tem
 * acesso a ActivityResultLauncher.
 *
 * AndroidStorage (StorageBridge) é registada aqui também, expondo
 * hasPermission(), requestPermission(), getRootPath(), listFolders(path),
 * createFolder(parentPath, name) e exportDocument(html, targetPath,
 * format, mode) ao WebApp — chamado por ExportPickerPage.svelte
 * (docs.zip), que é a própria tela de escolha de pasta/formato dentro
 * do WebApp. Esta ponte não desenha nenhuma UI nativa — só dá acesso a
 * dados de sistema de ficheiros e à geração real de .docx/.pdf.
 */
@SuppressLint("SetJavaScriptEnabled")
fun WebView.setupNexaWebView(
    context: Context,
    onThemeChanged: (isDark: Boolean) -> Unit,
    onLogout: (() -> Unit)? = null,
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
    addJavascriptInterface(SessionBridge { onLogout?.invoke() }, "AndroidSession")
    if (context is Activity) {
        addJavascriptInterface(StorageBridge(context), "AndroidStorage")
    }

    val errorOverlayHolder = NetworkErrorOverlay(this)

    webViewClient = object : WebViewClient() {

        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest
        ): Boolean {
            val uri = request.url

            // Dentro do host da própria app: deixa o WebView navegar
            // normalmente, sem qualquer interceção nativa — é o WebApp
            // (Svelte) que decide tudo sobre as suas próprias rotas.
            if (uri.host == RouteMap.HOST) {
                return false
            }

            // Fora do host da app: abre numa Chrome Custom Tab, mantendo o
            // utilizador "dentro da app" visualmente, tal como o ChatGPT.
            ExternalLinkHandler.open(context, uri)
            return true
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
            super.onPageStarted(view, url, favicon)
            errorOverlayHolder.hide()
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
            if (request.isForMainFrame) {
                errorOverlayHolder.show(context) {
                    errorOverlayHolder.hide()
                    view.reload()
                }
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

        override fun onPermissionRequest(request: PermissionRequest) {
            if (onPermissionRequest != null) {
                onPermissionRequest(request)
            } else {
                request.deny()
            }
        }

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
 * Overlay nativa mínima de erro de rede: um FrameLayout adicionado por
 * cima do WebView (mesmo pai), cor de fundo sólida igual ao tema atual,
 * com um único botão "Recarregar" centrado. Sem ícones de sistema, sem
 * texto de erro técnico — só a ação que o utilizador precisa de tomar.
 */
private class NetworkErrorOverlay(private val webView: WebView) {

    private var overlay: FrameLayout? = null

    fun show(context: Context, onReload: () -> Unit) {
        if (overlay != null) return
        val parent = webView.parent as? ViewGroup ?: return

        val isDark = ThemePreference.resolveIsDark(context)
        val bgColor = if (isDark) Color.parseColor("#17171A") else Color.WHITE

        val reloadButton = Button(context).apply {
            text = "Recarregar"
            isAllCaps = false
            setTextColor(Color.WHITE)
            textSize = 15f
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#2F7BF6"))
                cornerRadius = dp(context, 14).toFloat()
            }
            setPadding(dp(context, 28), dp(context, 12), dp(context, 28), dp(context, 12))
            setOnClickListener { onReload() }
        }

        val container = FrameLayout(context).apply {
            setBackgroundColor(bgColor)
            addView(
                reloadButton,
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { gravity = Gravity.CENTER }
            )
        }

        parent.addView(
            container,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        overlay = container
    }

    fun hide() {
        val parent = webView.parent as? ViewGroup ?: return
        overlay?.let { parent.removeView(it) }
        overlay = null
    }

    private fun dp(context: Context, value: Int): Int {
        return (value * context.resources.displayMetrics.density).toInt()
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