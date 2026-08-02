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
 * PROTOCOLO DE ANTI-SALTO DO APPBAR (data-nexa-appbar):
 * Em vez de forçar scrollTo(0,0) globalmente ou restringir a lógica a
 * uma URL fixa (ex: só "/docs/"), este ficheiro injeta em TODAS as
 * páginas um pequeno guardião JS que:
 *   1. Não faz NADA sozinho — só arma um listener de focusin/focusout.
 *   2. Ao focar um campo editável, procura no DOM o(s) elemento(s)
 *      marcados com o atributo data-nexa-appbar="true".
 *   3. Se não existir nenhum elemento com esse atributo na página
 *      atual, o guardião não faz absolutamente nada — zero custo,
 *      zero risco de interferir com Home, Sheets antigos sem o
 *      atributo, ecrãs de login, etc.
 *   4. Se existir, mede a posição (getBoundingClientRect().top) desse
 *      elemento ANTES do foco. Depois do foco (e outra vez após um
 *      pequeno delay, para cobrir o resize do visualViewport quando o
 *      teclado abre), volta a medir. Se a posição mudou, é sinal de
 *      que o document fez scroll por baixo do elemento fixed — só
 *      NESSE caso força scrollTo(0,0). Se o elemento não se mexeu,
 *      não faz nada.
 * Isto significa que:
 *   - Qualquer app Svelte (Docs, Sheets, Whiteboard, etc.) "adere" ao
 *     protocolo apenas pondo data-nexa-appbar="true" no elemento do
 *     appbar/header. Não precisa de nenhuma mudança nativa nova.
 *   - Nenhum outro elemento (BottomToolbar, modais, FABs) é tocado,
 *     porque o guardião só mede e corrige o(s) elemento(s)
 *     explicitamente marcados.
 *   - Path fica app-agnóstico: já não há string "/docs/" hardcoded
 *     aqui — a decisão de "este ecrã precisa da proteção" passa a
 *     viver inteiramente no HTML/Svelte de cada app.
 */
object WebViewSetup {

    private const val APPBAR_ANTI_JUMP_JS = """
        (function() {
            if (window.__nexaAppbarGuardInstalled) { return; }
            window.__nexaAppbarGuardInstalled = true;

            function isEditableTarget(el) {
                if (!el) return false;
                var tag = el.tagName ? el.tagName.toUpperCase() : '';
                return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
            }

            function getGuardedAppbars() {
                return document.querySelectorAll('[data-nexa-appbar="true"]');
            }

            function correctIfShifted(previousTops) {
                var appbars = getGuardedAppbars();
                if (appbars.length === 0) { return; }

                var shifted = false;
                appbars.forEach(function(el, i) {
                    var currentTop = el.getBoundingClientRect().top;
                    var previousTop = previousTops[i];
                    if (previousTop !== undefined && Math.abs(currentTop - previousTop) > 0.5) {
                        shifted = true;
                    }
                });

                if (shifted) {
                    window.scrollTo(0, 0);
                    if (document.scrollingElement) {
                        document.scrollingElement.scrollTop = 0;
                    }
                }
            }

            document.addEventListener('focusin', function(event) {
                if (!isEditableTarget(event.target)) { return; }

                var appbars = getGuardedAppbars();
                if (appbars.length === 0) { return; }

                var previousTops = [];
                appbars.forEach(function(el) {
                    previousTops.push(el.getBoundingClientRect().top);
                });

                correctIfShifted(previousTops);
                requestAnimationFrame(function() { correctIfShifted(previousTops); });
                setTimeout(function() { correctIfShifted(previousTops); }, 60);
                setTimeout(function() { correctIfShifted(previousTops); }, 250);
            }, { passive: true });

            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', function() {
                    var appbars = getGuardedAppbars();
                    if (appbars.length === 0) { return; }
                    var tops = [];
                    appbars.forEach(function(el) { tops.push(el.getBoundingClientRect().top); });
                    correctIfShifted(tops);
                }, { passive: true });
            }
        })();
    """

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
                injectAppbarAntiJumpGuard(view)
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

    /**
     * Corre em TODAS as páginas, mas fica inerte (não faz nada) em
     * qualquer página cujo HTML não tenha nenhum elemento com
     * data-nexa-appbar="true". Não há lista de URLs para manter.
     */
    private fun injectAppbarAntiJumpGuard(view: WebView) {
        view.evaluateJavascript(APPBAR_ANTI_JUMP_JS, null)
    }
}