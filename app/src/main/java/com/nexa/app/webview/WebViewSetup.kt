// app/src/main/java/com/nexa/app/webview/WebViewSetup.kt
package com.nexa.app.webview

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference

/**
 * Configuração central do WebView: settings, client, chrome client e
 * ligação das bridges (tema, sessão, links externos, permissões).
 *
 * A sessão (token guardado via SessionManager, após login/registo nativo
 * contra o Worker) é injetada diretamente em localStorage do WebApp em
 * onPageStarted e onPageFinished, replicando o mecanismo comprovado que o
 * WebApp (Svelte) já lê em src/shared/api.js / auth store.
 */
object WebViewSetup {

    @SuppressLint("SetJavaScriptEnabled")
    fun configure(activity: Activity, webView: WebView) {
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