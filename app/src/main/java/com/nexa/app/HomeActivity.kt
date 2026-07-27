// app/src/main/java/com/nexa/app/HomeActivity.kt
package com.nexa.app

import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.animation.AlphaAnimation
import android.webkit.ValueCallback
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageView
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeColors
import com.nexa.app.webview.AndroidStorageBridge
import com.nexa.app.webview.FileChooserBridge
import com.nexa.app.webview.PermissionManager
import com.nexa.app.webview.ThemeAware
import com.nexa.app.webview.WebViewSetup

class HomeActivity : AppCompatActivity(), ThemeAware {

    private lateinit var webView: WebView
    private lateinit var loadingOverlay: View
    private lateinit var loadingLogo: ImageView
    private lateinit var storageBridge: AndroidStorageBridge

    private var pageAlreadyFinished = false

    // Guarda a altura do teclado (IME) vista da última vez, para só
    // reagirmos quando ela efetivamente muda.
    private var lastImeHeight = 0

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

    // Picker de pasta do sistema (Storage Access Framework) — disparado
    // quando o WebApp chama AndroidStorage.requestPermission(). O
    // resultado é a URI da árvore escolhida pelo utilizador, entregue
    // ao AndroidStorageBridge para persistir a permissão.
    private val openTreeLauncher =
        registerForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
            if (uri != null) {
                storageBridge.onRootTreeChosen(uri)
            }
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

        webView = findViewById(R.id.webView)
        webView.setBackgroundColor(bgColor)

        val fileChooserBridge = FileChooserBridge(this) { multiSelect, callback ->
            pendingFileCallback = callback
            if (multiSelect) {
                multiPhotoPickerLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                )
            } else {
                singlePhotoPickerLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                )
            }
        }

        storageBridge = AndroidStorageBridge(this, webView) {
            openTreeLauncher.launch(null)
        }

        WebViewSetup.configure(this, webView, fileChooserBridge, storageBridge)
        attachLoadingListener()
        attachImeInsetsGuard()
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
     * Esconde o overlay assim que o WebView termina de carregar
     * (onPageFinished) — sem tempo mínimo artificial. O overlay fica
     * visível exatamente pelo tempo real que o app leva a carregar.
     */
    private fun hideLoadingOverlay() {
        if (loadingOverlay.visibility != View.VISIBLE) return

        val fadeOut = AlphaAnimation(1f, 0f).apply {
            duration = 250
            fillAfter = true
        }
        loadingOverlay.startAnimation(fadeOut)
        loadingOverlay.postDelayed({
            loadingOverlay.visibility = View.GONE
        }, 250)
    }

    /**
     * Camada extra contra o appbar a saltar — reage a nível de View
     * Android (WindowInsetsCompat.Type.ime()) e força a WebView de
     * volta a scrollTo(0,0) nativamente, sem depender de JS injetado.
     * Funciona em paralelo com o script em
     * WebViewSetup.injectAppbarJumpFix e com o windowSoftInputMode do
     * manifest.
     */
    private fun attachImeInsetsGuard() {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom

            if (imeHeight != lastImeHeight) {
                lastImeHeight = imeHeight

                if (view is WebView) {
                    view.scrollTo(0, 0)
                }

                view.post {
                    if (view is WebView) view.scrollTo(0, 0)
                }
            }

            insets
        }
    }

    /**
     * Resultado real do popup do sistema para CAMERA/RECORD_AUDIO —
     * antes não existia, e PermissionManager chamava request.grant()
     * sem esperar por isto. Agora o grant/deny do pedido do WebView só
     * acontece aqui, com a resposta efetiva do utilizador.
     */
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        PermissionManager.resolvePendingResult(requestCode, grantResults)
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