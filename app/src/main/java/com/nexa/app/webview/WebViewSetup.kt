// app/src/main/java/com/nexa/app/webview/WebViewSetup.kt
package com.nexa.app.webview

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.net.Uri
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference

/**
 * Configuração central do WebView: settings, client, chrome client e
 * ligação das bridges (tema, sessão, links externos, permissões,
 * seletor de ficheiros/galeria, armazenamento SAF para export).
 *
 * A sessão (token guardado via SessionManager, após login/registo nativo
 * contra o Worker) é injetada diretamente em localStorage do WebApp em
 * onPageStarted e onPageFinished, replicando o mecanismo comprovado que o
 * WebApp (Svelte) já lê em src/shared/api.js / auth store.
 *
 * NOTA: a correção do "appbar a saltar" com o teclado (docs, sheets,
 * whiteboard) deixou de ser feita aqui. Antes havia uma injeção JS
 * global (injectAppbarJumpFix) que corria em TODAS as páginas da app,
 * independentemente da URL, e que forçava window.scrollTo(0,0) no
 * document inteiro sempre que qualquer campo editável recebia foco.
 * Isso duplicava — e sobrepunha-se a — uma lógica equivalente já
 * implementada dentro do próprio DocPage.svelte (Nexa Docs), que trava
 * apenas o scroll do document root e nunca interfere com o scroll
 * interno de containers próprios da página (ex: .canvas-scroll). Ter
 * as duas em paralelo era redundante e, pior, aplicava um
 * comportamento pensado exclusivamente para o editor de Docs a todo o
 * resto do app (Home, Sheets, Whiteboard, ecrãs de login), onde esses
 * outros apps podem ter as suas próprias intenções de scroll no
 * window/document que esta injeção estaria a esmagar sem necessidade.
 * Cada app Svelte que precisar deste comportamento deve implementá-lo
 * localmente, como o Docs já faz.
 */
object WebViewSetup {

    @SuppressLint("SetJavaScriptEnabled")
    fun configure(
        activity: Activity,
        webView: WebView,
        fileChooserBridge: FileChooserBridge? = null,
        storageBridge: AndroidStorageBridge? = null
    ) {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
        }

        android.webkit.CookieManager.getInstance().setAcceptCookie(true)
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        ThemeBridge.attach(activity, webView)
        SessionBridge.attach(activity, webView)

        if (storageBridge != null) {
            webView.addJavascriptInterface(storageBridge, "AndroidStorage")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: android.webkit.WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                return if (ExternalLinkHandler.isExternal(url)) {
                    ExternalLinkHandler.open(activity, url)
                    true
                } else {
                    false
                }
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                injectSession(view, activity)
                injectTheme(view, activity)
            }

            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                injectSession(view, activity)
                injectTheme(view, activity)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: android.webkit.PermissionRequest) {
                PermissionManager.handle(activity, request)
            }

            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                if (fileChooserBridge == null || activity !is AppCompatActivity) {
                    return false
                }
                return fileChooserBridge.handleShowFileChooser(filePathCallback, fileChooserParams)
            }
        }
    }

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

    /**
     * Sincroniza o tema escolhido no lado nativo (ex: toggle sol/lua na
     * LoginActivity, que não tem WebView disponível) com o localStorage
     * do PWA, e chama syncTheme() se já estiver definida em window, para
     * o tema aplicar-se imediatamente sem esperar reload.
     */
    private fun injectTheme(view: WebView, context: Context) {
        val isDark = ThemePreference.resolveIsDark(context)
        val value = if (isDark) "dark" else "light"
        view.evaluateJavascript(
            """
            localStorage.setItem('nexa_theme', '$value');
            if (window.__nexaSetTheme) { window.__nexaSetTheme('$value'); }
            """.trimIndent(),
            null
        )
    }
}