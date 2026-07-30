// app/src/main/java/com/nexa/app/EmailLoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
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
import com.nexa.app.api.LoginRequest
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeApplier
import com.nexa.app.util.ThemeColors
import com.nexa.app.util.ThemePalette
import kotlinx.coroutines.launch

class EmailLoginActivity : AppCompatActivity() {

    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: LinearLayout
    private lateinit var backBtn: ImageView
    private var isDark = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        isDark = ThemePreference.resolveIsDark(this)
        val palette = ThemeColors.get(isDark)

        setupStatusBar(isDark)
        setContentView(R.layout.activity_email_login)

        // As propriedades têm de estar inicializadas ANTES de applyTheme(),
        // que lhes acede diretamente (emailInput.setTextColor, etc.).
        emailInput = findViewById(R.id.emailEditText)
        passwordInput = findViewById(R.id.passwordEditText)
        loginButton = findViewById(R.id.loginButton)
        backBtn = findViewById(R.id.backBtn)

        applyTheme(palette)
        applyBackBtnTopInset()
        setupKeyboardAvoiding()

        findViewById<ImageView>(R.id.logoIcon).apply {
            setImageResource(R.drawable.ic_fluent_logo_nexa_48)
            setColorFilter(palette.textPrimary)
        }
        backBtn.setImageResource(R.drawable.ic_fluent_arrow_left_24_regular)
        backBtn.setColorFilter(palette.textPrimary)

        loginButton.setOnClickListener { attemptLogin() }

        backBtn.setOnClickListener { finish() }

        findViewById<TextView>(R.id.goToRegister).setOnClickListener {
            startActivity(Intent(this, EmailRegisterActivity::class.java))
        }
    }

    /** Empurra o botão de voltar para baixo da status bar, sem valor fixo em dp. */
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

    /**
     * Keyboard avoiding real e determinístico: com edge-to-edge ativo
     * (decorFitsSystemWindows = false), o Manifest "adjustResize" já não
     * é suficiente sozinho em todas as versões do Android — aqui
     * aplicamos manualmente o inset do teclado (ime()) como padding
     * inferior do ScrollView, para que:
     * 1. O conteúdo suba imediatamente quando o teclado abre;
     * 2. O campo focado fique sempre visível acima do teclado
     *    (o ScrollView, sendo fillViewport + scrollável, garante isto
     *    automaticamente assim que o padding cresce);
     * 3. O botão de ação principal (loginButton) nunca fique escondido
     *    por trás do teclado, porque está dentro do próprio ScrollView,
     *    logo sobe junto com todo o resto do conteúdo.
     * Quando o teclado fecha, volta a usar o inset da nav bar do
     * sistema (gesture bar / botões), nunca ficando com padding a mais
     * nem a menos.
     */
    private fun setupKeyboardAvoiding() {
        val scrollView = findViewById<ScrollView>(R.id.emailLoginScrollView)
        ViewCompat.setOnApplyWindowInsetsListener(scrollView) { view, insets ->
            val imeHeight = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            val navHeight = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
            view.setPadding(view.paddingLeft, view.paddingTop, view.paddingRight, maxOf(imeHeight, navHeight))
            insets
        }
        ViewCompat.requestApplyInsets(scrollView)
    }

    /**
     * loginButton passa a botão PRIMÁRIO Fluent 2 — azul sólido, texto
     * branco (applyOnAccentText, não applyPrimaryText, porque o texto
     * está sobre um fundo azul, não sobre o fundo da tela). Os campos
     * de input (email/password) mantêm-se como cartões neutros — no
     * Fluent 2 os inputs de texto não levam cor de acento, só o botão
     * de ação final. goToRegister usa a cor de acento, como nos
     * outros ecrãs.
     *
     * backBtn deixa de ter QUALQUER fundo (sem pill, sem cartão) — é só
     * o ícone Fluent puro sobre o fundo da tela, com ripple sem forma
     * própria (selectableItemBackgroundBorderless), consistente com o
     * botão de tema em LoginActivity.
     */
    private fun applyTheme(palette: ThemePalette) {
        val root = findViewById<View>(R.id.rootEmailLogin)
        ThemeApplier.applyBackground(root, palette)

        ThemeApplier.applyPrimaryText(findViewById(R.id.screenTitle), palette)
        ThemeApplier.applyOnAccentText(findViewById(R.id.loginButtonText), isDark)
        ThemeApplier.applyAccentText(findViewById(R.id.goToRegister), isDark)
        ThemeApplier.applySecondaryText(findViewById(R.id.termsText), palette)

        emailInput.setTextColor(palette.textPrimary)
        emailInput.setHintTextColor(palette.textSecondary)
        passwordInput.setTextColor(palette.textPrimary)
        passwordInput.setHintTextColor(palette.textSecondary)

        ThemeApplier.applyCardBackground(emailInput, palette, 8f, this)
        ThemeApplier.applyCardBackground(passwordInput, palette, 8f, this)
        ThemeApplier.applyFluentPrimaryButton(loginButton, isDark, this)

        val backgroundTypedValue = android.util.TypedValue()
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

    private fun attemptLogin() {
        val email = emailInput.text?.toString()?.trim().orEmpty()
        val password = passwordInput.text?.toString().orEmpty()

        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Email inválido", Toast.LENGTH_SHORT).show()
            return
        }
        if (password.isEmpty()) {
            Toast.makeText(this, "Palavra-passe obrigatória", Toast.LENGTH_SHORT).show()
            return
        }

        setLoading(true)

        lifecycleScope.launch {
            try {
                val response = ApiClient.authApi.login(LoginRequest(email, password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        SessionManager.saveSession(
                            context = this@EmailLoginActivity,
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
                    val message = ApiErrorParser.extractMessage(response, "Email ou palavra-passe incorretos")
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
        loginButton.alpha = if (loading) 0.6f else 1f
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}