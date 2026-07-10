package com.nexa.app

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.nav.RouteMap
import com.nexa.app.webview.setupNexaWebView

/**
 * WebView puro, sem chrome nativo nenhum (sem appbar, sem drawer) — usado
 * pelas sub-apps (chat, docs, sheets, calendar...), que já têm o próprio
 * drawer desenhado em Svelte dentro da página. O botão voltar do Android
 * fecha esta Activity e volta à anterior na stack normal.
 */
class WebPageActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var currentRoute: String

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_ROUTE = "extra_route"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_web_page)

        webView = findViewById(R.id.webView)

        val url = intent.getStringExtra(EXTRA_URL) ?: RouteMap.pageUrl("home")
        currentRoute = intent.getStringExtra(EXTRA_ROUTE) ?: RouteMap.routeSegment(
            android.net.Uri.parse(url).path ?: "/"
        )

        webView.setupNexaWebView(
            context = this,
            currentRoute = currentRoute,
            onThemeChanged = { /* não há chrome nativo aqui para recolorir */ },
            onExternalRoute = { route, _ ->
                RouteMap.openRoute(this, route)
            }
        )

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    finish()
                    RouteMap.applyFinishTransition(this@WebPageActivity)
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(url)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}