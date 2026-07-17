// app/src/main/java/com/nexa/app/RegisterActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.util.SvgImageLoader

class RegisterActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "logo_hand.svg", 80, 80)

        SvgImageLoader.loadDp(this, findViewById(R.id.iconFacebook), "facebook.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconGoogle), "google.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconMicrosoft), "microsoft.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconApple), "apple.svg", 22, 22)
        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "email.svg", 22, 22)

        findViewById<LinearLayout>(R.id.btnFacebook).setOnClickListener { notImplemented("Facebook") }
        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener { notImplemented("Google") }
        findViewById<LinearLayout>(R.id.btnMicrosoft).setOnClickListener { notImplemented("Microsoft") }
        findViewById<LinearLayout>(R.id.btnApple).setOnClickListener { notImplemented("Apple") }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(Intent(this, EmailRegisterActivity::class.java))
        }

        findViewById<TextView>(R.id.goToLogin).setOnClickListener {
            finish()
        }
    }

    private fun notImplemented(provider: String) {
        Toast.makeText(this, "Registo com $provider ainda não disponível", Toast.LENGTH_SHORT).show()
    }
}