package com.nexa.app

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager
import com.nexa.app.webview.setupNexaWebView

/**
 * Home. Sem DrawerLayout de navegação entre apps — a navegação entre
 * home/chat/docs/etc continua a ser feita dentro do próprio Svelte (grid
 * de apps), não por um menu nativo.
 *
 * O único elemento nativo aqui é o drawer de CONTA (AccountDrawerSheet),
 * que espelha AppDrawer.svelte e abre quando o utilizador toca no
 * profile-btn do AppHeader — via ponte JS AndroidDrawer.openAccountDrawer().
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val currentRoute = "home"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        webView = findViewById(R.id.webView)

        val isDark = (resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES
        applyNativeStatusBar(isDark)

        setupWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(RouteMap.pageUrl(currentRoute))
        }
    }

    private fun setupWebView() {
        webView.setupNexaWebView(
            context = this,
            currentRoute = currentRoute,
            onThemeChanged = { isDark -> applyNativeStatusBar(isDark) },
            onExternalRoute = { route, _ ->
                RouteMap.openRoute(this, route)
            },
            onOpenAccountDrawer = { showAccountDrawer() }
        )
    }

    private fun showAccountDrawer() {
        AccountDrawerSheet(
            context = this,
            onThemeSelected = { theme -> applyThemeSelection(theme) },
            onLogoutConfirmed = { performLogout() }
        ).show()
    }

    private fun applyThemeSelection(theme: String) {
        webView.evaluateJavascript(
            "window.__nexaSetTheme && window.__nexaSetTheme('$theme');",
            null
        )
    }

    private fun performLogout() {
        SessionManager.clear(this)
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