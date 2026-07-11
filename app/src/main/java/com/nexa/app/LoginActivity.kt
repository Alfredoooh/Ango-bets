// app/src/main/java/com/nexa/app/LoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.LoginRequest
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.widgets.BottomSnackbar
import com.nexa.app.widgets.NetworkStatusMonitor
import kotlinx.coroutines.launch

/**
 * Ecrã de login 100% nativo, sem Material Components. Fala diretamente com
 * POST /auth/login no Worker (mesma API que a versão web usa), guarda o
 * token via SessionManager, e segue para a HomeActivity — que injeta esse
 * token no WebView.
 *
 * Sem spinner: durante o pedido o botão fica apenas desativado com o texto
 * "A entrar...". Erros e estado de rede aparecem numa barra inferior de
 * largura total (BottomSnackbar), estilo YouTube.
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var emailInput: android.widget.EditText
    private lateinit var passwordInput: android.widget.EditText
    private lateinit var emailError: android.widget.TextView
    private lateinit var passwordError: android.widget.TextView
    private lateinit var loginButton: android.widget.Button
    private lateinit var registerLink: android.widget.TextView
    private lateinit var root: View

    private lateinit var snackbar: BottomSnackbar
    private lateinit var networkMonitor: NetworkStatusMonitor

    override fun onCreate(savedInstanceState: Bundle?) {
        ThemePreference.applyStoredTheme(this)
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        root = findViewById(R.id.loginRoot)
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        emailError = findViewById(R.id.emailError)
        passwordError = findViewById(R.id.passwordError)
        loginButton = findViewById(R.id.loginButton)
        registerLink = findViewById(R.id.registerLink)

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

        loginButton.setOnClickListener { attemptLogin() }
        registerLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            overridePendingTransition(
                com.nexa.app.R.anim.slide_in_right,
                com.nexa.app.R.anim.slide_out_left
            )
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

    private fun attemptLogin() {
        emailError.visibility = View.GONE
        passwordError.visibility = View.GONE

        val email = emailInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        var hasError = false
        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailError.text = "Email inválido"
            emailError.visibility = View.VISIBLE
            hasError = true
        }
        if (password.isEmpty()) {
            passwordError.text = "Password obrigatória"
            passwordError.visibility = View.VISIBLE
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
        loginButton.isEnabled = !loading
        loginButton.text = if (loading) getString(R.string.action_login_loading) else getString(R.string.action_login)
    }

    private fun showError(message: String) {
        snackbar.show(message, BottomSnackbar.Style.ERROR)
    }
}