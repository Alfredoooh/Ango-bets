// app/src/main/java/com/nexa/app/LoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.util.ThemeApplier
import com.nexa.app.util.ThemeColors
import com.nexa.app.util.ThemePalette
import com.nexa.app.widgets.ExitConfirmDialog
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private val googleWebClientId = "SUBSTITUI_PELO_TEU_WEB_CLIENT_ID.apps.googleusercontent.com"

    private var isDark = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn(this)) {
            goToHome()
            return
        }

        isDark = ThemePreference.resolveIsDark(this)
        val palette = ThemeColors.get(isDark)

        setupStatusBar(isDark)
        setContentView(R.layout.activity_login)
        applyTheme(palette)

        loadLogo()
        loadThemeToggleIcon()

        findViewById<ImageView>(R.id.iconEmail).setImageResource(R.drawable.ic_fluent_mail_24_regular)
        findViewById<ImageView>(R.id.iconEmail).setColorFilter(palette.textPrimary)
        findViewById<ImageView>(R.id.iconGoogle).setImageResource(R.drawable.ic_fluent_google_24_regular)

        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener {
            launchGoogleSignIn()
        }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(Intent(this, EmailLoginActivity::class.java))
        }

        findViewById<TextView>(R.id.goToRegister).setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        findViewById<ImageView>(R.id.themeToggleBtn).setOnClickListener {
            toggleTheme()
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                ExitConfirmDialog.show(this@LoginActivity) {
                    finishAffinity()
                }
            }
        })
    }

    private fun loadLogo() {
        val palette = ThemeColors.get(isDark)
        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "logo.svg", widthDp = 80, heightDp = 80, tintColor = palette.textPrimary)
    }

    private fun loadThemeToggleIcon() {
        val palette = ThemeColors.get(isDark)
        val themeToggleBtn = findViewById<ImageView>(R.id.themeToggleBtn)
        val iconRes = if (isDark) R.drawable.ic_fluent_weather_sunny_24_regular
        else R.drawable.ic_fluent_weather_moon_24_regular
        themeToggleBtn.setImageResource(iconRes)
        themeToggleBtn.setColorFilter(palette.textPrimary)
    }

    private fun toggleTheme() {
        isDark = !isDark
        val newPalette = ThemeColors.get(isDark)

        ThemePreference.saveIsDark(this, isDark)
        applyTheme(newPalette)
        loadLogo()
        loadThemeToggleIcon()
        findViewById<ImageView>(R.id.iconEmail).setColorFilter(newPalette.textPrimary)
        setupStatusBar(isDark)
    }

    private fun applyTheme(palette: ThemePalette) {
        val root = findViewById<View>(R.id.rootLogin)
        ThemeApplier.applyBackground(root, palette)

        ThemeApplier.applyPrimaryText(findViewById(R.id.welcomeTitle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textGoogle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textEmail), palette)
        ThemeApplier.applyAccentText(findViewById(R.id.goToRegister), isDark)
        ThemeApplier.applySecondaryText(findViewById(R.id.orText), palette)
        ThemeApplier.applySecondaryText(findViewById(R.id.termsText), palette)

        ThemeApplier.applyDivider(findViewById(R.id.dividerLeft), palette)
        ThemeApplier.applyDivider(findViewById(R.id.dividerRight), palette)

        ThemeApplier.applyFluentSecondaryButton(findViewById(R.id.btnGoogle), palette, isDark, this)
        ThemeApplier.applyFluentSecondaryButton(findViewById(R.id.btnEmail), palette, isDark, this)
    }

    private fun setupStatusBar(isDark: Boolean) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val bgColor = ThemeColors.get(isDark).bgPrimary
        window.statusBarColor = bgColor
        window.navigationBarColor = bgColor
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = !isDark
            isAppearanceLightNavigationBars = !isDark
        }
    }

    private fun launchGoogleSignIn() {
        val credentialManager = CredentialManager.create(this)
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(googleWebClientId)
            .build()
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        lifecycleScope.launch {
            try {
                val result = credentialManager.getCredential(request = request, context = this@LoginActivity)
                val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
                Toast.makeText(this@LoginActivity, "Conta Google selecionada: ${credential.id}", Toast.LENGTH_SHORT).show()
            } catch (e: GetCredentialException) {
                Toast.makeText(this@LoginActivity, "Login com Google cancelado ou indisponível", Toast.LENGTH_SHORT).show()
            }
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