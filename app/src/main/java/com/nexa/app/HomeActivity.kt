// app/src/main/java/com/nexa/app/HomeActivity.kt
package com.nexa.app

import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.View
import android.view.animation.AlphaAnimation
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.airbnb.lottie.LottieAnimationView
import com.airbnb.lottie.LottieProperty
import com.airbnb.lottie.model.KeyPath
import com.airbnb.lottie.value.LottieValueCallback
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeColors
import com.nexa.app.webview.ThemeAware
import com.nexa.app.webview.WebViewSetup

class HomeActivity : AppCompatActivity(), ThemeAware {

    private lateinit var webView: WebView
    private lateinit var loadingOverlay: View
    private lateinit var loadingSpinner: LottieAnimationView

    // Tempo mínimo que o overlay de loading tem de ficar visível,
    // independentemente de o WebView (onPageFinished) terminar antes disso.
    private val minLoadingDurationMs = 8000L
    private var loadingStartedAtMs = 0L
    private var pageAlreadyFinished = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupEdgeToEdgeStatusBar()
        disableSwipeGestures()

        setContentView(R.layout.activity_home)

        val isDark = ThemePreference.resolveIsDark(this)
        val bgColor = ThemeColors.get(isDark).bgPrimary
        findViewById<View>(R.id.rootHome).setBackgroundColor(bgColor)

        loadingOverlay = findViewById(R.id.loadingOverlay)
        loadingSpinner = findViewById(R.id.loadingSpinner)
        loadingOverlay.setBackgroundColor(bgColor)
        applyLottieTint(isDark)
        loadingSpinner.playAnimation()
        loadingStartedAtMs = SystemClock.elapsedRealtime()

        webView = findViewById(R.id.webView)
        webView.setBackgroundColor(bgColor)
        WebViewSetup.configure(this, webView)
        attachLoadingListener()
        // O carregamento arranca imediatamente, em paralelo com o tempo
        // mínimo de loading — não há atraso nenhum aqui.
        webView.loadUrl(RouteMap.BASE_URL)
    }

    /**
     * O loader.json vem sempre com a mesma cor escura de origem. Em vez de
     * manter dois ficheiros Lottie (claro/escuro), aplicamos um
     * PorterDuffColorFilter a todas as camadas do JSON em runtime:
     * tema claro -> mantém a cor escura original; tema escuro -> força branco.
     */
    private fun applyLottieTint(isDark: Boolean) {
        if (!isDark) return
        val whiteFilter = PorterDuffColorFilter(Color.WHITE, PorterDuff.Mode.SRC_ATOP)
        loadingSpinner.addValueCallback(
            KeyPath("**"),
            LottieProperty.COLOR_FILTER,
            LottieValueCallback(whiteFilter)
        )
    }

    private fun attachLoadingListener() {
        val existingClient = webView.webViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: android.webkit.WebResourceRequest
            ): Boolean {
                return existingClient.shouldOverrideUrlLoading(view, request)
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                existingClient.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView, url: String?) {
                existingClient.onPageFinished(view, url)
                pageAlreadyFinished = true
                hideLoadingOverlay()
            }
        }
    }

    /**
     * Garante que o overlay fica visível pelo menos minLoadingDurationMs
     * a contar do momento em que começou a ser mostrado, mesmo que o
     * WebView já tenha terminado de carregar bem antes disso. O WebView
     * em si nunca é atrasado — só a cortina de loading por cima dele.
     */
    private fun hideLoadingOverlay() {
        if (loadingOverlay.visibility != View.VISIBLE) return

        val elapsed = SystemClock.elapsedRealtime() - loadingStartedAtMs
        val remaining = (minLoadingDurationMs - elapsed).coerceAtLeast(0L)

        loadingOverlay.postDelayed({
            // Se por algum motivo já não estivermos visíveis (ex: chamado
            // duas vezes), não repetir a animação de saída.
            if (loadingOverlay.visibility != View.VISIBLE) return@postDelayed

            val fadeOut = AlphaAnimation(1f, 0f).apply {
                duration = 250
                fillAfter = true
            }
            loadingOverlay.startAnimation(fadeOut)
            loadingOverlay.postDelayed({
                loadingOverlay.visibility = View.GONE
                loadingSpinner.cancelAnimation()
            }, 250)
        }, remaining)
    }

    private fun setupEdgeToEdgeStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        // Pinta com o último tema conhecido do PWA já no arranque, antes
        // do WebView carregar e poder chamar onThemeChanged pela primeira vez.
        applyStatusBarAppearance(ThemePreference.resolveIsDark(this))
    }

    override fun applyStatusBarAppearance(isDark: Boolean) {
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = !isDark
        controller.isAppearanceLightNavigationBars = !isDark
    }

    private fun disableSwipeGestures() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { view, insets ->
                val gestureInsets = insets.getInsets(WindowInsetsCompat.Type.systemGestures())
                view.systemGestureExclusionRects = listOf(
                    android.graphics.Rect(0, 0, gestureInsets.left.coerceAtLeast(1), view.height),
                    android.graphics.Rect(
                        view.width - gestureInsets.right.coerceAtLeast(1),
                        0,
                        view.width,
                        view.height
                    )
                )
                insets
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}