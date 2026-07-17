package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.util.SvgImageLoader

class RegisterActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "svg/logo_hand.svg", 80, 80)

        SvgImageLoader.loadDp(this, findViewById(R.id.iconFacebook), "svg/facebook.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconGoogle), "svg/google.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconMicrosoft), "svg/microsoft.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconApple), "svg/apple.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "svg/email.svg", 22, 22)

        findViewById<LinearLayout>(R.id.btnFacebook).setOnClickListener { registerWithProvider("facebook") }
        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener { registerWithProvider("google") }
        findViewById<LinearLayout>(R.id.btnMicrosoft).setOnClickListener { registerWithProvider("microsoft") }
        findViewById<LinearLayout>(R.id.btnApple).setOnClickListener { registerWithProvider("apple") }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(Intent(this, EmailRegisterActivity::class.java))
        }

        findViewById<TextView>(R.id.goToLogin).setOnClickListener {
            finish()
        }
    }

    private fun registerWithProvider(provider: String) {
        // TODO: mesmo fluxo OAuth/SDK usado no LoginActivity, mas em modo signup.
    }
}