// app/src/main/java/com/nexa/app/HomeActivity.kt
package com.nexa.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
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
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager
import com.nexa.app.webview.PermissionManager
import com.nexa.app.webview.setupNexaWebView
import java.io.File

/**
 * HomeActivity agora é apenas um casco nativo para um único WebView.
 * Sem drawer, sem menu de navegação nativa, sem loader nativo, sem pool de
 * rotas — o WebView carrega a app web (Svelte) uma única vez e toda a
 * navegação interna (rotas, menus, ecrãs) passa a ser 100% responsabilidade
 * do próprio WebApp, tal como aconteceria num browser normal.
 *
 * Status bar: transparente e "edge-to-edge" — o conteúdo do WebView pode
 * desenhar-se por trás dela (WindowCompat.setDecorFitsSystemWindows(false)).
 * A cor dos ícones/texto da status bar (clara ou escura) é decidida pelo
 * próprio WebApp através da ponte já existente `AndroidTheme`: sempre que o
 * JS chamar `window.AndroidTheme.onThemeChanged(isDark)`, aplicamos
 * imediatamente `isAppearanceLightStatusBars = !isDark` — ou seja, tema
 * escuro no WebApp -> ícones claros na status bar, e vice-versa.
 *
 * Botão/gesto de voltar: delega sempre no histórico do próprio WebView
 * (webView.goBack()), exatamente como um navegador — só fecha a app quando
 * já não há mais histórico para trás.
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var root: FrameLayout
    private lateinit var webView: WebView

    // --- Ponte de permissões runtime para o WebView (getUserMedia) ---
    private var pendingPermissionRequest: PermissionRequest? = null
    private lateinit var runtimePermissionLauncher: ActivityResultLauncher<Array<String>>

    // --- Ponte do seletor de ficheiros para o WebView (<input type=file>) ---
    private var pendingFilePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCameraCaptureUri: Uri? = null
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge: o conteúdo do WebView pode ficar por trás da status
        // bar, e a própria status bar fica transparente.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        root = FrameLayout(this)
        setContentView(root)

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(webView)

        setupPermissionLauncher()
        setupFileChooserLauncher()

        webView.setupNexaWebView(
            context = this,
            onThemeChanged = { isDark -> applyStatusBarAppearance(isDark) },
            onPermissionRequest = { request -> handleWebPermissionRequest(request) },
            onShowFileChooser = { callback, params -> handleShowFileChooser(callback, params) }
        )

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(RouteMap.BASE_URL)
        }
    }

    /**
     * Aplica apenas a aparência (cor dos ícones/texto) da status bar, nunca
     * um fundo sólido — a status bar mantém-se sempre transparente, e é o
     * conteúdo do próprio WebApp que aparece por trás dela. isDark=true
     * (tema escuro no WebApp) => ícones claros; isDark=false => ícones
     * escuros. É exatamente o inverso do tema do WebApp, como pedido.
     */
    private fun applyStatusBarAppearance(isDark: Boolean) {
        runOnUiThread {
            WindowInsetsControllerCompat(window, window.decorView).apply {
                isAppearanceLightStatusBars = !isDark
                isAppearanceLightNavigationBars = !isDark
            }
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

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    override fun onDestroy() {
        pendingFilePathCallback?.onReceiveValue(null)
        pendingFilePathCallback = null
        pendingPermissionRequest = null
        root.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    /**
     * Logout continua disponível para quem chamar esta Activity a partir do
     * próprio WebApp via ponte JS, se precisares — limpa sessão nativa e
     * volta ao ecrã de Login.
     */
    fun performLogout() {
        SessionManager.clear(this)
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}