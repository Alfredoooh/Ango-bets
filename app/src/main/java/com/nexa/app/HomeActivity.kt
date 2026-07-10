package com.nexa.app

import android.os.Bundle
import android.view.View
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.OnBackPressedCallback
import com.nexa.app.session.SessionManager
import com.nexa.app.webview.WebViewPool
import com.nexa.app.widgets.GradientRingLoader

class HomeActivity : AppCompatActivity() {

    private lateinit var container: FrameLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var loadingRing: GradientRingLoader

    private val routeStack = mutableListOf("home")
    private var currentRoute: String = "home"
    private var isDarkTheme: Boolean = false
    private var isAnimating: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        container = findViewById(R.id.webViewContainer)
        loadingOverlay = findViewById(R.id.loadingOverlay)
        loadingRing = findViewById(R.id.loadingRing)

        val isDark = (resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES
        applyNativeStatusBar(isDark)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (isAnimating) return

                val webView = WebViewPool.get(
                    context = this@HomeActivity,
                    route = currentRoute,
                    onThemeChanged = { applyNativeStatusBar(it) },
                    onExternalRoute = { route, url -> navigateTo(route, url) },
                    onOpenAccountDrawer = { showAccountDrawer() },
                    onFirstLoadFinished = {}
                )
                if (webView.canGoBack()) {
                    webView.goBack()
                } else if (routeStack.size > 1) {
                    routeStack.removeAt(routeStack.lastIndex)
                    showRoute(routeStack.last(), pushToStack = false, isBack = true)
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState == null) {
            showRoute("home", pushToStack = false, isBack = false, animate = false)
        }
    }

    private fun navigateTo(route: String, @Suppress("UNUSED_PARAMETER") url: String) {
        runOnUiThread {
            if (isAnimating) return@runOnUiThread
            showRoute(route, pushToStack = true, isBack = false)
        }
    }

    private fun showRoute(
        route: String,
        pushToStack: Boolean,
        isBack: Boolean,
        animate: Boolean = true
    ) {
        if (isAnimating) return

        currentRoute = route
        if (pushToStack && routeStack.last() != route) {
            routeStack.add(route)
        }

        val showLoader = !WebViewPool.isAlreadyLoaded(route)

        val webView = try {
            WebViewPool.get(
                context = this,
                route = route,
                onThemeChanged = { runOnUiThread { applyNativeStatusBar(it) } },
                onExternalRoute = { r, u -> navigateTo(r, u) },
                onOpenAccountDrawer = { showAccountDrawer() },
                onFirstLoadFinished = {
                    runOnUiThread {
                        if (currentRoute == route) {
                            loadingOverlay.visibility = View.GONE
                        }
                    }
                }
            )
        } catch (e: Exception) {
            return
        }

        // Se este WebView já está no container (ex: dupla chamada acidental
        // para a mesma rota), não faz nada — evita "already has a parent".
        if (webView.parent === container && container.childCount == 1) {
            loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
            return
        }

        (webView.parent as? android.view.ViewGroup)?.let { oldParent ->
            if (oldParent !== container) {
                oldParent.removeView(webView)
            }
        }

        if (!animate) {
            container.removeAllViews()
            if (webView.parent == null) {
                container.addView(webView)
            }
            loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
            return
        }

        isAnimating = true

        val outAnimRes = if (isBack) R.anim.slide_out_right else R.anim.slide_out_left
        val inAnimRes = if (isBack) R.anim.slide_in_left else R.anim.slide_in_right

        val previousView = if (container.childCount > 0) container.getChildAt(0) else null
        val slideOut = AnimationUtils.loadAnimation(this, outAnimRes)
        val slideIn = AnimationUtils.loadAnimation(this, inAnimRes)

        if (webView.parent == null) {
            container.addView(webView)
        }
        webView.bringToFront()
        webView.startAnimation(slideIn)

        var finishedCount = 0
        val totalToFinish = if (previousView != null) 2 else 1

        fun onOneAnimationDone() {
            finishedCount++
            if (finishedCount >= totalToFinish) {
                isAnimating = false
                runOnUiThread {
                    if (currentRoute == route) {
                        loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
                    }
                }
            }
        }

        if (previousView != null && previousView !== webView) {
            previousView.startAnimation(slideOut)
            slideOut.setAnimationListener(object : Animation.AnimationListener {
                override fun onAnimationStart(animation: Animation?) {}
                override fun onAnimationRepeat(animation: Animation?) {}
                override fun onAnimationEnd(animation: Animation?) {
                    runOnUiThread {
                        if (previousView.parent === container) {
                            container.removeView(previousView)
                        }
                        onOneAnimationDone()
                    }
                }
            })
        }

        slideIn.setAnimationListener(object : Animation.AnimationListener {
            override fun onAnimationStart(animation: Animation?) {}
            override fun onAnimationRepeat(animation: Animation?) {}
            override fun onAnimationEnd(animation: Animation?) {
                onOneAnimationDone()
            }
        })
    }

    private fun showAccountDrawer() {
        runOnUiThread {
            AccountDrawerSheet(
                context = this,
                isDark = isDarkTheme,
                onThemeSelected = { theme -> applyThemeSelection(theme) },
                onLogoutConfirmed = { performLogout() }
            ).show()
        }
    }

    private fun applyThemeSelection(theme: String) {
        runOnUiThread {
            val webView = try {
                WebViewPool.get(
                    context = this,
                    route = currentRoute,
                    onThemeChanged = { applyNativeStatusBar(it) },
                    onExternalRoute = { r, u -> navigateTo(r, u) },
                    onOpenAccountDrawer = { showAccountDrawer() },
                    onFirstLoadFinished = {}
                )
            } catch (e: Exception) {
                return@runOnUiThread
            }
            webView.evaluateJavascript(
                "window.__nexaSetTheme && window.__nexaSetTheme('$theme');",
                null
            )
        }
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
        isDarkTheme = isDark
        runOnUiThread {
            val bg = if (isDark) {
                android.graphics.Color.parseColor("#0F0F0F")
            } else {
                android.graphics.Color.parseColor("#FFFFFF")
            }
            window.statusBarColor = bg
            val controller = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
            controller.isAppearanceLightStatusBars = !isDark

            val ringColor = if (isDark) {
                android.graphics.Color.parseColor("#F2F2F2")
            } else {
                android.graphics.Color.parseColor("#2F7BF6")
            }
            if (::loadingRing.isInitialized) {
                loadingRing.ringColor = ringColor
            }
        }
    }
}