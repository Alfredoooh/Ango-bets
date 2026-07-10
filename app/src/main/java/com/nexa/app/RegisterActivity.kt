package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.RegisterRequest
import com.nexa.app.session.SessionManager
import com.nexa.app.widgets.GradientRingLoader
import kotlinx.coroutines.launch

/**
 * Ecrã de registo 100% nativo, sem Material Components. Espelha exatamente
 * os campos do formulário web (src/auth/RegisterPage.svelte): Nome, Email,
 * Password — nada mais, os campos de perfil (idade, país...) são opcionais
 * no Worker e não fazem parte do formulário atual, por isso não entram aqui.
 */
class RegisterActivity : AppCompatActivity() {

    private lateinit var nameInput: android.widget.EditText
    private lateinit var emailInput: android.widget.EditText
    private lateinit var passwordInput: android.widget.EditText
    private lateinit var nameError: android.widget.TextView
    private lateinit var emailError: android.widget.TextView
    private lateinit var passwordError: android.widget.TextView
    private lateinit var registerButton: android.widget.Button
    private lateinit var progress: GradientRingLoader
    private lateinit var loginLink: android.widget.TextView
    private lateinit var root: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        root = findViewById(R.id.registerRoot)
        nameInput = findViewById(R.id.nameEditText)
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        nameError = findViewById(R.id.nameError)
        emailError = findViewById(R.id.emailError)
        passwordError = findViewById(R.id.passwordError)
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
        nameError.visibility = View.GONE
        emailError.visibility = View.GONE
        passwordError.visibility = View.GONE

        val name = nameInput.text?.toString()?.trim().orEmpty()
        val email = emailInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        var hasError = false
        if (name.isEmpty()) {
            nameError.text = "Nome obrigatório"
            nameError.visibility = View.VISIBLE
            hasError = true
        }
        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailError.text = "Email inválido"
            emailError.visibility = View.VISIBLE
            hasError = true
        }
        if (password.length < 6) {
            passwordError.text = "Password deve ter pelo menos 6 caracteres"
            passwordError.visibility = View.VISIBLE
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
        android.widget.Toast.makeText(root.context, message, android.widget.Toast.LENGTH_LONG).show()
    }
}