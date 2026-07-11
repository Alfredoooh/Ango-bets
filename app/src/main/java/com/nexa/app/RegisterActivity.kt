// app/src/main/java/com/nexa/app/RegisterActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.addCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.RegisterRequest
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.widgets.BottomSnackbar
import com.nexa.app.widgets.GradientRingLoader
import com.nexa.app.widgets.NetworkStatusMonitor
import kotlinx.coroutines.launch

/**
 * Ecrã de registo 100% nativo, sem Material Components. Espelha exatamente
 * os campos do formulário web (src/auth/RegisterPage.svelte): Nome, Email,
 * Password.
 *
 * Tem uma seta de voltar fixa no topo (estilo iOS/Material) para retroceder
 * sempre ao ecrã de Login, além do próprio gesto/botão físico do sistema.
 */
class RegisterActivity : AppCompatActivity() {

    private lateinit var backButton: android.widget.ImageButton
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

    private lateinit var snackbar: BottomSnackbar
    private lateinit var networkMonitor: NetworkStatusMonitor

    override fun onCreate(savedInstanceState: Bundle?) {
        ThemePreference.applyStoredTheme(this)
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        root = findViewById(R.id.registerRoot)
        backButton = findViewById(R.id.backButton)
        nameInput = findViewById(R.id.nameEditText)
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        nameError = findViewById(R.id.nameError)
        emailError = findViewById(R.id.emailError)
        passwordError = findViewById(R.id.passwordError)
        registerButton = findViewById(R.id.registerButton)
        progress = findViewById(R.id.registerProgress)
        loginLink = findViewById(R.id.loginLink)

        snackbar = BottomSnackbar.attach(findViewById(R.id.snackbarContainer))
        networkMonitor = NetworkStatusMonitor(
            context = this,
            onOffline = {
                snackbar.show(
                    getString(R.string.network_offline),
                    BottomSnackbar.Style.ERROR,
                    persistent = true
                )
            },
            onOnline = {
                snackbar.show(
                    getString(R.string.network_online),
                    BottomSnackbar.Style.SUCCESS,
                    durationMs = 2000L
                )
            }
        )

        registerButton.setOnClickListener { attemptRegister() }
        backButton.setOnClickListener { goBackToLogin() }
        loginLink.setOnClickListener { goBackToLogin() }

        onBackPressedDispatcher.addCallback(this) {
            goBackToLogin()
        }
    }

    override fun onStart() {
        super.onStart()
        networkMonitor.start()
    }

    override fun onStop() {
        networkMonitor.stop()
        super.onStop()
    }

    private fun goBackToLogin() {
        finish()
        overridePendingTransition(
            com.nexa.app.R.anim.slide_in_left,
            com.nexa.app.R.anim.slide_out_right
        )
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
        snackbar.show(message, BottomSnackbar.Style.ERROR)
    }
}