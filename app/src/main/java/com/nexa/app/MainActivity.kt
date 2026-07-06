package com.nexa.app

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.nexa.app.downloader.DownloaderActivity

class MainActivity : AppCompatActivity() {

    // TODO: substituir pelo URL real do Nexa
    private val nexaWebUrl = "https://nexabase.onrender.com"

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        configureWebView(webView)

        webView.addJavascriptInterface(DownloaderBridge(), "AndroidDownloader")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                if (url.startsWith("nexa-downloader://")) {
                    openDownloaderFromUri(url)
                    return true
                }
                return false
            }
        }
        webView.loadUrl(nexaWebUrl)

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
    }

    private fun configureWebView(webView: WebView) {
        webView.setBackgroundColor(Color.WHITE)

        @Suppress("DEPRECATION")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            webView.settings.forceDark = WebSettings.FORCE_DARK_OFF
        }

        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, false)
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        webView.overScrollMode = View.OVER_SCROLL_NEVER
    }

    private fun openDownloader(url: String? = null, fileName: String? = null) {
        val intent = Intent(this, DownloaderActivity::class.java)
        if (url != null) intent.putExtra(DownloaderActivity.EXTRA_URL, url)
        if (fileName != null) intent.putExtra(DownloaderActivity.EXTRA_FILE_NAME, fileName)
        startActivity(intent)
    }

    private fun openDownloaderFromUri(rawUrl: String) {
        val uri = Uri.parse(rawUrl)
        val url = uri.getQueryParameter("url")
        val fileName = uri.getQueryParameter("filename")
        openDownloader(url, fileName)
    }

    private inner class DownloaderBridge {
        @JavascriptInterface
        fun openDownloader() {
            runOnUiThread { openDownloader() }
        }

        @JavascriptInterface
        fun openDownloader(url: String, fileName: String) {
            runOnUiThread { openDownloader(url, fileName) }
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}