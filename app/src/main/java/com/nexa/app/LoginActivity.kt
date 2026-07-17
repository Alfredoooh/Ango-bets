// app/src/main/java/com/nexa/app/LoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.View
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
import com.nexa.app.util.PngImageLoader
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.util.ThemeApplier
import com.nexa.app.util.ThemeColors
import com.nexa.app.widgets.ExitConfirmDialog
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    // TODO: substituir pelo teu Web Client ID do Google Cloud Console.
    private val googleWebClientId = "SUBSTITUI_PELO_TEU_WEB_CLIENT_ID.apps.googleusercontent.com"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn(this)) {
            goToHome()
            return
        }

        val isDark = ThemePreference.resolveIsDark(this)
        val palette = ThemeColors.get(isDark)

        setupStatusBar(isDark)
        setContentView(R.layout.activity_login)
        applyTheme(palette)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        PngImageLoader.load(this, logoIcon, "icons/png/logo.png")

        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "icons/svg/email.svg", 22, 22, palette.textPrimary)
        PngImageLoader.load(this, findViewById(R.id.iconGoogle), "icons/png/google.png")

        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener {
            launchGoogleSignIn()
        }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(Intent(this, EmailLoginActivity::class.java))
        }

        findViewById<TextView>(R.id.goToRegister).setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                ExitConfirmDialog.show(this@LoginActivity) {
                    finishAffinity()
                }
            }
        })
    }

    private fun applyTheme(palette: com.nexa.app.util.ThemePalette) {
        val root = findViewById<View>(R.id.rootLogin)
        ThemeApplier.applyBackground(root, palette)

        ThemeApplier.applyPrimaryText(findViewById(R.id.welcomeTitle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textGoogle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textEmail), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.goToRegister), palette)
        ThemeApplier.applySecondaryText(findViewById(R.id.orText), palette)
        ThemeApplier.applySecondaryText(findViewById(R.id.termsText), palette)

        ThemeApplier.applyDivider(findViewById(R.id.dividerLeft), palette)
        ThemeApplier.applyDivider(findViewById(R.id.dividerRight), palette)

        ThemeApplier.applyCardBackground(findViewById(R.id.btnGoogle), palette, 28f, this)
        ThemeApplier.applyCardBackground(findViewById(R.id.btnEmail), palette, 28f, this)
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
                // TODO: enviar credential.idToken ao backend, trocar por sessão via SessionManager.saveSession(...).
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