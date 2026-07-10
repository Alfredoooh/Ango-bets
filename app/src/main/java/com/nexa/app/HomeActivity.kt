// app/src/main/java/com/nexa/app/HomeActivity.kt
package com.nexa.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.view.ViewGroup
import android.view.animation.PathInterpolator
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.webview.PermissionManager
import com.nexa.app.webview.WebViewPool
import com.nexa.app.widgets.GradientRingLoader
import java.io.File

class HomeActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_INITIAL_ROUTE = "extra_initial_route"
        private const val KEY_CURRENT_ROUTE = "key_current_route"
        private const val KEY_ROUTE_STACK = "key_route_stack"

        private const val PUSH_DIM_ALPHA = 0.06f
        private const val BACK_PARALLAX_FACTOR = 0.30f
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

    // Guarda a rota para a qual uma primeira-carga está pendente. Enquanto
    // isto não for null, showRoute sabe que ainda não pode animar o slide
    // de entrada — a tela nativa (loadingOverlay) é que está no comando.
    private var pendingFirstLoadRoute: String? = null

    private val iosEaseOut = PathInterpolator(0.25f, 0.1f, 0.25f, 1f)

    // --- Ponte de permissões runtime para o WebView (getUserMedia) ---
    private var pendingPermissionRequest: PermissionRequest? = null
    private lateinit var runtimePermissionLauncher: ActivityResultLauncher<Array<String>>

    // --- Ponte do seletor de ficheiros para o WebView (<input type=file>) ---
    private var pendingFilePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCameraCaptureUri: Uri? = null
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>
    private lateinit var name: String

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

        setupPermissionLauncher()
        setupFileChooserLauncher()

        restoreNavigationState(savedInstanceState)

        // Aplica a cor de fundo nativa e a status bar ANTES de qualquer
        // WebView existir — é o que garante que loadingOverlay já nasce
        // com a cor certa, sem nenhum frame branco de "cor por defeito".
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

    // ------------------------------------------------------------------
    // Permissões runtime (câmera/microfone) pedidas pelo getUserMedia()
    // dentro da página web, via WebChromeClient.onPermissionRequest.
    // ------------------------------------------------------------------
    private fun setupPermissionLauncher() {
        runtimePermissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { results ->
            val request = pendingPermissionRequest
            pendingPermissionRequest = null
            if (request == null) return@registerForActivityResult

            val allGranted = results.values.all { it }
            if (allGranted) {
                request.grant(request.resources)
            } else {
                request.deny()
                Toast.makeText(
                    this,
                    getString(R.string.permission_camera_mic_denied),
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun handleWebPermissionRequest(request: PermissionRequest) {
        runOnUiThread {
            val needsCamera = request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
            val needsAudio = request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)

            val alreadyGranted = (!needsCamera || PermissionManager.hasCameraPermission(this)) &&
                (!needsAudio || PermissionManager.hasAudioPermission(this))

            if (alreadyGranted) {
                request.grant(request.resources)
                return@runOnUiThread
            }

            pendingPermissionRequest = request
            val toRequest = mutableListOf<String>()
            if (needsCamera) toRequest.add(android.Manifest.permission.CAMERA)
            if (needsAudio) toRequest.add(android.Manifest.permission.RECORD_AUDIO)
            runtimePermissionLauncher.launch(toRequest.toTypedArray())
        }
    }

    // ------------------------------------------------------------------
    // Seletor de ficheiros (galeria/câmera/documentos) pedido por
    // <input type="file"> dentro da página web, via
    // WebChromeClient.onShowFileChooser.
    // ------------------------------------------------------------------
    private fun setupFileChooserLauncher() {
        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val callback = pendingFilePathCallback
            pendingFilePathCallback = null

            if (callback == null) return@registerForActivityResult

            val resultUris: Array<Uri>? = when {
                result.resultCode != RESULT_OK -> null
                result.data?.dataString != null -> arrayOf(Uri.parse(result.data!!.dataString))
                result.data?.clipData != null -> {
                    val clip = result.data!!.clipData!!
                    Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
                }
                pendingCameraCaptureUri != null -> arrayOf(pendingCameraCaptureUri!!)
                else -> null
            }

            callback.onReceiveValue(resultUris)
            pendingCameraCaptureUri = null
        }
    }

    private fun handleShowFileChooser(
        filePathCallback: ValueCallback<Array<Uri>>,
        params: WebChromeClient.FileChooserParams
    ): Boolean {
        // Cancela qualquer seleção pendente anterior antes de abrir uma nova.
        pendingFilePathCallback?.onReceiveValue(null)
        pendingFilePathCallback = filePathCallback

        val hasMediaPermission = PermissionManager.hasMediaPermission(this)
        if (!hasMediaPermission) {
            // Pede a permissão de galeria/mídia primeiro; o próprio
            // getUserMedia/onShowFileChooser será re-acionado pela página
            // quando o utilizador tocar de novo no input, já com a
            // permissão concedida.
            runtimePermissionLauncher.launch(PermissionManager.mediaPermissionsToRequest())
        }

        val captureUri = createCameraCaptureUri()
        pendingCameraCaptureUri = captureUri

        val cameraIntent = if (captureUri != null && PermissionManager.hasCameraPermission(this)) {
            Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).apply {
                putExtra(android.provider.MediaStore.EXTRA_OUTPUT, captureUri)
                addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            }
        } else {
            null
        }

        val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE)
            val mimeTypes = params.acceptTypes?.filter { it.isNotBlank() }
            if (!mimeTypes.isNullOrEmpty()) {
                putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes.toTypedArray())
            }
        }

        val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
            putExtra(Intent.EXTRA_INTENT, contentIntent)
            putExtra(Intent.EXTRA_TITLE, getString(R.string.file_chooser_title))
            if (cameraIntent != null) {
                putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cameraIntent))
            }
        }

        return try {
            fileChooserLauncher.launch(chooserIntent)
            true
        } catch (e: Exception) {
            pendingFilePathCallback = null
            false
        }
    }

    private fun createCameraCaptureUri(): Uri? {
        return try {
            val cacheDir = File(externalCacheDir, "camera").apply { mkdirs() }
            val file = File(cacheDir, "capture_${System.currentTimeMillis()}.jpg")
            FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        } catch (e: Exception) {
            null
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
        pendingFilePathCallback?.onReceiveValue(null)
        pendingFilePathCallback = null
        pendingPermissionRequest = null
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

    private fun currentWebView(): WebView? = container.getChildAt(container.childCount - 1) as? WebView

    private fun getOrCreateWebView(route: String) = WebViewPool.get(
        context = this,
        route = route,
        isDark = isDarkTheme,
        onThemeChanged = { runOnUiThread { applyNativeStatusBar(it) } },
        onExternalRoute = { r, _ -> navigateTo(r) },
        onOpenAccountDrawer = { showAccountDrawer() },
        onFirstLoadFinished = { finishedRoute -> runOnUiThread { handleFirstLoadFinished(finishedRoute) } },
        onPermissionRequest = { request -> handleWebPermissionRequest(request) },
        onShowFileChooser = { callback, params -> handleShowFileChooser(callback, params) }
    )

    /**
     * Verdade sobre "esta rota precisa de loader nativo" para ESTE processo
     * vivo — nunca confiar apenas em savedInstanceState/routeStack, porque
     * esses sobrevivem à morte do processo (o Android guarda o Bundle) mas
     * o WebViewPool (um object comum, preso ao processo) não sobrevive.
     * Sem esta distinção, voltar ao app depois do sistema o ter matado em
     * background reabria a Activity já "a pensar" que currentRoute estava
     * carregada, e o showRoute() antigo confiava nisso — resultado: ou
     * ficava preso a meio (WebView inexistente tentando ser mostrado sem
     * recriar) ou o overlay nativo entrava sem necessidade a esconder uma
     * página que na cabeça do utilizador já devia só continuar a aparecer.
     */
    private fun routeNeedsNativeLoader(route: String): Boolean = !WebViewPool.hasWebView(route)

    private fun navigateTo(route: String) {
        runOnUiThread {
            showRoute(route, pushToStack = true, isBack = false)
        }
    }

    private fun cancelRunningAnimations() {
        runningAnimators.forEach { it.cancel() }
        runningAnimators.clear()
    }

    /**
     * Navegação com o comportamento pedido: uma rota NUNCA carregada ainda
     * entra por trás da tela nativa de loading — o WebView fica a carregar
     * escondido, e só quando onFirstLoadFinished disparar é que a tela
     * nativa sai e a página aparece, já pronta, com uma transição suave e
     * rápida. Uma rota JÁ carregada (WebView real e vivo, neste processo)
     * não tem nada para esperar, então desliza direto, sem loader nenhum.
     */
    private fun showRoute(
        route: String,
        pushToStack: Boolean,
        isBack: Boolean,
        animate: Boolean = true
    ) {
        cancelRunningAnimations()

        val safeRoute = route.trim().ifEmpty { "home" }
        val previousRoute = currentRoute
        currentRoute = safeRoute
        if (pushToStack && routeStack.lastOrNull() != safeRoute) {
            routeStack.add(safeRoute)
        }

        val needsNativeLoader = routeNeedsNativeLoader(safeRoute)
        val webView = try {
            getOrCreateWebView(safeRoute)
        } catch (_: Exception) {
            return
        }

        webView.animate().cancel()
        webView.isClickable = true

        if (needsNativeLoader) {
            // Primeira visita a esta rota: a tela nativa assume o comando.
            // O WebView entra por baixo, sem slide, invisível ao utilizador
            // até estar pronto — não há "branco antes de escuro" possível
            // porque o loadingOverlay já está por cima de tudo desde já,
            // com a cor certa (ver applyNativeStatusBar), e o WebView em si
            // já nasce com setBackgroundColor certo (ver WebViewPool).
            pendingFirstLoadRoute = safeRoute

            container.removeAllViews()
            webView.translationX = 0f
            webView.alpha = 1f
            container.addView(webView)

            (dimOverlay.parent as? ViewGroup)?.removeView(dimOverlay)
            dimOverlay.visibility = View.GONE
            dimOverlay.alpha = 0f

            loadingOverlay.animate().cancel()
            loadingOverlay.alpha = 1f
            loadingOverlay.visibility = View.VISIBLE
            loadingOverlay.bringToFront()
            return
        }

        pendingFirstLoadRoute = null
        webView.translationX = 0f
        webView.alpha = 1f

        val previousView = container.children().firstOrNull { it !== webView }
        previousView?.animate()?.cancel()

        if (!animate || previousView == null) {
            container.removeAllViews()
            (webView.parent as? ViewGroup)?.removeView(webView)
            container.addView(webView)
            dimOverlay.visibility = View.GONE
            dimOverlay.alpha = 0f
            (dimOverlay.parent as? ViewGroup)?.removeView(dimOverlay)
            hideLoadingOverlayImmediately()
            return
        }

        hideLoadingOverlayImmediately()
        previousView.isClickable = false

        val width = container.width.toFloat().takeIf { it > 0 } ?: resources.displayMetrics.widthPixels.toFloat()

        if (isBack) {
            val parallaxDistance = width * BACK_PARALLAX_FACTOR

            (webView.parent as? ViewGroup)?.removeView(webView)
            container.addView(webView)
            webView.translationX = -parallaxDistance
            webView.alpha = 1f

            animateFloat(webView, "translationX", -parallaxDistance, 0f)
            animateFloat(previousView, "translationX", 0f, width) {
                previousView.isClickable = true
                (previousView.parent as? ViewGroup)?.removeView(previousView)
            }
        } else {
            val parallaxDistance = width * 0.28f
            val overlayAlpha = PUSH_DIM_ALPHA

            (webView.parent as? ViewGroup)?.removeView(webView)
            (dimOverlay.parent as? ViewGroup)?.removeView(dimOverlay)
            val previousIndex = container.indexOfChild(previousView)
            container.addView(dimOverlay, previousIndex + 1)
            container.addView(webView)
            dimOverlay.visibility = View.VISIBLE
            dimOverlay.alpha = 0f
            webView.translationX = width

            animateFloat(webView, "translationX", width, 0f)
            animateFloat(previousView, "translationX", 0f, -parallaxDistance) {
                previousView.isClickable = true
            }
            animateFloat(dimOverlay, "alpha", 0f, overlayAlpha) {
                dimOverlay.visibility = View.GONE
                dimOverlay.alpha = 0f
                (dimOverlay.parent as? ViewGroup)?.removeView(dimOverlay)
            }
        }
    }

    /**
     * Chamado quando o WebView de pendingFirstLoadRoute termina a primeira
     * carga. Se o utilizador ainda estiver nessa mesma rota (não navegou
     * para outro lado enquanto carregava), a tela nativa de loading
     * dá lugar suavemente ao conteúdo já pronto — um fade curto e rápido,
     * nunca um corte seco, e nunca um frame de conteúdo incompleto.
     */
    private fun handleFirstLoadFinished(finishedRoute: String) {
        if (pendingFirstLoadRoute != finishedRoute) return
        if (currentRoute != finishedRoute) return
        pendingFirstLoadRoute = null

        loadingOverlay.animate().cancel()
        loadingOverlay.animate()
            .alpha(0f)
            .setDuration(180L)
            .setInterpolator(iosEaseOut)
            .withEndAction {
                loadingOverlay.visibility = View.GONE
                loadingOverlay.alpha = 1f
            }
            .start()
    }

    private fun hideLoadingOverlayImmediately() {
        loadingOverlay.animate().cancel()
        loadingOverlay.visibility = View.GONE
        loadingOverlay.alpha = 1f
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
                onOpenProfile = { navigateTo("profile") },
                onThemeSelected = { theme -> applyThemeSelection(theme) },
                onLogoutConfirmed = { performLogout() }
            ).show()
        }
    }

    private fun applyThemeSelection(theme: String) {
        runOnUiThread {
            // Antes disto só se avisava o WebView via JS — a status bar
            // nativa, o loader e o próprio drawer (se reaberto) ficavam
            // presos no tema antigo até a Activity ser recriada, porque
            // ThemePreference nunca era gravado nem applyNativeStatusBar()
            // era chamado aqui. Agora os três lados (SharedPreferences +
            // status bar nativa + WebView) mudam juntos, na mesma chamada.
            ThemePreference.save(this, theme)

            val resolvedIsDark = ThemePreference.resolveIsDark(this)
            applyNativeStatusBar(resolvedIsDark)

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

            if (::loadingOverlay.isInitialized) {
                loadingOverlay.setBackgroundColor(bg)
            }

            val ringColor = if (isDark) Color.parseColor("#F2F2F2") else Color.parseColor("#4A4A4A")
            if (::loadingRing.isInitialized) {
                loadingRing.ringColor = ringColor
            }
        }
    }

    private fun ViewGroup.children(): List<View> {
        return (0 until childCount).map { getChildAt(it) }
    }
}