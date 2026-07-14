package com.nexa.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.nexa.app.session.SessionManager

class SplashRouterActivity : AppCompatActivity() {

    companion object {
        const val ACTION_WEBVIEW_READY = "com.nexa.app.WEBVIEW_READY"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var finished = false

    private val webViewReadyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            dismissSplash()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        if (SessionManager.isLoggedIn(this)) {
            LocalBroadcastManager.getInstance(this)
                .registerReceiver(webViewReadyReceiver, IntentFilter(ACTION_WEBVIEW_READY))

            startActivity(Intent(this, HomeActivity::class.java))

            // Fallback: se o WebView demorar mais de 8s, dispensamos o splash
            // na mesma para não bloquear o utilizador para sempre.
            handler.postDelayed({ dismissSplash() }, 8000L)
        } else {
            handler.postDelayed({
                startActivity(Intent(this, LoginActivity::class.java))
                @Suppress("DEPRECATION")
                overridePendingTransition(0, 0)
                finish()
            }, 600L)
        }
    }

    private fun dismissSplash() {
        if (finished) return
        finished = true
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)
        finish()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        LocalBroadcastManager.getInstance(this)
            .unregisterReceiver(webViewReadyReceiver)
        super.onDestroy()
    }
}