package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.session.SessionManager
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.util.ThemePreferenceManager

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        // Aplica o tema guardado antes de super.onCreate()/setContentView()
        // para o primeiro frame já nascer com o tema correto.
        ThemePreferenceManager.applyStoredTheme(this)
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn(this)) {
            goToHome()
            return
        }

        setupStatusBar()
        setContentView(R.layout.activity_login)

        val textColor = ContextCompat.getColor(this, R.color.text_primary)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "logo.svg", widthDp = 80, heightDp = 80, tintColor = textColor)

        val themeToggleBtn = findViewById<ImageView>(R.id.themeToggleBtn)
        SvgImageLoader.loadDp(this, themeToggleBtn, "theme.svg", widthDp = 24, heightDp = 24, tintColor = textColor)

        // Este botão existia no layout mas nunca tinha listener ligado —
        // agora cicla entre Claro → Escuro → Automático a cada toque,
        // como atalho rápido sem ter de entrar em Settings.
        themeToggleBtn.setOnClickListener {
            cicleTheme()
        }

        findViewById<TextView>(R.id.btnStartNoLogin).setOnClickListener {
            goToHome()
        }
    }

    private fun cicleTheme() {
        val current = ThemePreferenceManager.getThemeMode(this)
        val next = when (current) {
            ThemePreferenceManager.THEME_LIGHT -> ThemePreferenceManager.THEME_DARK
            ThemePreferenceManager.THEME_DARK -> ThemePreferenceManager.THEME_AUTO
            else -> ThemePreferenceManager.THEME_LIGHT
        }
        ThemePreferenceManager.setThemeMode(this, next)
        // setDefaultNightMode recria a Activity automaticamente para
        // aplicar as resources corretas — comportamento esperado.
    }

    private fun setupStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = resources.getBoolean(R.bool.isLightTheme)
            isAppearanceLightNavigationBars = resources.getBoolean(R.bool.isLightTheme)
        }
    }

    private fun goToHome() {
        val intent = Intent(this, HomeActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}