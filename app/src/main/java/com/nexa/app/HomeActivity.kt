// app/src/main/java/com/nexa/app/HomeActivity.kt
package com.nexa.app

import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.View
import android.view.animation.AlphaAnimation
import android.webkit.ValueCallback
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeColors
import com.nexa.app.webview.FileChooserBridge
import com.nexa.app.webview.ThemeAware
import com.nexa.app.webview.WebViewSetup

class HomeActivity : AppCompatActivity(), ThemeAware {

    private lateinit var webView: WebView
    private lateinit var loadingOverlay: View
    private lateinit var loadingLogo: ImageView

    // Tempo mínimo que o overlay de loading tem de ficar visível,
    // independentemente de o WebView (onPageFinished) terminar antes disso.
    private val minLoadingDurationMs = 8000L
    private var loadingStartedAtMs = 0L
    private var pageAlreadyFinished = false

    // Callback pendente do onShowFileChooser quando caímos para o Photo
    // Picker do sistema (fallback da galeria Fluent própria).
    private var pendingFileCallback: ValueCallback<Array<Uri>>? = null

    private val multiPhotoPickerLauncher =
        registerForActivityResult(ActivityResultContracts.PickMultipleVisualMedia(10)) { uris ->
            deliverPickerResult(uris)
        }

    private val singlePhotoPickerLauncher =
        registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
            deliverPickerResult(if (uri != null) listOf(uri) else emptyList())
        }

    private fun deliverPickerResult(uris: List<Uri>) {
        val callback = pendingFileCallback
        pendingFileCallback = null
        if (uris.isEmpty()) {
            callback?.onReceiveValue(null)
        } else {
            callback?.onReceiveValue(uris.toTypedArray())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // O tema dos date/time pickers nativos (disparados pelo WebView
        // para <input type="date">/<input type="time">) tem de ser
        // aplicado ANTES de super.onCreate()/setContentView, para o
        // Android já desenhar esses dialogs com a paleta Fluent correta
        // — sincronizada com o tema do PWA, não com o do sistema.
        applyFluentPickerTheme()

        super.onCreate(savedInstanceState)

        setupEdgeToEdgeStatusBar()
        disableSwipeGestures()

        setContentView(R.layout.activity_home)

        // O splash nativo (Theme.Nexa.Splash) usa sempre fundo #242424 com
        // splash_icon_dark, independentemente do tema do sistema/PWA. Para
        // a transição do splash nativo -> este overlay ser imperceptível,
        // arrancamos com a MESMA cor de fundo do splash nativo e só depois
        // repintamos para o tema real assim que ThemePreference o resolve.
        val nativeSplashBg = android.graphics.Color.parseColor("#242424")
        findViewById<View>(R.id.rootHome).setBackgroundColor(nativeSplashBg)

        loadingOverlay = findViewById(R.id.loadingOverlay)
        loadingLogo = findViewById(R.id.loadingLogo)
        loadingOverlay.setBackgroundColor(nativeSplashBg)

        val isDark = ThemePreference.resolveIsDark(this)
        val bgColor = ThemeColors.get(isDark).bgPrimary

        // Repinta para o tema real do PWA/sistema num único frame seguinte,
        // para não gerar um "flash" percetível entre o splash nativo e este.
        loadingOverlay.post {
            findViewById<View>(R.id.rootHome).setBackgroundColor(bgColor)
            loadingOverlay.setBackgroundColor(bgColor)
        }

        applyLogoTint(isDark)
        loadingStartedAtMs = SystemClock.elapsedRealtime()

        webView = findViewById(R.id.webView)
        webView.setBackgroundColor(bgColor)

        val fileChooserBridge = FileChooserBridge(this) { multiSelect, callback ->
            pendingFileCallback = callback
            if (multiSelect) {
                multiPhotoPickerLauncher.launch(
                    androidx.activity.result.PickVisualMediaRequest(
                        androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia.ImageOnly
                    )
                )
            } else {
                singlePhotoPickerLauncher.launch(
                    androidx.activity.result.PickVisualMediaRequest(
                        androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia.ImageOnly
                    )
                )
            }
        }

        WebViewSetup.configure(this, webView, fileChooserBridge)
        attachLoadingListener()
        // O carregamento arranca imediatamente, em paralelo com o tempo
        // mínimo de loading — não há atraso nenhum aqui.
        webView.loadUrl(RouteMap.BASE_URL)
    }

    private fun applyFluentPickerTheme() {
        val isDark = ThemePreference.resolveIsDark(this)
        setTheme(
            if (isDark) R.style.Theme_Nexa_FluentPickers_Dark
            else R.style.Theme_Nexa_FluentPickers_Light
        )
    }

    /**
     * logo.png é um único asset (mesma arte para os dois temas). Em tema
     * escuro, se o logo for de traço escuro sobre fundo transparente,
     * aplicamos um filtro branco para garantir contraste com o fundo
     * escuro — replicando a mesma lógica que existia para o Lottie.
     * Se já fornecer um logo com contraste próprio nos dois temas, este
     * filtro pode ser removido sem qualquer outro impacto.
     */
    private fun applyLogoTint(isDark: Boolean) {
        if (!isDark) {
            loadingLogo.clearColorFilter()
            return
        }
        loadingLogo.setColorFilter(
            android.graphics.Color.WHITE,
            android.graphics.PorterDuff.Mode.SRC_ATOP
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
            if (loadingOverlay.visibility != View.VISIBLE) return@postDelayed

            val fadeOut = AlphaAnimation(1f, 0f).apply {
                duration = 250
                fillAfter = true
            }
            loadingOverlay.startAnimation(fadeOut)
            loadingOverlay.postDelayed({
                loadingOverlay.visibility = View.GONE
            }, 250)
        }, remaining)
    }

    private fun setupEdgeToEdgeStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT
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