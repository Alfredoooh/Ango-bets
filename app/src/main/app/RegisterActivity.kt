// app/src/main/java/com/nexa/app/RegisterActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.util.ThemeApplier
import com.nexa.app.util.ThemeColors
import com.nexa.app.util.ThemePalette

class RegisterActivity : AppCompatActivity() {

    private var isDark = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        isDark = ThemePreference.resolveIsDark(this)
        val palette = ThemeColors.get(isDark)

        setupStatusBar(isDark)
        setContentView(R.layout.activity_register)
        applyTheme(palette)

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "logo.svg", widthDp = 80, heightDp = 80, tintColor = palette.textPrimary)

        val iconEmail = findViewById<ImageView>(R.id.iconEmail)
        iconEmail.setImageResource(R.drawable.ic_fluent_mail_24_regular)
        iconEmail.setColorFilter(palette.textPrimary)

        findViewById<ImageView>(R.id.iconGoogle).setImageResource(R.drawable.ic_fluent_google_24_regular)

        findViewById<LinearLayout>(R.id.btnGoogle).setOnClickListener {
            // TODO: mesmo fluxo Credential Manager já usado em LoginActivity.
        }
        findViewById<LinearLayout>(R.id.btnEmail).setOnClickListener {
            startActivity(Intent(this, EmailRegisterActivity::class.java))
        }

        findViewById<TextView>(R.id.goToLogin).setOnClickListener {
            finish()
        }
    }

    private fun applyTheme(palette: ThemePalette) {
        val root = findViewById<View>(R.id.rootRegister)
        ThemeApplier.applyBackground(root, palette)

        ThemeApplier.applyPrimaryText(findViewById(R.id.screenTitle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textGoogle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textEmail), palette)
        ThemeApplier.applyAccentText(findViewById(R.id.goToLogin), isDark)
        ThemeApplier.applySecondaryText(findViewById(R.id.orText), palette)
        ThemeApplier.applySecondaryText(findViewById(R.id.termsText), palette)

        ThemeApplier.applyDivider(findViewById(R.id.dividerLeft), palette)
        ThemeApplier.applyDivider(findViewById(R.id.dividerRight), palette)

        ThemeApplier.applyFluentSecondaryButton(findViewById(R.id.btnGoogle), palette, isDark, this)
        ThemeApplier.applyFluentSecondaryButton(findViewById(R.id.btnEmail), palette, isDark, this)
    }

    private fun setupStatusBar(isDark: Boolean) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val bgColor = ThemeColors.get(isDark).bgPrimary
        window.statusBarColor = bgColor
        window.navigationBarColor = bgColor
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = !isDark
            isAppearanceLightNavigationBars = !isDark
        }
    }
}