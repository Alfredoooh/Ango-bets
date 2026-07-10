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
 * da Apple: a página nova desliza 100% da largura (direita->esquerda ao
 * avançar), a página antiga faz parallax (só 28% do deslocamento) e escurece
 * com um véu preto até 35% de opacidade (efeito de profundidade). Ao voltar,
 * o sentido inverte e o véu desaparece.
 *
 * Usa ViewPropertyAnimator (acelerado por hardware) em vez de Animation XML
 * legacy — permite .cancel() seguro a qualquer momento, o que é essencial
 * para não crashar quando o utilizador navega rápido várias vezes seguidas.
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var container: FrameLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var loadingRing: GradientRingLoader
    private lateinit var dimOverlay: View

    private val routeStack = mutableListOf("home")
    private var currentRoute: String = "home"
    private var isDarkTheme: Boolean = false

    // Curva de easing igual à da Apple para push/pop de navegação
    // (aprox. UINavigationController: easeOut na entrada, easeIn na saída).
    private val iosEaseOut = PathInterpolator(0.25f, 0.1f, 0.25f, 1f)

    private var runningAnimators: MutableList<ValueAnimator> = mutableListOf()
    private var pendingRoute: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

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
        (container.parent as ViewGroup).addView(dimOverlay, container.indexOfChild(container) + 1)

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

    /**
     * Cancela de forma segura todas as animações em curso. Chamado sempre
     * antes de iniciar uma navegação nova — é isto que impede o crash de
     * "already has a parent" / listeners a disparar fora de ordem quando
     * o utilizador toca várias vezes seguidas rapidamente.
     */
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

        // Limpa qualquer estado residual de transformação de uma animação
        // anterior cancelada a meio (translationX/alpha podem ter ficado
        // num valor intermédio).
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

        (webView.parent as? ViewGroup)?.removeView(webView)
        // A view nova entra por cima (última a ser adicionada = topo do z-order).
        container.addView(webView)

        if (isBack) {
            // Voltar: a view atual (que estava em "parallax" atrás) volta a
            // deslizar totalmente para a direita e desaparece; a página de
            // baixo (previousView, na verdade a rota-alvo) volta da posição
            // de parallax para 0 com o véu a desvanecer.
            webView.translationX = -parallaxDistance
            webView.alpha = 1f
            dimOverlay.visibility = View.VISIBLE
            dimOverlay.alpha = 0.35f
            container.removeView(previousView)
            container.addView(previousView, 0)

            animateFloat(webView, "translationX", -parallaxDistance, 0f)
            animateFloat(dimOverlay, "alpha", 0.35f, 0f) {
                dimOverlay.visibility = View.GONE
            }
            previousView.translationX = 0f
            animateFloat(previousView, "translationX", 0f, width) {
                (previousView.parent as? ViewGroup)?.removeView(previousView)
            }
        } else {
            // Avançar: a view nova entra de fora do ecrã (direita) para 0;
            // a que estava visível recua para -28% da largura (parallax) e
            // escurece com o véu, ficando "atrás" visualmente.
            webView.translationX = width
            container.addView(dimOverlay.also {
                (it.parent as? ViewGroup)?.removeView(it)
            })
            container.addView(previousView.also {
                (it.parent as? ViewGroup)?.removeView(it)
            }, 0)
            container.addView(webView)

            dimOverlay.visibility = View.VISIBLE
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

    /**
     * Helper genérico para animar translationX ou alpha com a curva de
     * easing da Apple, guardando o ValueAnimator para poder ser cancelado
     * em segurança se uma navegação nova começar a meio.
     */
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