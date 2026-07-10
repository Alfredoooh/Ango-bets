package com.nexa.app

import android.content.Context
import android.view.LayoutInflater
import android.widget.ImageView
import android.widget.TextView
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.button.MaterialButton
import com.nexa.app.session.SessionManager

/**
 * Drawer de conta nativo, espelhando exatamente o conteúdo de
 * AppDrawer.svelte: avatar, nome, tema (dark/light/system), instalar,
 * definições, ajuda, terminar sessão.
 *
 * Aberto via ponte JS (AccountDrawerBridge) quando o utilizador toca no
 * profile-btn do AppHeader.svelte na Home.
 */
class AccountDrawerSheet(
    private val context: Context,
    private val onThemeSelected: (theme: String) -> Unit,
    private val onLogoutConfirmed: () -> Unit
) {

    private var currentTheme: String = "system"

    fun show() {
        val dialog = BottomSheetDialog(context)
        val view = LayoutInflater.from(context).inflate(R.layout.dialog_account_drawer, null)
        dialog.setContentView(view)

        bindHeader(view)
        bindThemeAccordion(view)
        bindMenuItems(view, dialog)
        bindLogout(view, dialog)

        dialog.show()
    }

    private fun bindHeader(view: android.view.View) {
        val nameView = view.findViewById<TextView>(R.id.drawerUserName)
        val initialView = view.findViewById<TextView>(R.id.drawerAvatarInitial)
        val name = SessionManager.getName(context) ?: "Utilizador"
        nameView.text = name
        initialView.text = name.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "U"
    }

    private fun bindThemeAccordion(view: android.view.View) {
        val nav = view.findViewById<com.google.android.material.navigation.NavigationView>(R.id.accountNavigationView)
        val themeContainer = view.findViewById<android.widget.LinearLayout>(R.id.themeOptionsContainer)
        val optionDark = view.findViewById<TextView>(R.id.themeOptionDark)
        val optionLight = view.findViewById<TextView>(R.id.themeOptionLight)
        val optionSystem = view.findViewById<TextView>(R.id.themeOptionSystem)

        fun selectTheme(theme: String) {
            currentTheme = theme
            onThemeSelected(theme)
            highlightSelected(optionDark, optionLight, optionSystem, theme)
        }

        highlightSelected(optionDark, optionLight, optionSystem, currentTheme)

        optionDark.setOnClickListener { selectTheme("dark") }
        optionLight.setOnClickListener { selectTheme("light") }
        optionSystem.setOnClickListener { selectTheme("system") }

        nav.setNavigationItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_theme -> {
                    themeContainer.visibility =
                        if (themeContainer.visibility == android.view.View.VISIBLE) {
                            android.view.View.GONE
                        } else {
                            android.view.View.VISIBLE
                        }
                    true
                }
                R.id.nav_install -> {
                    // A instalação de PWA é tratada pelo próprio browser/WebView;
                    // aqui apenas fechamos o item, sem ação adicional necessária
                    // porque a app nativa já está instalada por definição.
                    true
                }
                R.id.nav_settings -> {
                    android.widget.Toast.makeText(context, R.string.drawer_settings, android.widget.Toast.LENGTH_SHORT).show()
                    true
                }
                R.id.nav_help -> {
                    android.widget.Toast.makeText(context, R.string.drawer_help, android.widget.Toast.LENGTH_SHORT).show()
                    true
                }
                else -> false
            }
        }
    }

    private fun highlightSelected(dark: TextView, light: TextView, system: TextView, selected: String) {
        val normal = android.graphics.Typeface.NORMAL
        val bold = android.graphics.Typeface.BOLD
        dark.setTypeface(dark.typeface, if (selected == "dark") bold else normal)
        light.setTypeface(light.typeface, if (selected == "light") bold else normal)
        system.setTypeface(system.typeface, if (selected == "system") bold else normal)
    }

    private fun bindMenuItems(view: android.view.View, dialog: BottomSheetDialog) {
        // Os cliques em Definições/Ajuda já são tratados em bindThemeAccordion
        // via setNavigationItemSelectedListener; nada adicional aqui.
    }

    private fun bindLogout(view: android.view.View, dialog: BottomSheetDialog) {
        val logoutButton = view.findViewById<MaterialButton>(R.id.drawerLogoutButton)
        logoutButton.setOnClickListener {
            androidx.appcompat.app.AlertDialog.Builder(context)
                .setMessage(R.string.drawer_logout_confirm)
                .setNegativeButton(R.string.action_cancel, null)
                .setPositiveButton(R.string.drawer_logout) { _, _ ->
                    dialog.dismiss()
                    onLogoutConfirmed()
                }
                .show()
        }
    }
}