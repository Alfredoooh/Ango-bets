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
import com.nexa.app.util.PngImageLoader
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
        SvgImageLoader.loadDp(this, logoIcon, "icons/svg/logo.svg", 124, 124, palette.textPrimary)

        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "email.svg", 22, 22, palette.textPrimary)
        PngImageLoader.load(this, findViewById(R.id.iconGoogle), "icons/png/google.png")

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

    /**
     * btnGoogle e btnEmail passam a botões secundários Fluent 2
     * (outline azul), consistentes com LoginActivity. goToLogin usa a
     * cor de acento no texto, como o link equivalente na Microsoft.
     */
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