package com.nexa.app

import android.os.Bundle
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.nav.RouteMap
import com.nexa.app.webview.WebViewSetup

class HomeActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        webView = findViewById(R.id.webView)
        WebViewSetup.configure(this, webView)
        webView.loadUrl(RouteMap.BASE_URL)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}