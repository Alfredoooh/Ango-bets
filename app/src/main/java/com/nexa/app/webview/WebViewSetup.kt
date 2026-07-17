package com.nexa.app.webview

import android.annotation.SuppressLint
import android.app.Activity
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import com.nexa.app.nav.RouteMap

/**
 * Configuração central do WebView: settings, client, chrome client e
 * ligação das bridges (tema, sessão, links externos, permissões).
 */
object WebViewSetup {

    @SuppressLint("SetJavaScriptEnabled")
    fun configure(activity: Activity, webView: WebView) {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
        }

        ThemeBridge.attach(activity, webView)
        SessionBridge.attach(activity, webView)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: android.webkit.WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                return if (ExternalLinkHandler.isExternal(url)) {
                    ExternalLinkHandler.open(activity, url)
                    true
                } else {
                    false
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: android.webkit.PermissionRequest) {
                PermissionManager.handle(activity, request)
            }
        }
    }
}