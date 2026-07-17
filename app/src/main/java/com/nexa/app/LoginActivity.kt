package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.session.SessionManager
import com.nexa.app.util.SvgImageLoader

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn(this)) {
            goToHome()
            return
        }

        setContentView(R.layout.activity_login)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "svg/logo_hand.svg", 80, 80)

        val iconFacebook = findViewById<ImageView>(R.id.iconFacebook)
        SvgImageLoader.loadDp(this, iconFacebook, "svg/facebook.svg", 22, 22)

        val iconGoogle = findViewById<ImageView>(R.id.iconGoogle)
        SvgImageLoader.loadDp(this, iconGoogle, "svg/google.svg", 22, 22)

        val iconMicrosoft = findViewById<ImageView>(R.id.iconMicrosoft)
        SvgImageLoader.loadDp(this, iconMicrosoft, "svg/microsoft.svg", 22, 22)

        val iconApple = findViewById<ImageView>(R.id.iconApple)
        SvgImageLoader.loadDp(this, iconApple, "svg/apple.svg", 22, 22)

        val iconEmail = findViewById<ImageView>(R.id.iconEmail)
        SvgImageLoader.loadDp(this, iconEmail, "svg/email.svg", 22, 22)

        findViewById<LinearLayout>(R.id.btnFacebook).setOnClickListener {
            loginWithProvider("facebook")
        }
        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener {
            loginWithProvider("google")
        }
        findViewById<LinearLayout>(R.id.btnMicrosoft).setOnClickListener {
            loginWithProvider("microsoft")
        }
        findViewById<LinearLayout>(R.id.btnApple).setOnClickListener {
            loginWithProvider("apple")
        }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(Intent(this, EmailLoginActivity::class.java))
        }

        findViewById<TextView>(R.id.goToRegister).setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun loginWithProvider(provider: String) {
        // Mesma lógica da app anterior: abre o fluxo OAuth do provider
        // e, ao concluir, guarda sessão via SessionManager e segue para a Home (WebView).
        // TODO: plugar aqui o fluxo real (WebView de OAuth ou SDK do provider),
        // conforme o que a app anterior já usava para social login.
    }

    private fun goToHome() {
        startActivity(Intent(this, HomeActivity::class.java))
        finish()
    }
}