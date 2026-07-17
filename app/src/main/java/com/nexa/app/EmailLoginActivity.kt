package com.nexa.app

import android.os.Bundle
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.session.SessionManager

class EmailLoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email_login)

        val emailInput = findViewById<EditText>(R.id.emailEditText)
        val passwordInput = findViewById<EditText>(R.id.passwordEditText)

        findViewById<LinearLayout>(R.id.loginButton).setOnClickListener {
            val email = emailInput.text.toString()
            val password = passwordInput.text.toString()
            // TODO: chamar a API real de login (AuthApi) com email/password
            // e, em caso de sucesso, SessionManager.saveToken(this, token) e ir para Home.
        }
    }
}