package com.nexa.app

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.nexa.app.session.SessionManager

/**
 * Ponto de entrada da app. Só decide para onde ir: se há sessão válida
 * guardada (token em SessionManager), abre a Home; caso contrário, o Login.
 * Não tem UI própria além da splash screen do sistema.
 */
class SplashRouterActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val destination = if (SessionManager.isLoggedIn(this)) {
            HomeActivity::class.java
        } else {
            LoginActivity::class.java
        }

        startActivity(Intent(this, destination))
        finish()
    }
}