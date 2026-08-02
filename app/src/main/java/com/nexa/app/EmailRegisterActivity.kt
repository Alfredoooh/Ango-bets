// app/src/main/java/com/nexa/app/EmailRegisterActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.util.TypedValue
import android.view.View
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import com.nexa.app.api.ApiClient
import com.nexa.app.api.ApiErrorParser
import com.nexa.app.api.RegisterRequest
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.util.ThemeApplier
import com.nexa.app.util.ThemeColors
import com.nexa.app.util.ThemePalette
import kotlinx.coroutines.launch

class EmailRegisterActivity : AppCompatActivity() {

    private lateinit var nameInput: EditText
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var registerButton: LinearLayout
    private lateinit var backBtn: ImageView
    private var isDark = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        isDark = ThemePreference.resolveIsDark(this)
        val palette = ThemeColors.get(isDark)

        setupStatusBar(isDark)
        setContentView(R.layout.activity_email_register)

        nameInput = findViewById(R.id.nameEditText)
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        registerButton = findViewById(R.id.registerButton)
        backBtn = findViewById(R.id.backBtn)

        applyTheme(palette)
        applyBackBtnTopInset()
        setupKeyboardAvoiding()

        val logoIcon = findViewById<ImageView>(R.id.logoIcon)
        SvgImageLoader.loadDp(this, logoIcon, "logo.svg", widthDp = 48, heightDp = 48, tintColor = palette.textPrimary)

        backBtn.setImageResource(R.drawable.ic_fluent_arrow_left_24_regular)
        backBtn.setColorFilter(palette.textPrimary)

        registerButton.setOnClickListener { attemptRegister() }

        backBtn.setOnClickListener { finish() }

        findViewById<TextView>(R.id.goToLogin).setOnClickListener {
            startActivity(Intent(this, EmailLoginActivity::class.java))
        }
    }

    private fun applyBackBtnTopInset() {
        ViewCompat.setOnApplyWindowInsetsListener(backBtn) { view, insets ->
            val statusBarHeight = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top
            (view.layoutParams as? android.view.ViewGroup.MarginLayoutParams)?.let { lp ->
                lp.topMargin = statusBarHeight + dp(14)
                view.layoutParams = lp
            }
            insets
        }
        ViewCompat.requestApplyInsets(backBtn)
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun setupKeyboardAvoiding() {
        val scrollView = findViewById<ScrollView>(R.id.emailRegisterScrollView)
        ViewCompat.setOnApplyWindowInsetsListener(scrollView) { view, insets ->
            val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            val navHeight = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
            view.setPadding(view.paddingLeft, view.paddingTop, view.paddingRight, maxOf(imeHeight, navHeight))
            insets
        }
        ViewCompat.requestApplyInsets(scrollView)
    }

    private fun applyTheme(palette: ThemePalette) {
        val root = findViewById<View>(R.id.rootEmailRegister)
        ThemeApplier.applyBackground(root, palette)

        ThemeApplier.applyPrimaryText(findViewById(R.id.screenTitle), palette)
        ThemeApplier.applyOnAccentText(findViewById(R.id.registerButtonText), isDark)
        ThemeApplier.applyAccentText(findViewById(R.id.goToLogin), isDark)
        ThemeApplier.applySecondaryText(findViewById(R.id.termsText), palette)

        nameInput.setTextColor(palette.textPrimary)
        nameInput.setHintTextColor(palette.textSecondary)
        emailInput.setTextColor(palette.textPrimary)
        emailInput.setHintTextColor(palette.textSecondary)
        passwordInput.setTextColor(palette.textPrimary)
        passwordInput.setHintTextColor(palette.textSecondary)

        ThemeApplier.applyCardBackground(nameInput, palette, 8f, this)
        ThemeApplier.applyCardBackground(emailInput, palette, 8f, this)
        ThemeApplier.applyCardBackground(passwordInput, palette, 8f, this)
        ThemeApplier.applyFluentPrimaryButton(registerButton, isDark, this)

        val backgroundTypedValue = TypedValue()
        theme.resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, backgroundTypedValue, true)
        backBtn.setBackgroundResource(backgroundTypedValue.resourceId)
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

    private fun attemptRegister() {
        val name = nameInput.text?.toString()?.trim().orEmpty()
        val email = emailInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        if (name.isEmpty()) {
            Toast.makeText(this, "Nome obrigatório", Toast.LENGTH_SHORT).show()
            return
        }
        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Email inválido", Toast.LENGTH_SHORT).show()
            return
        }
        if (password.length < 6) {
            Toast.makeText(this, "Palavra-passe deve ter pelo menos 6 caracteres", Toast.LENGTH_SHORT).show()
            return
        }

        setLoading(true)

        lifecycleScope.launch {
            try {
                val response = ApiClient.authApi.register(RegisterRequest(name, email, password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        SessionManager.saveSession(
                            context = this@EmailRegisterActivity,
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
        registerButton.isEnabled = !loading
        registerButton.alpha = if (loading) 0.6f else 1f
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}