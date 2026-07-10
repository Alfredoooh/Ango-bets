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
import com.nexa.app.api.RegisterRequest
import com.nexa.app.session.SessionManager
import kotlinx.coroutines.launch

/**
 * Ecrã de registo 100% nativo. Espelha exatamente os campos do formulário
 * web (src/auth/RegisterPage.svelte): Nome, Email, Password — nada mais,
 * os campos de perfil (idade, país...) são opcionais no Worker e não
 * fazem parte do formulário atual, por isso não entram aqui.
 */
class RegisterActivity : AppCompatActivity() {

    private lateinit var nameLayout: TextInputLayout
    private lateinit var emailLayout: TextInputLayout
    private lateinit var passwordLayout: TextInputLayout
    private lateinit var nameInput: TextInputEditText
    private lateinit var emailInput: TextInputEditText
    private lateinit var passwordInput: TextInputEditText
    private lateinit var registerButton: MaterialButton
    private lateinit var progress: CircularProgressIndicator
    private lateinit var loginLink: android.widget.TextView
    private lateinit var root: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        root = findViewById(R.id.registerRoot)
        nameLayout = findViewById(R.id.nameInputLayout)
        emailLayout = findViewById(R.id.emailInputLayout)
        passwordLayout = findViewById(R.id.passwordInputLayout)
        nameInput = findViewById(R.id.nameEditText)
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        registerButton = findViewById(R.id.registerButton)
        progress = findViewById(R.id.registerProgress)
        loginLink = findViewById(R.id.loginLink)

        registerButton.setOnClickListener { attemptRegister() }
        loginLink.setOnClickListener {
            finish()
            overridePendingTransition(
                com.nexa.app.R.anim.slide_in_left,
                com.nexa.app.R.anim.slide_out_right
            )
        }
    }

    private fun attemptRegister() {
        nameLayout.error = null
        emailLayout.error = null
        passwordLayout.error = null

        val name = nameInput.text?.toString()?.trim().orEmpty()
        val email = emailInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        var hasError = false
        if (name.isEmpty()) {
            nameLayout.error = "Nome obrigatório"
            hasError = true
        }
        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailLayout.error = "Email inválido"
            hasError = true
        }
        if (password.length < 6) {
            passwordLayout.error = "Password deve ter pelo menos 6 caracteres"
            hasError = true
        }
        if (hasError) return

        setLoading(true)

        lifecycleScope.launch {
            try {
                val response = ApiClient.authApi.register(RegisterRequest(name, email, password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        SessionManager.saveSession(
                            context = this@RegisterActivity,
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
                    val message = ApiErrorParser.extractMessage(response, "Não foi possível criar a conta")
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
        registerButton.isEnabled = !loading
        registerButton.text = if (loading) "" else getString(R.string.action_register)
    }

    private fun showError(message: String) {
        Snackbar.make(root, message, Snackbar.LENGTH_LONG).show()
    }
}