package com.nexa.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.updatePadding
import com.nexa.app.util.DocumentStorage
import com.nexa.app.util.SvgImageLoader
import com.nexa.app.util.ThemePreferenceManager
import com.nexa.app.widget.BottomSheetHelper
import com.nexa.app.widget.ColorPickerSheet
import com.nexa.app.widget.CustomSwitch

class SettingsActivity : AppCompatActivity() {

    private lateinit var tabChatContent: View
    private lateinit var tabEditContent: View
    private lateinit var tabChatBtn: LinearLayout
    private lateinit var tabEditBtn: LinearLayout
    private lateinit var tabChatLabel: TextView
    private lateinit var tabEditLabel: TextView
    private lateinit var tabIndicator: View
    private lateinit var settingsBottomTabBar: View
    private lateinit var settingsHeader: View

    private lateinit var editorWebView: WebView

    private var currentTab = TAB_CHAT

    companion object {
        private const val TAB_CHAT = 0
        private const val TAB_EDIT = 1
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupStatusBar()
        setContentView(R.layout.activity_settings)

        bindViews()
        setupInsets()
        setupHeader()
        setupTabs()
        setupThemeOptions()
        setupGeneralOptions()
        setupEditorTab()

        selectTab(TAB_CHAT, animate = false)
    }

    private fun bindViews() {
        settingsHeader = findViewById(R.id.settingsHeader)
        tabChatContent = findViewById(R.id.tabChatContent)
        tabEditContent = findViewById(R.id.tabEditContent)
        settingsBottomTabBar = findViewById(R.id.settingsBottomTabBar)

        tabChatBtn = settingsBottomTabBar.findViewById(R.id.tabChatBtn)
        tabEditBtn = settingsBottomTabBar.findViewById(R.id.tabEditBtn)
        tabChatLabel = settingsBottomTabBar.findViewById(R.id.tabChatLabel)
        tabEditLabel = settingsBottomTabBar.findViewById(R.id.tabEditLabel)
        tabIndicator = settingsBottomTabBar.findViewById(R.id.tabIndicator)

        editorWebView = tabEditContent.findViewById(R.id.editorWebView)
    }

