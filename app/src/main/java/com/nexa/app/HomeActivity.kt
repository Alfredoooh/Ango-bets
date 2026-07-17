// app/src/main/java/com/nexa/app/HomeActivity.kt
package com.nexa.app

import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.nav.RouteMap
import com.nexa.app.webview.WebViewSetup

class HomeActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupEdgeToEdgeStatusBar()
        disableSwipeGestures()

        setContentView(R.layout.activity_home)

        webView = findViewById(R.id.webView)
        WebViewSetup.configure(this, webView)
        webView.loadUrl(RouteMap.BASE_URL)
    }

    private fun setupEdgeToEdgeStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false
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