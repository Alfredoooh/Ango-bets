// app/src/main/java/com/nexa/app/WebPageActivity.kt
package com.nexa.app

import android.os.Bundle
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.nav.RouteMap
import com.nexa.app.webview.setupNexaWebView
import com.nexa.app.widgets.ExitConfirmDialog

/**
 * Activity auxiliar para abrir uma URL avulsa fora do fluxo principal.
 * Mesmo tratamento de teclado que HomeActivity: android:windowSoftInputMode
 * ="adjustNothing" no manifest + inset do IME aplicado manualmente como
 * padding-bottom do próprio WebView, nunca do root — a appbar dentro do
 * WebApp nunca se desloca porque o sistema nunca redimensiona nada.
 */
class WebPageActivity : AppCompatActivity() {

    private lateinit var root: FrameLayout
    private lateinit var webView: WebView

    companion object {
        const val EXTRA_URL = "extra_url"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        root = FrameLayout(this)
        setContentView(root)

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(webView)

        setupKeyboardInsets()

        val url = intent.getStringExtra(EXTRA_URL) ?: RouteMap.BASE_URL

        webView.setupNexaWebView(
            context = this,
            onThemeChanged = { isDark ->
                runOnUiThread {
                    WindowInsetsControllerCompat(window, window.decorView).apply {
                        isAppearanceLightStatusBars = !isDark
                        isAppearanceLightNavigationBars = !isDark
                    }
                }
            }
        )

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    ExitConfirmDialog.show(this@WebPageActivity) {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(url)
        }
    }

    private fun setupKeyboardInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
            val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            val navHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
            val bottomPadding = if (imeHeight > navHeight) imeHeight - navHeight else 0
            webView.setPadding(0, 0, 0, bottomPadding)
            insets
        }
        ViewCompat.requestApplyInsets(root)
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