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
 * HomeActivity é apenas um casco nativo para um único WebView. Sem drawer,
 * sem menu de navegação nativa, sem loader nativo, sem pool de rotas — o
 * WebView carrega a app web (Svelte) uma única vez e toda a navegação
 * interna (rotas, menus, ecrãs) é 100% responsabilidade do próprio WebApp,
 * tal como aconteceria num browser normal.
 *
 * Status bar: transparente e "edge-to-edge" — o conteúdo do WebView pode
 * desenhar-se por trás dela. A cor dos ícones/texto da status bar é
 * decidida pelo próprio WebApp através da ponte `AndroidTheme`: sempre que
 * o JS chamar `window.AndroidTheme.onThemeChanged(isDark)`, aplicamos
 * imediatamente `isAppearanceLightStatusBars = !isDark`.
 *
 * Logout: quando o utilizador confirma "Terminar sessão" no drawer do
 * WebApp, o JS chama `window.AndroidSession.onLogout()`. Isso limpa a
 * sessão nativa e devolve o utilizador à LoginActivity.
 *
 * Botão/gesto de voltar: delega sempre no histórico do próprio WebView
 * (webView.goBack()), exatamente como um navegador — só fecha a app quando
 * já não há mais histórico para trás.
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var root: FrameLayout
    private lateinit var webView: WebView

    private var pendingPermissionRequest: PermissionRequest? = null
    private lateinit var runtimePermissionLauncher: ActivityResultLauncher<Array<String>>

    private var pendingFilePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCameraCaptureUri: Uri? = null
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

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
            onLogout = { performLogout() },
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

    private fun applyStatusBarAppearance(isDark: Boolean) {
        runOnUiThread {
            WindowInsetsControllerCompat(window, window.decorView).apply {
                isAppearanceLightStatusBars = !isDark
                isAppearanceLightNavigationBars = !isDark
            }
        }
    }

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
        pendingFilePathCallback?.onReceiveValue(null)
        pendingFilePathCallback = filePathCallback

        val hasMediaPermission = PermissionManager.hasMediaPermission(this)
        if (!hasMediaPermission) {
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
     * Chamado pela ponte AndroidSession quando o WebApp confirma logout,
     * ou pode ser chamado diretamente se precisares de um logout nativo.
     * Limpa a sessão local e volta sempre ao ecrã de Login, limpando a
     * back stack para não ser possível voltar à Home sem autenticar de novo.
     */
    fun performLogout() {
        runOnUiThread {
            SessionManager.clear(this)
            val intent = Intent(this, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            startActivity(intent)
            finish()
        }
    }
}