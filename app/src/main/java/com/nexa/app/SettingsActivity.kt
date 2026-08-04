package com.nexa.app

import android.os.Bundle
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.util.SvgImageLoader

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupStatusBar()
        setContentView(R.layout.activity_settings)

        val textColor = ContextCompat.getColor(this, R.color.text_primary)
        val backBtn = findViewById<ImageView>(R.id.backBtn)
        SvgImageLoader.loadDp(this, backBtn, "back.svg", widthDp = 24, heightDp = 24, tintColor = textColor)

        backBtn.setOnClickListener {
            finish()
        }
    }

    private fun setupStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = resources.getBoolean(R.bool.isLightTheme)
            isAppearanceLightNavigationBars = resources.getBoolean(R.bool.isLightTheme)
        }
    }
}