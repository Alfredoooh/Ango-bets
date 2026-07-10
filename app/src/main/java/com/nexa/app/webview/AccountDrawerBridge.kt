package com.nexa.app

import android.content.Context
import android.view.LayoutInflater
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.button.MaterialButton
import com.nexa.app.session.SessionManager

/**
 * Drawer de conta nativo, espelhando exatamente o conteúdo de
 * AppDrawer.svelte: avatar, nome, tema (dark/light/system), definições,
 * ajuda, terminar sessão. Visual próprio (sem NavigationView do Material),
 * consistente com o resto da app.
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
        bindStaticItems(view)
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
        val itemTheme = view.findViewById<LinearLayout>(R.id.itemTheme)
        val chevron = view.findViewById<ImageView>(R.id.themeChevron)
        val themeContainer = view.findViewById<LinearLayout>(R.id.themeOptionsContainer)
        val optionDark = view.findViewById<TextView>(R.id.themeOptionDark)
        val optionLight = view.findViewById<TextView>(R.id.themeOptionLight)
        val optionSystem = view.findViewById<TextView>(R.id.themeOptionSystem)

        fun selectTheme(theme: String) {
            currentTheme = theme
            onThemeSelected(theme)
            highlightSelected(optionDark, optionLight, optionSystem, theme)
        }

        highlightSelected(optionDark, optionLight, optionSystem, currentTheme)

        itemTheme.setOnClickListener {
            val expanding = themeContainer.visibility != android.view.View.VISIBLE
            themeContainer.visibility = if (expanding) android.view.View.VISIBLE else android.view.View.GONE
            chevron.animate().rotation(if (expanding) 180f else 0f).setDuration(180).start()
        }

        optionDark.setOnClickListener { selectTheme("dark") }
        optionLight.setOnClickListener { selectTheme("light") }
        optionSystem.setOnClickListener { selectTheme("system") }
    }

    private fun highlightSelected(dark: TextView, light: TextView, system: TextView, selected: String) {
        val normal = android.graphics.Typeface.NORMAL
        val bold = android.graphics.Typeface.BOLD
        dark.setTypeface(dark.typeface, if (selected == "dark") bold else normal)
        light.setTypeface(light.typeface, if (selected == "light") bold else normal)
        system.setTypeface(system.typeface, if (selected == "system") bold else normal)
    }

    private fun bindStaticItems(view: android.view.View) {
        view.findViewById<LinearLayout>(R.id.itemSettings).setOnClickListener {
            android.widget.Toast.makeText(context, R.string.drawer_settings, android.widget.Toast.LENGTH_SHORT).show()
        }
        view.findViewById<LinearLayout>(R.id.itemHelp).setOnClickListener {
            android.widget.Toast.makeText(context, R.string.drawer_help, android.widget.Toast.LENGTH_SHORT).show()
        }
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