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
    // ao AndroidStorageBridge para persistir a permissão. Isto só
    // aparece UMA vez (na primeira exportação); depois disso a
    // permissão fica persistida via takePersistableUriPermission e
    // toda a navegação seguinte é feita dentro do próprio
    // ExportPickerPage.svelte, sem qualquer janela nativa adicional.
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

        setupStatusBar()
        disableSwipeGestures()

        setContentView(R.layout.activity_home)

        // O splash nativo (Theme.Nexa.Splash / Theme.Nexa.Splash.Dark,
        // ver themes.xml e values-night/themes.xml) agora segue o tema
        // do SISTEMA automaticamente através do qualifier -night do
        // Android, cada um com o seu próprio par cor+ícone
        // (splash_icon claro / splash_icon_dark escuro). Este overlay
        // (loadingOverlay) é a continuação desse splash enquanto o
        // WebView carrega, por isso arrancamos com a MESMA cor de fundo
        // que o splash nativo acabou de mostrar — mas essa cor é agora
        // resolvida a partir do tema do PWA (ThemePreference), não
        // fixa em #242424, para a transição entre os dois splashes
        // continuar imperceptível em qualquer tema.
        val isDark = ThemePreference.resolveIsDark(this)
        val bgColor = ThemeColors.get(isDark).bgPrimary

        findViewById<View>(R.id.rootHome).setBackgroundColor(bgColor)

        loadingOverlay = findViewById(R.id.loadingOverlay)
        loadingLogo = findViewById(R.id.loadingLogo)
        loadingOverlay.setBackgroundColor(bgColor)

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
     * logo.png (o "N" azul de gradiente da marca, em drawable/) é usado
     * TAL COMO É, em ambos os temas — sem qualquer filtro de cor. Antes
     * havia um setColorFilter(WHITE, SRC_ATOP) aplicado em modo escuro
     * que substituía as cores originais do logo por um preenchimento
     * branco chapado, destruindo o gradiente azul da marca. O logo já
     * tem contraste suficiente sobre fundo escuro por si só (é
     * predominantemente azul vivo sobre fundo transparente), por isso
     * esse filtro nunca foi necessário — só estava a estragar o asset.
     */
    private fun applyLogoTint(isDark: Boolean) {
        loadingLogo.clearColorFilter()
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

    /**
     * Statusbar sólida, a combinar com o tema — NÃO edge-to-edge.
     *
     * Antes (setupEdgeToEdgeStatusBar): setDecorFitsSystemWindows(false)
     * fazia o WebView desenhar por trás da status bar, que ficava
     * totalmente transparente. Isso permitia à WebView pintar-se até ao
     * topo do ecrã — incluindo por trás dos ícones de hora/bateria do
     * sistema — o que ficava visualmente errado fora do editor de Docs
     * (onde o efeito era intencional via env(safe-area-inset-top)).
     *
     * Agora: decorFitsSystemWindows volta a true, o que faz o Android
     * reservar automaticamente o espaço da status bar como inset do
     * content view — a WebView passa a começar sempre abaixo dela, e
     * deixa de haver overlap para tratar no Svelte com
     * safe-area-inset-top nos apps que não são o Docs (esse env()
     * simplesmente resolve para 0px agora, o que já é seguro por si só
     * porque está dentro de um calc() com um valor base fixo).
     *
     * A cor por trás da própria barra continua a não ser pintada
     * explicitamente por nós (statusBarColor mantém-se TRANSPARENT) —
     * o que aparece por trás dela é o background da Window/do
     * rootHome, que já pintamos com a cor do tema (bgColor) logo no
     * onCreate. isAppearanceLightStatusBars continua a garantir que os
     * ícones do sistema (hora, bateria, sinal) ficam com contraste
     * correto contra essa cor.
     */
    private fun setupStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, true)
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