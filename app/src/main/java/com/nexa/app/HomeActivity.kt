package com.nexa.app

import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.OnBackPressedCallback
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager
import com.nexa.app.webview.WebViewPool

/**
 * Única Activity de navegação da app. Cada rota (home, chat, docs...) tem
 * o seu próprio WebView mantido vivo em WebViewPool — a primeira visita
 * mostra o loadingOverlay enquanto carrega; visitas seguintes trocam
 * instantaneamente qual WebView está visível, sem recarregar nada.
 *
 * O drawer de CONTA (AccountDrawerSheet) espelha AppDrawer.svelte e abre
 * quando o utilizador toca no profile-btn do AppHeader — via ponte JS
 * AndroidDrawer.openAccountDrawer().
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var container: FrameLayout
    private lateinit var loadingOverlay: FrameLayout

    private val routeStack = mutableListOf("home")
    private var currentRoute: String = "home"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        container = findViewById(R.id.webViewContainer)
        loadingOverlay = findViewById(R.id.loadingOverlay)

        val isDark = (resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES
        applyNativeStatusBar(isDark)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView = WebViewPool.get(
                    context = this@HomeActivity,
                    route = currentRoute,
                    onThemeChanged = ::applyNativeStatusBar,
                    onExternalRoute = ::navigateTo,
                    onOpenAccountDrawer = { showAccountDrawer() },
                    onFirstLoadFinished = {}
                )
                if (webView.canGoBack()) {
                    webView.goBack()
                } else if (routeStack.size > 1) {
                    routeStack.removeAt(routeStack.lastIndex)
                    showRoute(routeStack.last(), pushToStack = false)
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState == null) {
            showRoute("home", pushToStack = false)
        }
    }

    /**
     * Chamado pelo drawer nativo, pelo AppHeader.svelte (via RouteMap ->
     * onExternalRoute), ou por qualquer navegação interna do site que saia
     * da rota atual. Substitui a lógica antiga de abrir uma Activity nova.
     */
    private fun navigateTo(route: String, @Suppress("UNUSED_PARAMETER") url: String) {
        showRoute(route, pushToStack = true)
    }

    private fun showRoute(route: String, pushToStack: Boolean) {
        currentRoute = route
        if (pushToStack && routeStack.last() != route) {
            routeStack.add(route)
        }

        val showLoader = !WebViewPool.isAlreadyLoaded(route)
        loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE

        val webView = WebViewPool.get(
            context = this,
            route = route,
            onThemeChanged = ::applyNativeStatusBar,
            onExternalRoute = ::navigateTo,
            onOpenAccountDrawer = { showAccountDrawer() },
            onFirstLoadFinished = {
                runOnUiThread {
                    if (currentRoute == route) {
                        loadingOverlay.visibility = View.GONE
                    }
                }
            }
        )

        container.removeAllViews()
        (webView.parent as? android.view.ViewGroup)?.removeView(webView)
        container.addView(webView)
    }

    private fun showAccountDrawer() {
        AccountDrawerSheet(
            context = this,
            onThemeSelected = { theme -> applyThemeSelection(theme) },
            onLogoutConfirmed = { performLogout() }
        ).show()
    }

    private fun applyThemeSelection(theme: String) {
        val webView = WebViewPool.get(
            context = this,
            route = currentRoute,
            onThemeChanged = ::applyNativeStatusBar,
            onExternalRoute = ::navigateTo,
            onOpenAccountDrawer = { showAccountDrawer() },
            onFirstLoadFinished = {}
        )
        webView.evaluateJavascript(
            "window.__nexaSetTheme && window.__nexaSetTheme('$theme');",
            null
        )
    }

    private fun performLogout() {
        SessionManager.clear(this)
        WebViewPool.clearAll()
        val intent = android.content.Intent(this, LoginActivity::class.java).apply {
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    private fun applyNativeStatusBar(isDark: Boolean) {
        runOnUiThread {
            val bg = androidx.core.content.ContextCompat.getColor(this, R.color.app_background)
            window.statusBarColor = bg
            val controller = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
            controller.isAppearanceLightStatusBars = !isDark
        }
    }
}