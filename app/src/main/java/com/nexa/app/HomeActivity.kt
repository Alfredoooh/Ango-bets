package com.nexa.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.animation.PathInterpolator
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.OnBackPressedCallback
import com.nexa.app.session.SessionManager
import com.nexa.app.webview.WebViewPool
import com.nexa.app.widgets.GradientRingLoader

/**
 * Navegação por WebView em pool, com transição estilo UINavigationController
 * da Apple: a página nova desliza 100% da largura, a página antiga faz
 * parallax (28%) e escurece com um véu preto (dimOverlay).
 *
 * IMPORTANTE: dimOverlay vive SEMPRE no FrameLayout raiz (rootLayout),
 * nunca dentro de "container" — container só pode conter WebViews. Misturar
 * o dimOverlay dentro de container fazia container.getChildAt(0) apanhar
 * às vezes o dimOverlay em vez do WebView anterior, corrompendo a lógica
 * de remover/animar e crashando a navegação.
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var rootLayout: FrameLayout
    private lateinit var container: FrameLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var loadingRing: GradientRingLoader
    private lateinit var dimOverlay: View

    private val routeStack = mutableListOf("home")
    private var currentRoute: String = "home"
    private var isDarkTheme: Boolean = false

    private val iosEaseOut = PathInterpolator(0.25f, 0.1f, 0.25f, 1f)

    private var runningAnimators: MutableList<ValueAnimator> = mutableListOf()

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
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        // dimOverlay é inserido logo A SEGUIR ao container no root, e nunca
        // mais é movido de lá — fica sempre por cima do container (WebViews)
        // e por baixo do loadingOverlay, na mesma hierarquia fixa.
        val containerIndex = rootLayout.indexOfChild(container)
        rootLayout.addView(dimOverlay, containerIndex + 1)

        val isDark = (resources.configuration.uiMode and
            android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES
        applyNativeStatusBar(isDark)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView = getOrCreateWebView(currentRoute)
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

    private fun getOrCreateWebView(route: String) = WebViewPool.get(
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

    private fun navigateTo(route: String, @Suppress("UNUSED_PARAMETER") url: String) {
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

        currentRoute = route
        if (pushToStack && routeStack.last() != route) {
            routeStack.add(route)
        }

        val showLoader = !WebViewPool.isAlreadyLoaded(route)

        val webView = try {
            getOrCreateWebView(route)
        } catch (e: Exception) {
            return
        }

        webView.animate().cancel()
        webView.translationX = 0f
        webView.alpha = 1f

        // previousView só pode vir de dentro de "container" — dimOverlay
        // nunca está aqui dentro, por isso getChildAt(0) é sempre ou um
        // WebView, ou null (primeira rota).
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

        (webView.parent as? ViewGroup)?.removeView(webView)
        container.addView(webView)

        dimOverlay.visibility = View.VISIBLE

        if (isBack) {
            webView.translationX = -parallaxDistance
            webView.alpha = 1f
            dimOverlay.alpha = 0.35f

            container.removeView(previousView)
            container.addView(previousView, 0)
            previousView.translationX = 0f

            animateFloat(webView, "translationX", -parallaxDistance, 0f)
            animateFloat(dimOverlay, "alpha", 0.35f, 0f) {
                dimOverlay.visibility = View.GONE
            }
            animateFloat(previousView, "translationX", 0f, width) {
                (previousView.parent as? ViewGroup)?.removeView(previousView)
            }
        } else {
            webView.translationX = width
            dimOverlay.alpha = 0f

            animateFloat(webView, "translationX", width, 0f)
            animateFloat(previousView, "translationX", 0f, -parallaxDistance)
            animateFloat(dimOverlay, "alpha", 0f, 0.35f)
        }

        val loaderDelay = 300L
        webView.postDelayed({
            if (currentRoute == route) {
                loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
            }
        }, loaderDelay)
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
            val bg = if (isDark) Color.parseColor("#0F0F0F") else Color.parseColor("#FFFFFF")
            window.statusBarColor = bg
            val controller = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
            controller.isAppearanceLightStatusBars = !isDark

            val ringColor = if (isDark) Color.parseColor("#F2F2F2") else Color.parseColor("#2F7BF6")
            if (::loadingRing.isInitialized) {
                loadingRing.ringColor = ringColor
            }
        }
    }

    override fun onDestroy() {
        cancelRunningAnimations()
        super.onDestroy()
    }
}