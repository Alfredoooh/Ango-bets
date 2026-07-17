// app/src/main/java/com/nexa/app/RegisterActivity.kt
package com.nexa.app

import android.graphics.Color
import android.os.Bundle
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.PngImageLoader
import com.nexa.app.util.SvgImageLoader

class RegisterActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val isDark = ThemePreference.resolveIsDark(this)
        setupStatusBar(isDark)
        setContentView(R.layout.activity_register)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        PngImageLoader.load(this, logoIcon, "icons/png/logo.png")

        val iconTint = if (isDark) Color.parseColor("#F2F2F2") else Color.parseColor("#10151C")
        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "icons/svg/email.svg", 22, 22, iconTint)
        PngImageLoader.load(this, findViewById(R.id.iconGoogle), "icons/png/google.png")

        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener {
            // TODO: mesmo fluxo Credential Manager já usado em LoginActivity.
        }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(android.content.Intent(this, EmailRegisterActivity::class.java))
        }

        findViewById<TextView>(R.id.goToLogin).setOnClickListener {
            finish()
        }
    }

    private fun setupStatusBar(isDark: Boolean) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val bgColor = if (isDark) Color.parseColor("#0F0F0F") else Color.WHITE
        window.statusBarColor = bgColor
        window.navigationBarColor = bgColor
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = !isDark
            isAppearanceLightNavigationBars = !isDark
        }
    }
}