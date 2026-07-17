// app/src/main/java/com/nexa/app/EmailLoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.LoginRequest
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeApplier
import com.nexa.app.util.ThemeColors
import com.nexa.app.util.ThemePalette
import kotlinx.coroutines.launch

class EmailLoginActivity : AppCompatActivity() {

    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

        val isDark = ThemePreference.resolveIsDark(this)
        val palette = ThemeColors.get(isDark)

        setupStatusBar(isDark)
        setContentView(R.layout.activity_email_login)

        // As propriedades têm de estar inicializadas ANTES de applyTheme(),
        // que lhes acede diretamente (emailInput.setTextColor, etc.).
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        loginButton = findViewById(R.id.loginButton)

        applyTheme(palette)

        loginButton.setOnClickListener { attemptLogin() }
    }

    private fun applyTheme(palette: ThemePalette) {
        val root = findViewById<View>(R.id.rootEmailLogin)
        ThemeApplier.applyBackground(root, palette)

        ThemeApplier.applyPrimaryText(findViewById(R.id.screenTitle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.loginButtonText), palette)

        emailInput.setTextColor(palette.textPrimary)
        emailInput.setHintTextColor(palette.textSecondary)
        passwordInput.setTextColor(palette.textPrimary)
        passwordInput.setHintTextColor(palette.textSecondary)

        ThemeApplier.applyCardBackground(emailInput, palette, 28f, this)
        ThemeApplier.applyCardBackground(passwordInput, palette, 28f, this)
        ThemeApplier.applyCardBackground(loginButton, palette, 28f, this)
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

    private fun attemptLogin() {
        val email = emailInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Email inválido", Toast.LENGTH_SHORT).show()
            return
        }
        if (password.isEmpty()) {
            Toast.makeText(this, "Palavra-passe obrigatória", Toast.LENGTH_SHORT).show()
            return
        }

        setLoading(true)

        lifecycleScope.launch {
            try {
                val response = ApiClient.authApi.login(LoginRequest(email, password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        SessionManager.saveSession(
                            context = this@EmailLoginActivity,
                            token = body.token,
                            userId = body.id,
                            name = body.name,
                            email = body.email,
                            credits = body.credits
                        )
                        goToHome()
                    } else {
                        showError("Resposta inválida do servidor")
                    }
                } else {
                    val message = ApiErrorParser.extractMessage(response, "Email ou palavra-passe incorretos")
                    showError(message)
                }
            } catch (e: Exception) {
                showError("Erro de ligação. Verifica a tua internet.")
            } finally {
                setLoading(false)
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

    private fun setLoading(loading: Boolean) {
        loginButton.isEnabled = !loading
        loginButton.alpha = if (loading) 0.6f else 1f
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}