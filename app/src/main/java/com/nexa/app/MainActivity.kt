// app/src/main/java/com/nexa/app/MainActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // O tema de splash tem de ser escolhido ANTES de installSplashScreen()
        // e ANTES de super.onCreate(), para o sistema já pintar o splash com
        // a cor/ícone certos desde o primeiro frame. Lemos ThemePreference
        // (o último tema reportado pelo PWA) em vez do uiMode do sistema,
        // para o splash respeitar sempre o tema escolhido dentro da app.
        if (ThemePreference.resolveIsDark(this)) {
            setTheme(R.style.Theme_Nexa_Splash_Dark)
        } else {
            setTheme(R.style.Theme_Nexa_Splash)
        }

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