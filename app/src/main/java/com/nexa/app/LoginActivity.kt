// app/src/main/java/com/nexa/app/LoginActivity.kt
package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
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
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.PngImageLoader
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.util.ThemeApplier
import com.nexa.app.util.ThemeColors
import com.nexa.app.util.ThemePalette
import com.nexa.app.util.ThemeRevealHelper
import com.nexa.app.widgets.ExitConfirmDialog
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    // TODO: substituir pelo teu Web Client ID do Google Cloud Console.
    private val googleWebClientId = "SUBSTITUI_PELO_TEU_WEB_CLIENT_ID.apps.googleusercontent.com"

    private var isDark = false
    private var isThemeAnimating = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn(this)) {
            goToHome()
            return
        }

        isDark = ThemePreference.resolveIsDark(this)
        val palette = ThemeColors.get(isDark)

        setupStatusBar(isDark)
        setContentView(R.layout.activity_login)
        applyTheme(palette)

        loadLogo(palette)
        loadThemeToggleIcon(palette)

        SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "icons/svg/email.svg", 22, 22, palette.textPrimary)
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

        findViewById<ImageView>(R.id.themeToggleBtn).setOnClickListener { view ->
            toggleTheme(view)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                ExitConfirmDialog.show(this@LoginActivity) {
                    finishAffinity()
                }
            }
        })
    }

    /** Logo em icons/svg/logo.svg, mesmo tamanho (80dp) da tela de registo. */
    private fun loadLogo(palette: ThemePalette) {
        SvgImageLoader.loadDp(this, findViewById(R.id.logoIcon), "icons/svg/logo.svg", 80, 80, palette.textPrimary)
    }

    /** Ícone claro -> lua (para ir para escuro); ícone escuro -> sol (para ir para claro). */
    private fun loadThemeToggleIcon(palette: ThemePalette) {
        val iconPath = if (isDark) "icons/svg/sun.svg" else "icons/svg/moon.svg"
        SvgImageLoader.loadDp(this, findViewById(R.id.themeToggleBtn), iconPath, 22, 22, palette.textPrimary)
    }

    /**
     * Troca o tema com efeito de círculo (container transform) a
     * partir do botão tocado. Ao ir para escuro, o círculo EXPANDE a
     * cobrir o ecrã com o tema novo; ao voltar para claro, é o
     * reverso exato: o círculo ENCOLHE, "recolhendo" o tema escuro de
     * volta para o ponto de origem.
     */
    private fun toggleTheme(originView: View) {
        if (isThemeAnimating) return
        isThemeAnimating = true

        val goingToDark = !isDark
        val oldPalette = ThemeColors.get(isDark)
        val newPalette = ThemeColors.get(goingToDark)
        val root = findViewById<FrameLayout>(R.id.rootLogin)

        val location = IntArray(2)
        originView.getLocationInWindow(location)
        val rootLocation = IntArray(2)
        root.getLocationInWindow(rootLocation)
        val originX = location[0] - rootLocation[0] + originView.width / 2
        val originY = location[1] - rootLocation[1] + originView.height / 2

        ThemeRevealHelper.animateThemeChange(
            rootView = root,
            originX = originX,
            originY = originY,
            oldBackgroundColor = oldPalette.bgPrimary,
            newBackgroundColor = newPalette.bgPrimary,
            isSwitchingToDark = goingToDark
        ) {
            isDark = goingToDark
            ThemePreference.saveIsDark(this, goingToDark)
            applyTheme(newPalette)
            loadLogo(newPalette)
            loadThemeToggleIcon(newPalette)
            SvgImageLoader.loadDp(this, findViewById(R.id.iconEmail), "icons/svg/email.svg", 22, 22, newPalette.textPrimary)
            setupStatusBar(goingToDark)
        }

        // Libertar a trava um pouco depois do fim da animação (500ms no helper).
        root.postDelayed({ isThemeAnimating = false }, 520L)
    }

    /**
     * btnGoogle e btnEmail passam a ser botões SECUNDÁRIOS Fluent 2
     * (outline azul, fundo neutro) em vez de cartões cinzentos sem
     * destaque — o padrão oficial da Microsoft para opções de login
     * alternativas junto a uma ação primária. goToRegister usa a cor
     * de acento diretamente no texto (como o link "Criar conta" no
     * ecrã de login da Microsoft), em vez do texto neutro anterior.
     */
    private fun applyTheme(palette: ThemePalette) {
        val root = findViewById<View>(R.id.rootLogin)
        ThemeApplier.applyBackground(root, palette)

        ThemeApplier.applyPrimaryText(findViewById(R.id.welcomeTitle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textGoogle), palette)
        ThemeApplier.applyPrimaryText(findViewById(R.id.textEmail), palette)
        ThemeApplier.applyAccentText(findViewById(R.id.goToRegister), isDark)
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
                val result = credentialManager.getCredential(request = request, context = this@LoginActivity)
                val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
                // TODO: enviar credential.idToken ao backend, trocar por sessão via SessionManager.saveSession(...).
                Toast.makeText(this@LoginActivity, "Conta Google selecionada: ${credential.id}", Toast.LENGTH_SHORT).show()
            } catch (e: GetCredentialException) {
                Toast.makeText(this@LoginActivity, "Login com Google cancelado ou indisponível", Toast.LENGTH_SHORT).show()
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