package com.nexa.app

import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.OnBackPressedCallback
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager
import com.nexa.app.webview.WebViewPool
import com.nexa.app.widgets.GradientRingLoader

/**
 * Única Activity de navegação da app. Cada rota (home, chat, docs...) tem
 * o seu próprio WebView mantido vivo em WebViewPool — a primeira visita
 * mostra o loadingOverlay (com slide nativo) enquanto carrega; visitas
 * seguintes trocam instantaneamente qual WebView está visível.
 *
 * O drawer de CONTA (AccountDrawerSheet) espelha AppDrawer.svelte e abre
 * quando o utilizador toca no profile-btn do AppHeader — via ponte JS
 * AndroidDrawer.openAccountDrawer().
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var container: FrameLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var loadingRing: GradientRingLoader

    private val routeStack = mutableListOf("home")
    private var currentRoute: String = "home"
    private var isDarkTheme: Boolean = false

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

    /**
     * Chamado pelo drawer nativo, pelo AppHeader.svelte (via RouteMap ->
     * onExternalRoute), ou por qualquer navegação interna do site que saia
     * da rota atual. Substitui a lógica antiga de abrir uma Activity nova.
     */
    private fun navigateTo(route: String, @Suppress("UNUSED_PARAMETER") url: String) {
        showRoute(route, pushToStack = true, isBack = false)
    }

    private fun showRoute(
        route: String,
        pushToStack: Boolean,
        isBack: Boolean,
        animate: Boolean = true
    ) {
        currentRoute = route
        if (pushToStack && routeStack.last() != route) {
            routeStack.add(route)
        }

        val showLoader = !WebViewPool.isAlreadyLoaded(route)

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

        (webView.parent as? android.view.ViewGroup)?.removeView(webView)

        if (animate) {
            // Slide nativo: nova rota entra da direita (ou esquerda, se for
            // "voltar"), a rota anterior sai para o lado oposto. O loader
            // (se preciso) é mostrado só DEPOIS do slide terminar, dentro
            // do mesmo container, para nunca aparecer "colado" à transição.
            val outAnim = if (isBack) R.anim.slide_out_right else R.anim.slide_out_left
            val inAnim = if (isBack) R.anim.slide_in_left else R.anim.slide_in_right

            val previousView = container.getChildAt(0)
            val slideOut = android.view.animation.AnimationUtils.loadAnimation(this, outAnim)
            val slideIn = android.view.animation.AnimationUtils.loadAnimation(this, inAnim)

            container.addView(webView)
            webView.startAnimation(slideIn)

            if (previousView != null) {
                previousView.startAnimation(slideOut)
                slideOut.setAnimationListener(object : android.view.animation.Animation.AnimationListener {
                    override fun onAnimationStart(animation: android.view.animation.Animation?) {}
                    override fun onAnimationRepeat(animation: android.view.animation.Animation?) {}
                    override fun onAnimationEnd(animation: android.view.animation.Animation?) {
                        container.removeView(previousView)
                    }
                })
            }

            slideIn.setAnimationListener(object : android.view.animation.Animation.AnimationListener {
                override fun onAnimationStart(animation: android.view.animation.Animation?) {}
                override fun onAnimationRepeat(animation: android.view.animation.Animation?) {}
                override fun onAnimationEnd(animation: android.view.animation.Animation?) {
                    runOnUiThread {
                        if (currentRoute == route) {
                            loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
                        }
                    }
                }
            })
        } else {
            container.removeAllViews()
            container.addView(webView)
            loadingOverlay.visibility = if (showLoader) View.VISIBLE else View.GONE
        }
    }

    private fun showAccountDrawer() {
        AccountDrawerSheet(
            context = this,
            isDark = isDarkTheme,
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
            loadingRing.ringColor = ringColor
        }
    }
}