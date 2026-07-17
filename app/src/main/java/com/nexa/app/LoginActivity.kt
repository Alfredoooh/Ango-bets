// app/src/main/java/com/nexa/app/LoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
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
import com.nexa.app.util.PngImageLoader
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.widgets.ExitConfirmDialog
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    // TODO: substituir pelo teu Web Client ID (tipo "Web application")
    // criado no Google Cloud Console -> APIs & Services -> Credentials.
    // NÃO é o Android Client ID — o Credential Manager exige sempre o Web Client ID.
    private val googleWebClientId = "SUBSTITUI_PELO_TEU_WEB_CLIENT_ID.apps.googleusercontent.com"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn(this)) {
            goToHome()
            return
        }

        setupStatusBar()
        setContentView(R.layout.activity_login)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        PngImageLoader.load(this, logoIcon, "icons/png/logo.png")

        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "email.svg", 22, 22)
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

    private fun setupStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = androidx.core.content.ContextCompat.getColor(this, R.color.bg_primary)
        window.navigationBarColor = androidx.core.content.ContextCompat.getColor(this, R.color.bg_primary)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
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
                val result = credentialManager.getCredential(
                    request = request,
                    context = this@LoginActivity
                )
                val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
                // TODO: enviar credential.idToken ao teu backend (Worker) para
                // validar e trocar por uma sessão própria via SessionManager.saveSession(...),
                // tal como já acontece no fluxo de EmailLoginActivity.
                Toast.makeText(
                    this@LoginActivity,
                    "Conta Google selecionada: ${credential.id}",
                    Toast.LENGTH_SHORT
                ).show()
            } catch (e: GetCredentialException) {
                Toast.makeText(
                    this@LoginActivity,
                    "Login com Google cancelado ou indisponível",
                    Toast.LENGTH_SHORT
                ).show()
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