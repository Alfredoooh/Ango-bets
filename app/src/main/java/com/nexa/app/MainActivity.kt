package com.nexa.app

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.nexa.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Barra de status branca com ícones escuros
        setWhiteStatusBar()

        // Configuração da WebView
        binding.webView.apply {
            // Navegação interna (não abrir browser externo)
            webViewClient = WebViewClient()
            // Para suportar alertas, uploads, etc., se necessário
            webChromeClient = WebChromeClient()

            with(settings) {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                // Para PWAs que usam cache/Service Workers
                allowFileAccess = true
                allowContentAccess = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                // Modo de renderização suave
                useWideViewPort = true
                loadWithOverviewMode = true
                // Mistura de conteúdo (se a PWA usar HTTP dentro de HTTPS)
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            loadUrl("https://myhubby.onrender.com/home/")
        }
    }

    private fun setWhiteStatusBar() {
        window.statusBarColor = Color.WHITE
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Ícones escuros para barra clara
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        }
        // Para Android 11+ também é possível usar WindowInsetsController
    }

    // Voltar no histórico da WebView
    override fun onBackPressed() {
        if (binding.webView.canGoBack()) {
            binding.webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}