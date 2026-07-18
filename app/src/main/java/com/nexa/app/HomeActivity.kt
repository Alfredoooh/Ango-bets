// app/src/main/java/com/nexa/app/HomeActivity.kt
package com.nexa.app

import android.os.Build
import android.os.Bundle
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
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeColors
import com.nexa.app.webview.ThemeAware
import com.nexa.app.webview.WebViewSetup

class HomeActivity : AppCompatActivity(), ThemeAware {

    private lateinit var webView: WebView
    private lateinit var loadingOverlay: View
    private lateinit var loadingSpinner: LottieAnimationView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupEdgeToEdgeStatusBar()
        disableSwipeGestures()

        setContentView(R.layout.activity_home)

        val bgColor = ThemeColors.get(ThemePreference.resolveIsDark(this)).bgPrimary
        findViewById<View>(R.id.rootHome).setBackgroundColor(bgColor)

        loadingOverlay = findViewById(R.id.loadingOverlay)
        loadingSpinner = findViewById(R.id.loadingSpinner)
        loadingOverlay.setBackgroundColor(bgColor)
        loadingSpinner.playAnimation()

        webView = findViewById(R.id.webView)
        webView.setBackgroundColor(bgColor)
        WebViewSetup.configure(this, webView)
        attachLoadingListener()
        webView.loadUrl(RouteMap.BASE_URL)
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
                hideLoadingOverlay()
            }
        }
    }

    private fun hideLoadingOverlay() {
        if (loadingOverlay.visibility != View.VISIBLE) return
        loadingOverlay.postDelayed({
            val fadeOut = AlphaAnimation(1f, 0f).apply {
                duration = 250
                fillAfter = true
            }
            loadingOverlay.startAnimation(fadeOut)
            loadingOverlay.postDelayed({
                loadingOverlay.visibility = View.GONE
                loadingSpinner.cancelAnimation()
            }, 250)
        }, 200)
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