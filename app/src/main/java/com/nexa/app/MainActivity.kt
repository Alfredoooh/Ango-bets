// app/src/main/java/com/nexa/app/MainActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.session.SessionManager

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
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