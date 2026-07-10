package com.nexa.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.animation.PathInterpolator
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.webview.WebViewPool
import com.nexa.app.widgets.GradientRingLoader

class HomeActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_INITIAL_ROUTE = "extra_initial_route"
        private const val KEY_CURRENT_ROUTE = "key_current_route"
        private const val KEY_ROUTE_STACK = "key_route_stack"
    }

    private lateinit var rootLayout: FrameLayout
    private lateinit var container: FrameLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var loadingRing: GradientRingLoader
    private lateinit var dimOverlay: View

    private val routeStack = mutableListOf<String>()
    private var currentRoute: String = "home"
    private var isDarkTheme: Boolean = false
    private var runningAnimators: MutableList<ValueAnimator> = mutableListOf()

    private val iosEaseOut = PathInterpolator(0.25f, 0.1f, 0.25f, 1f)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        rootLayout = findViewById(R.id.homeRoot)
        container = findViewById(R.id.webViewContainer)
        loadingOverlay = findViewById(R.id.loadingOverlay)
        loadingRing = findViewById(R.id.loadingRing)

        dimOverlay = View(this).apply {
            setBackgroundColor(Color.BLACK)
            alpha = 0f
            visibility = View.GONE
            isClickable = false
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        val containerIndex = rootLayout.indexOfChild(container)
        rootLayout.addView(dimOverlay, containerIndex + 1)

        restoreNavigationState(savedInstanceState)

        applyNativeStatusBar(ThemePreference.resolveIsDark(this))

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView = currentWebView()
                if (webView?.canGoBack() == true) {
                    webView.goBack()
                    return
                }

                if (routeStack.size > 1) {
                    routeStack.removeAt(routeStack.lastIndex)
                    showRoute(routeStack.last(), pushToStack = false, isBack = true)
                } else {
                    finish()
                }
            }
        })

        if (savedInstanceState == null) {
            showRoute(initialRouteFromIntent(), pushToStack = false, isBack = false, animate = false)
        } else {
            showRoute(currentRoute, pushToStack = false, isBack = false, animate = false)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val route = intent.getStringExtra(EXTRA_INITIAL_ROUTE)?.trim().orEmpty()
        if (route.isNotEmpty() && route != currentRoute) {
            showRoute(route, pushToStack = true, isBack = false)
        }
    }

    override fun onResume() {
        super.onResume()
        currentWebView()?.onResume()
        applyNativeStatusBar(ThemePreference.resolveIsDark(this))
    }

    override fun onPause() {
        currentWebView()?.onPause()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(KEY_CURRENT_ROUTE, currentRoute)
        outState.putStringArrayList(KEY_ROUTE_STACK, ArrayList(routeStack))
    }

    override fun onDestroy() {
        cancelRunningAnimations()
        WebViewPool.clearAll()
        super.onDestroy()
    }

    private fun initialRouteFromIntent(): String {
        return intent.getStringExtra(EXTRA_INITIAL_ROUTE)?.trim().orEmpty().ifEmpty { "home" }
    }

    private fun restoreNavigationState(savedInstanceState: Bundle?) {
        routeStack.clear()
        if (savedInstanceState == null) {
            currentRoute = initialRouteFromIntent()
            routeStack.add(currentRoute)
            return
        }

        currentRoute = savedInstanceState.getString(KEY_CURRENT_ROUTE) ?: initialRouteFromIntent()
        val restoredStack = savedInstanceState.getStringArrayList(KEY_ROUTE_STACK)
        if (!restoredStack.isNullOrEmpty()) {
            routeStack.addAll(restoredStack)
            currentRoute = routeStack.last()
        } else {
            routeStack.add(currentRoute)
        }
    }

    private fun currentWebView(): WebView? = container.getChildAt(0) as? WebView

    private fun getOrCreateWebView(route: String) = WebViewPool.get(
        context = this,
        route = route,
        onThemeChanged = { runOnUiThread { applyNativeStatusBar(it) } },
        onExternalRoute = { r, _ -> navigateTo(r) },
        onOpenAccountDrawer = { showAccountDrawer() },
        onFirstLoadFinished = {
            runOnUiThread {
                if (currentRoute == route) {
                    loadingOverlay.visibility = View.GONE
                }
            }
        }
    )

    private fun navigateTo(route: String) {
        runOnUiThread {
            showRoute(route, pushToStack = true, isBack = false)
        }
    }

    private fun cancelRunningAnimations() {
        runningAnimators.forEach { it.cancel() }
        runningAnimators.clear()
    }

    private fun showRoute(
        route: String,
        pushToStack: Boolean,
        isBack: Boolean,
        animate: Boolean = true
    ) {
        cancelRunningAnimations()

        val safeRoute = route.trim().ifEmpty { "home" }
        currentRoute = safeRoute
        if (pushToStack && routeStack.lastOrNull() != safeRoute) {
            routeStack.add(safeRoute)
        }

        val showLoader = !WebViewPool.isAlreadyLoaded(safeRoute)
        val webView = try {
            getOrCreateWebView(safeRoute)
        } catch (_: Exception) {
            return
        }

        webView.animate().cancel()
        webView.translationX = 0f
        webView.alpha = 1f

        val previousView = container.getChildAt(0)?.takeIf { it !== webView }
        previousView?.animate()?.cancel()

        if (!animate || previousView == null) {
            container.removeAllViews()
            (webView.parent as? ViewGroup)?.removeView(webView)
            container.addView(webView)
            dimOverlay.visibility = View.GONE
            dimOverlay.alpha = 0f
            loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
            return
        }

        val width = container.width.toFloat().takeIf { it > 0 } ?: resources.displayMetrics.widthPixels.toFloat()
        val parallaxDistance = width * 0.28f
        val overlayAlpha = 0.16f

        (webView.parent as? ViewGroup)?.removeView(webView)
        container.addView(webView)
        dimOverlay.visibility = View.VISIBLE
        dimOverlay.alpha = 0f

        if (isBack) {
            webView.translationX = -parallaxDistance
            dimOverlay.alpha = overlayAlpha

            animateFloat(webView, "translationX", -parallaxDistance, 0f)
            animateFloat(previousView, "translationX", 0f, width) {
                (previousView.parent as? ViewGroup)?.removeView(previousView)
            }
            animateFloat(dimOverlay, "alpha", overlayAlpha, 0f) {
                dimOverlay.visibility = View.GONE
                dimOverlay.alpha = 0f
            }
        } else {
            webView.translationX = width

            animateFloat(webView, "translationX", width, 0f)
            animateFloat(previousView, "translationX", 0f, -parallaxDistance)
            animateFloat(dimOverlay, "alpha", 0f, overlayAlpha) {
                dimOverlay.visibility = View.GONE
                dimOverlay.alpha = 0f
            }
        }

        webView.postDelayed({
            if (currentRoute == safeRoute) {
                loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
            }
        }, 250L)
    }

    private fun animateFloat(
        view: View,
        property: String,
        from: Float,
        to: Float,
        onEnd: (() -> Unit)? = null
    ) {
        val animator = ValueAnimator.ofFloat(from, to).apply {
            duration = 320L
            interpolator = iosEaseOut
            addUpdateListener {
                val value = it.animatedValue as Float
                when (property) {
                    "translationX" -> view.translationX = value
                    "alpha" -> view.alpha = value
                }
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    runningAnimators.remove(animation as ValueAnimator)
                    onEnd?.invoke()
                }

                override fun onAnimationCancel(animation: Animator) {
                    runningAnimators.remove(animation as ValueAnimator)
                }
            })
        }
        runningAnimators.add(animator)
        animator.start()
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
                getOrCreateWebView(currentRoute)
            } catch (_: Exception) {
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
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    private fun applyNativeStatusBar(isDark: Boolean) {
        isDarkTheme = isDark
        runOnUiThread {
            val bg = if (isDark) Color.parseColor("#0F0F0F") else Color.parseColor("#FFFFFF")
            window.statusBarColor = bg
            WindowCompat.setDecorFitsSystemWindows(window, true)
            WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = !isDark

            val ringColor = if (isDark) Color.parseColor("#F2F2F2") else Color.parseColor("#2F7BF6")
            if (::loadingRing.isInitialized) {
                loadingRing.ringColor = ringColor
            }
        }
    }
}
