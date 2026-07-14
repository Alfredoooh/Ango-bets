package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.nexa.app.session.SessionManager

class SplashRouterActivity : AppCompatActivity() {

    private val splashDelayMs = 900L
    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        handler.postDelayed({
            val destination = if (SessionManager.isLoggedIn(this)) {
                HomeActivity::class.java
            } else {
                LoginActivity::class.java
            }
            startActivity(Intent(this, destination))
            finish()
        }, splashDelayMs)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}