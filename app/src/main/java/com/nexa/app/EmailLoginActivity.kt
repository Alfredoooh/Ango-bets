// app/src/main/java/com/nexa/app/EmailLoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.LoginRequest
import com.nexa.app.session.SessionManager
import kotlinx.coroutines.launch

class EmailLoginActivity : AppCompatActivity() {

    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email_login)

        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        loginButton = findViewById(R.id.loginButton)

        loginButton.setOnClickListener { attemptLogin() }
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