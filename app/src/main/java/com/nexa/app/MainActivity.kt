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

    // Deve refletir sempre lightColors.primary / darkColors.primary de src/shared/theme.js
    private val nexaPrimary = Color.parseColor("#2F7BF6")
    private val bgLight = Color.parseColor("#FFFFFF")
    private val bgDark = Color.parseColor("#0F0F0F")

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
                    // Lê o tema que o próprio Svelte já decidiu (localStorage.nexa_theme
                    // ou prefers-color-scheme, ver src/shared/theme.js) e aplica na
                    // status bar nativa para ficar visualmente unificado.
                    evaluateJavascript(
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

            loadUrl("http://127.0.0.1:$serverPort/home/")
        }
    }

    /** Aplica na status bar/nav nativa a mesma cor que o Svelte está a usar. */
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

    /** Permite ao Svelte (ex: ao alternar tema em Settings) notificar o Kotlin imediatamente. */
    inner class ThemeBridge(private val activity: MainActivity) {
        @JavascriptInterface
        fun onThemeChanged(theme: String) {
            runOnUiThread {
                activity.applyNativeTheme(theme == "dark")
            }
        }
    }

    override fun onBackPressed() {
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