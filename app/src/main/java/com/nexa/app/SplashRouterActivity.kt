package com.nexa.app

import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.DrawableCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

class SplashRouterActivity : AppCompatActivity() {

    private val splashDelayMs = 900L
    private val dotIntervalMs = 220L
    private val handler = Handler(Looper.getMainLooper())
    private var dotViews: List<View> = emptyList()
    private var currentDot = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        // OBRIGATÓRIO antes de super.onCreate() quando o tema é Theme.SplashScreen
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        dotViews = listOf(
            findViewById(R.id.dot0),
            findViewById(R.id.dot1),
            findViewById(R.id.dot2),
            findViewById(R.id.dot3),
            findViewById(R.id.dot4)
        )

        startDotAnimation()

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

    private fun startDotAnimation() {
        val activeColor = ContextCompat.getColor(this, R.color.colorPrimary)
        val inactiveColor = ContextCompat.getColor(this, R.color.text_secondary)

        val runnable = object : Runnable {
            override fun run() {
                dotViews.forEachIndexed { index, dot ->
                    // DrawableCompat.unwrap() protege contra wrappers (InsetDrawable, etc.)
                    val unwrapped = DrawableCompat.unwrap<GradientDrawable>(dot.background)
                    unwrapped.setColor(if (index == currentDot) activeColor else inactiveColor)
                }
                currentDot = (currentDot + 1) % dotViews.size
                handler.postDelayed(this, dotIntervalMs)
            }
        }
        handler.post(runnable)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}