    /**
     * Statusbar transparente + ícones claros/escuros de acordo com o tema
     * ativo. fitsSystemWindows está a false no XML de propósito — os
     * insets são aplicados manualmente abaixo em setupInsets() para dar
     * controlo total sobre onde cada painel (header, bottomtabbar) deve
     * "respeitar" a área de sistema.
     */
    private fun setupStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = resources.getBoolean(R.bool.isLightTheme)
            isAppearanceLightNavigationBars = resources.getBoolean(R.bool.isLightTheme)
        }
    }

    /**
     * Aplica manualmente os insets de sistema: o header ganha padding-top
     * igual à altura da statusbar (para o botão de voltar e o título não
     * ficarem por baixo dela), e o bottomtabbar ganha padding-bottom igual
     * à altura da navigation bar (para não ficar tapado pelos botões de
     * navegação do sistema em gestos/3-botões).
     */
    private fun setupInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(settingsHeader) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.updatePadding(top = systemBars.top)
            insets
        }
        ViewCompat.setOnApplyWindowInsetsListener(settingsBottomTabBar) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.updatePadding(bottom = systemBars.bottom)
            insets
        }
    }

    private fun setupHeader() {
        val textColor = ContextCompat.getColor(this, R.color.text_primary)
        val backBtn = findViewById<ImageView>(R.id.backBtn)
        SvgImageLoader.loadDp(this, backBtn, "back.svg", widthDp = 24, heightDp = 24, tintColor = textColor)
        backBtn.setOnClickListener { finish() }
    }

    // ══════════════════════════════════════════════════════════════
    //  Tabs (Chat / Edit)
    // ══════════════════════════════════════════════════════════════

    private fun setupTabs() {
        tabChatBtn.setOnClickListener { selectTab(TAB_CHAT, animate = true) }
        tabEditBtn.setOnClickListener { selectTab(TAB_EDIT, animate = true) }

        // O indicador precisa de largura igual à de cada botão de tab, mas
        // só sabemos isso depois do primeiro layout pass — por isso é
        // ajustado aqui via post().
        settingsBottomTabBar.post {
            val tabWidth = tabChatBtn.width
            val params = tabIndicator.layoutParams
            params.width = tabWidth
            tabIndicator.layoutParams = params
            tabIndicator.translationX = 0f
        }
    }

    private fun selectTab(tab: Int, animate: Boolean) {
        currentTab = tab

        tabChatContent.visibility = if (tab == TAB_CHAT) View.VISIBLE else View.GONE
        tabEditContent.visibility = if (tab == TAB_EDIT) View.VISIBLE else View.GONE

        val selectedColor = ContextCompat.getColor(this, R.color.tab_selected)
        val unselectedColor = ContextCompat.getColor(this, R.color.tab_unselected)

        tabChatLabel.setTextColor(if (tab == TAB_CHAT) selectedColor else unselectedColor)
        tabChatLabel.setTypeface(null, if (tab == TAB_CHAT) android.graphics.Typeface.BOLD else android.graphics.Typeface.NORMAL)

        tabEditLabel.setTextColor(if (tab == TAB_EDIT) selectedColor else unselectedColor)
        tabEditLabel.setTypeface(null, if (tab == TAB_EDIT) android.graphics.Typeface.BOLD else android.graphics.Typeface.NORMAL)

        val targetX = if (tab == TAB_CHAT) 0f else tabChatBtn.width.toFloat()
        if (animate) {
            tabIndicator.animate()
                .translationX(targetX)
                .setDuration(200)
                .setInterpolator(DecelerateInterpolator())
                .start()
        } else {
            tabIndicator.translationX = targetX
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  Tab Chat → lista de settings (tema + geral) + input colado
    // ══════════════════════════════════════════════════════════════

    private fun setupThemeOptions() {
        val rowLight = tabChatContent.findViewById<View>(R.id.rowThemeLight)
        val rowDark = tabChatContent.findViewById<View>(R.id.rowThemeDark)
        val rowAuto = tabChatContent.findViewById<View>(R.id.rowThemeAuto)

        configureThemeRow(rowLight, getString(R.string.settings_theme_light))
        configureThemeRow(rowDark, getString(R.string.settings_theme_dark))
        configureThemeRow(rowAuto, getString(R.string.settings_theme_auto))

        rowLight.setOnClickListener { applyThemeChoice(ThemePreferenceManager.THEME_LIGHT) }
        rowDark.setOnClickListener { applyThemeChoice(ThemePreferenceManager.THEME_DARK) }
        rowAuto.setOnClickListener { applyThemeChoice(ThemePreferenceManager.THEME_AUTO) }

        refreshThemeCheckmarks()
    }

    private fun configureThemeRow(row: View, label: String) {
        row.findViewById<TextView>(R.id.rowLabel).text = label
        val checkIcon = row.findViewById<ImageView>(R.id.rowCheckIcon)
        checkIcon.setImageResource(R.drawable.ic_check)
    }

    private fun applyThemeChoice(mode: String) {
        ThemePreferenceManager.setThemeMode(this, mode)
        refreshThemeCheckmarks()
        // setDefaultNightMode despoleta uma recriação da Activity para
        // aplicar as resources corretas (values vs values-night) — isto é
        // comportamento esperado e necessário do AppCompatDelegate; não é
        // um bug. A tab selecionada mantém-se via onSaveInstanceState.
    }

    private fun refreshThemeCheckmarks() {
        val current = ThemePreferenceManager.getThemeMode(this)

        val rowLight = tabChatContent.findViewById<View>(R.id.rowThemeLight)
        val rowDark = tabChatContent.findViewById<View>(R.id.rowThemeDark)
        val rowAuto = tabChatContent.findViewById<View>(R.id.rowThemeAuto)

        rowLight.findViewById<ImageView>(R.id.rowCheckIcon).visibility =
            if (current == ThemePreferenceManager.THEME_LIGHT) View.VISIBLE else View.INVISIBLE
        rowDark.findViewById<ImageView>(R.id.rowCheckIcon).visibility =
            if (current == ThemePreferenceManager.THEME_DARK) View.VISIBLE else View.INVISIBLE
        rowAuto.findViewById<ImageView>(R.id.rowCheckIcon).visibility =
            if (current == ThemePreferenceManager.THEME_AUTO) View.VISIBLE else View.INVISIBLE
    }

    private fun setupGeneralOptions() {
        val rowLanguage = tabChatContent.findViewById<View>(R.id.rowLanguage)
        rowLanguage.findViewById<TextView>(R.id.valueLabel).text = getString(R.string.settings_language)
        rowLanguage.findViewById<TextView>(R.id.valueRight).text = getString(R.string.settings_language_value)
        // Seleção de idioma fica preparada para expansão futura (ex.: abrir
        // um bottom sheet com lista de idiomas); por agora é só display.

        val rowNotifications = tabChatContent.findViewById<View>(R.id.rowNotifications)
        rowNotifications.findViewById<TextView>(R.id.toggleLabel).text = getString(R.string.settings_notifications)
        val notifSwitch = rowNotifications.findViewById<CustomSwitch>(R.id.toggleSwitch)
        notifSwitch.setChecked(getNotificationsEnabled(), animate = false)
        notifSwitch.setOnCheckedChangeListener { checked ->
            setNotificationsEnabled(checked)
        }
    }

    private fun getNotificationsEnabled(): Boolean {
        return getSharedPreferences("nexa_prefs", Context.MODE_PRIVATE)
            .getBoolean("notifications_enabled", true)
    }

    private fun setNotificationsEnabled(enabled: Boolean) {
        getSharedPreferences("nexa_prefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("notifications_enabled", enabled)
            .apply()
    }

    // ══════════════════════════════════════════════════════════════
    //  Tab Edit → WebView do papel A4 + toolbar de formatação
    // ══════════════════════════════════════════════════════════════

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupEditorTab() {
        editorWebView.settings.javaScriptEnabled = true
        editorWebView.settings.domStorageEnabled = true
        editorWebView.setBackgroundColor(ContextCompat.getColor(this, R.color.bg_primary))

        editorWebView.addJavascriptInterface(EditorBridge(), "AndroidBridge")

        editorWebView.loadUrl("file:///android_asset/editor_a4.html")

        setupToolbar()
    }

    private fun setupToolbar() {
        val toolbar = tabEditContent.findViewById<View>(R.id.editorToolbar)
        val textColor = ContextCompat.getColor(this, R.color.toolbar_icon)

        val btnBold = toolbar.findViewById<ImageView>(R.id.btnBold)
        val btnItalic = toolbar.findViewById<ImageView>(R.id.btnItalic)
        val btnUnderline = toolbar.findViewById<ImageView>(R.id.btnUnderline)
        val btnColor = toolbar.findViewById<ImageView>(R.id.btnColor)
        val btnTable = toolbar.findViewById<ImageView>(R.id.btnTable)
        val btnImage = toolbar.findViewById<ImageView>(R.id.btnImage)

        SvgImageLoader.loadDp(this, btnBold, "back.svg", widthDp = 20, heightDp = 20, tintColor = textColor)
        SvgImageLoader.loadDp(this, btnItalic, "back.svg", widthDp = 20, heightDp = 20, tintColor = textColor)
        SvgImageLoader.loadDp(this, btnUnderline, "back.svg", widthDp = 20, heightDp = 20, tintColor = textColor)
        SvgImageLoader.loadDp(this, btnColor, "theme.svg", widthDp = 20, heightDp = 20, tintColor = textColor)
        SvgImageLoader.loadDp(this, btnTable, "menu.svg", widthDp = 20, heightDp = 20, tintColor = textColor)
        SvgImageLoader.loadDp(this, btnImage, "user.svg", widthDp = 20, heightDp = 20, tintColor = textColor)
        // Nota: os SVGs acima (back/theme/menu/user) são placeholders
        // temporários reaproveitados dos assets já existentes — assim que
        // tiveres os ícones definitivos de negrito/itálico/sublinhado/
        // tabela/imagem em assets/, troca só a string do nome do ficheiro
        // aqui, o resto do código não muda.

        btnBold.setOnClickListener { execEditorCommand("bold") }
        btnItalic.setOnClickListener { execEditorCommand("italic") }
        btnUnderline.setOnClickListener { execEditorCommand("underline") }
        btnTable.setOnClickListener { execEditorCommand("insertTable") }
        btnImage.setOnClickListener { execEditorCommand("insertImage") }

        btnColor.setOnClickListener { showColorPickerSheet() }
    }

    private fun execEditorCommand(command: String) {
        editorWebView.evaluateJavascript("window.editorApi && window.editorApi.exec('$command')", null)
    }

    private fun showColorPickerSheet() {
        val sheet = BottomSheetHelper(this)
        val content = ColorPickerSheet.build(this) { colorInt ->
            val hex = String.format("#%06X", 0xFFFFFF and colorInt)
            editorWebView.evaluateJavascript("window.editorApi && window.editorApi.setColor('$hex')", null)
            sheet.dismissAnimated()
        }
        sheet.setContentView2(content)
        sheet.show()
    }

    /**
     * Ponte JS↔Kotlin exposta ao WebView do editor A4. O HTML/JS do lado
     * do "papel" chama window.AndroidBridge.saveDocument(html) sempre que
     * o conteúdo muda (com debounce, para não escrever em disco a cada
     * tecla), e este lado persiste via DocumentStorage.
     */
    inner class EditorBridge {
        @JavascriptInterface
        fun saveDocument(html: String) {
            DocumentStorage.save(this@SettingsActivity, html)
        }

        @JavascriptInterface
        fun loadDocument(): String {
            return DocumentStorage.load(this@SettingsActivity) ?: ""
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putInt("current_tab", currentTab)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        val restoredTab = savedInstanceState.getInt("current_tab", TAB_CHAT)
        selectTab(restoredTab, animate = false)
    }
}