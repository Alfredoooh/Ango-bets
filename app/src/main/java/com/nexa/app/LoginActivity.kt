package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.progressindicator.CircularProgressIndicator
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.LoginRequest
import com.nexa.app.session.SessionManager
import kotlinx.coroutines.launch

/**
 * Ecrã de login 100% nativo. Fala diretamente com POST /auth/login no Worker
 * (mesma API que a versão web usa), guarda o token via SessionManager, e
 * segue para a HomeActivity — que injeta esse token no WebView.
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var emailLayout: TextInputLayout
    private lateinit var passwordLayout: TextInputLayout
    private lateinit var emailInput: TextInputEditText
    private lateinit var passwordInput: TextInputEditText
    private lateinit var loginButton: MaterialButton
    private lateinit var progress: CircularProgressIndicator
    private lateinit var registerLink: android.widget.TextView
    private lateinit var root: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        root = findViewById(R.id.loginRoot)
        emailLayout = findViewById(R.id.emailInputLayout)
        passwordLayout = findViewById(R.id.passwordInputLayout)
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        loginButton = findViewById(R.id.loginButton)
        progress = findViewById(R.id.loginProgress)
        registerLink = findViewById(R.id.registerLink)

        loginButton.setOnClickListener { attemptLogin() }
        registerLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            overridePendingTransition(
                com.nexa.app.R.anim.slide_in_left,
                com.nexa.app.R.anim.slide_out_right
            )
        }
    }

    private fun attemptLogin() {
        emailLayout.error = null
        passwordLayout.error = null

        val email = emailInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        var hasError = false
        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailLayout.error = "Email inválido"
            hasError = true
        }
        if (password.isEmpty()) {
            passwordLayout.error = "Password obrigatória"
            hasError = true
        }
        if (hasError) return

        setLoading(true)

        lifecycleScope.launch {
            try {
                val response = ApiClient.authApi.login(LoginRequest(email, password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        SessionManager.saveSession(
                            context = this@LoginActivity,
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
                    val message = ApiErrorParser.extractMessage(response, "Email ou password incorretos")
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
        progress.visibility = if (loading) View.VISIBLE else View.GONE
        loginButton.isEnabled = !loading
        loginButton.text = if (loading) "" else getString(R.string.action_login)
    }

    private fun showError(message: String) {
        Snackbar.make(root, message, Snackbar.LENGTH_LONG).show()
    }
}