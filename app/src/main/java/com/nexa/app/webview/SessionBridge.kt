package com.nexa.app.webview

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.nexa.app.LoginActivity
import com.nexa.app.session.SessionManager

/**
 * Injeta o token de sessão no WebApp e escuta pedidos de logout
 * vindos de dentro do WebView.
 */
class SessionBridge(private val activity: Activity) {

    @JavascriptInterface
    fun getToken(): String {
        return SessionManager.getToken(activity) ?: ""
    }

    @JavascriptInterface
    fun logout() {
        activity.runOnUiThread {
            SessionManager.clear(activity)
            val intent = Intent(activity, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            activity.startActivity(intent)
            activity.finish()
        }
    }

    companion object {
        fun attach(activity: Activity, webView: WebView) {
            webView.addJavascriptInterface(SessionBridge(activity), "NativeSession")
        }
    }
}