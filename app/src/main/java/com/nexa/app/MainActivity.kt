package com.nexa.app

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.nexa.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var localServer: LocalWebServer

    private val serverPort = 8080

    private val nexaPrimary = Color.parseColor("#2F7BF6")
    private val bgLight = Color.parseColor("#FFFFFF")
    private val bgDark = Color.parseColor("#0F0F0F")

    // Reflete se a sub-tela atual dentro da app Svelte carregada (ex: Settings)
    // está aberta. Atualizado pelo próprio Svelte via NativeNav.reportSubScreen().
    private var isOnSubScreen = false

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        localServer = LocalWebServer(applicationContext, serverPort)
        localServer.startServer()

        binding.webView.apply {
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    isOnSubScreen = false
                    syncThemeFromPage(view)
                    injectSubScreenWatcher(view)
                }
            }
            webChromeClient = WebChromeClient()

            with(settings) {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                useWideViewPort = true
                loadWithOverviewMode = true
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            addJavascriptInterface(ThemeBridge(this@MainActivity), "AndroidTheme")
            addJavascriptInterface(NavBridge(this@MainActivity), "NativeNav")

            loadUrl("http://127.0.0.1:$serverPort/home/")
        }
    }

    private fun syncThemeFromPage(view: WebView?) {
        view?.evaluateJavascript(
            """
            (function() {
                var saved = localStorage.getItem('nexa_theme');
                if (saved === 'dark' || saved === 'light') return saved;
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            })();
            """.trimIndent()
        ) { result ->
            val theme = result?.replace("\"", "")
            applyNativeTheme(theme == "dark")
        }
    }

    /**
     * Injeta um MutationObserver que deteta quando uma sub-tela do tipo
     * "Settings" (ou similar) está aberta dentro da app Svelte atual,
     * observando a presença do botão ".back-btn" que já existe em todas
     * as SettingsPage.svelte do projeto. Não edita nenhum ficheiro .svelte
     * — apenas observa o DOM já renderizado, de fora.
     *
     * Quando o utilizador prime o botão físico "voltar" do Android, o
     * Kotlin (ver onBackPressedDispatcher) simula um clique real nesse
     * mesmo botão em vez de sair da Activity ou da app inteira, fazendo
     * a sub-tela fechar corretamente para a tela principal.
     */
    private fun injectSubScreenWatcher(view: WebView?) {
        view?.evaluateJavascript(
            """
            (function() {
                function report() {
                    var backBtn = document.querySelector('.back-btn');
                    var onSub = !!backBtn;
                    if (window.NativeNav) {
                        window.NativeNav.reportSubScreen(onSub);
                    }
                }
                report();
                if (window.__nexaNavObserver) {
                    window.__nexaNavObserver.disconnect();
                }
                var observer = new MutationObserver(report);
                observer.observe(document.body, { childList: true, subtree: true });
                window.__nexaNavObserver = observer;
            })();
            """.trimIndent(), null
        )
    }

    /** Simula um clique real no botão .back-btn da sub-tela atual, se existir. */
    private fun clickBackButtonInPage(onHandled: (Boolean) -> Unit) {
        binding.webView.evaluateJavascript(
            """
            (function() {
                var backBtn = document.querySelector('.back-btn');
                if (backBtn) {
                    backBtn.click();
                    return true;
                }
                return false;
            })();
            """.trimIndent()
        ) { result ->
            onHandled(result == "true")
        }
    }

    private fun applyNativeTheme(isDark: Boolean) {
        window.statusBarColor = if (isDark) bgDark else bgLight
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            window.decorView.systemUiVisibility = if (isDark) {
                0
            } else {
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            }
        }
    }

    inner class ThemeBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun onThemeChanged(theme: String) {
            runOnUiThread {
                activity.applyNativeTheme(theme == "dark")
            }
        }
    }

    inner class NavBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun reportSubScreen(onSubScreen: Boolean) {
            runOnUiThread {
                activity.isOnSubScreen = onSubScreen
            }
        }
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        when {
            isOnSubScreen -> {
                // Está numa sub-tela (ex: Settings) dentro da app Svelte atual:
                // fecha essa sub-tela em vez de sair da app ou trocar de URL.
                clickBackButtonInPage { handled ->
                    if (!handled) {
                        fallbackBack()
                    }
                }
            }
            binding.webView.canGoBack() -> {
                binding.webView.goBack()
            }
            else -> super.onBackPressed()
        }
    }

    private fun fallbackBack() {
        if (binding.webView.canGoBack()) {
            binding.webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (::localServer.isInitialized) {
            localServer.stopServer()
        }
        super.onDestroy()
    }
}