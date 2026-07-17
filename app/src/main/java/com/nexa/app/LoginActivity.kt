// app/src/main/java/com/nexa/app/LoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.LoginRequest
import com.nexa.app.session.SessionManager
import com.nexa.app.util.SvgImageLoader
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn(this)) {
            goToHome()
            return
        }

        setContentView(R.layout.activity_login)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "logo_hand.svg", 80, 80)

        SvgImageLoader.loadDp(this, findViewById(R.id.iconFacebook), "facebook.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconGoogle), "google.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconMicrosoft), "microsoft.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconApple), "apple.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "email.svg", 22, 22)

        // Login social continua por implementar (requer SDK/OAuth de cada
        // provider); por agora avisa o utilizador em vez de ficar sem reação.
        findViewById<LinearLayout>(R.id.btnFacebook).setOnClickListener {
            notImplemented("Facebook")
        }
        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener {
            notImplemented("Google")
        }
        findViewById<LinearLayout>(R.id.btnMicrosoft).setOnClickListener {
            notImplemented("Microsoft")
        }
        findViewById<LinearLayout>(R.id.btnApple).setOnClickListener {
            notImplemented("Apple")
        }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(Intent(this, EmailLoginActivity::class.java))
        }

        findViewById<TextView>(R.id.goToRegister).setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun notImplemented(provider: String) {
        Toast.makeText(this, "Login com $provider ainda não disponível", Toast.LENGTH_SHORT).show()
    }

    private fun goToHome() {
        val intent = Intent(this, HomeActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}