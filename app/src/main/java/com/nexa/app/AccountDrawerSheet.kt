package com.nexa.app

import android.app.Dialog
import android.content.Context
import android.graphics.Typeface
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.nexa.app.session.SessionManager

/**
 * Drawer de conta nativo LATERAL (não bottom sheet), espelhando
 * AppDrawer.svelte: avatar, nome, tema (dark/light/system), definições,
 * ajuda, terminar sessão. Ancorado à direita, largura fixa, altura total.
 *
 * Todas as callbacks (onThemeSelected, onLogoutConfirmed) são invocadas de
 * dentro de listeners de clique, portanto já correm na UI thread — mas
 * protegemos mesmo assim com try/catch para nunca crashar a app por causa
 * do drawer, mesmo que o lado que consome a callback tenha um bug.
 */
class AccountDrawerSheet(
    private val context: Context,
    private val isDark: Boolean,
    private val onThemeSelected: (theme: String) -> Unit,
    private val onLogoutConfirmed: () -> Unit
) {

    private var currentTheme: String = if (isDark) "dark" else "light"
    private var dialog: Dialog? = null

    fun show() {
        val activity = context as? android.app.Activity
        if (activity == null || activity.isFinishing || activity.isDestroyed) {
            // Contexto inválido para mostrar um Dialog -> não faz nada em
            // vez de crashar com WindowManager.BadTokenException.
            return
        }

        val dlg = Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar)
        val view = LayoutInflater.from(activity).inflate(R.layout.dialog_account_drawer, null)
        dlg.setContentView(view)

        dlg.window?.apply {
            setLayout(WindowManager.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setGravity(Gravity.END)
            setBackgroundDrawableResource(android.R.color.transparent)
            attributes = attributes?.apply {
                windowAnimations = android.R.style.Animation_Translucent
            }
        }

        try {
            bindHeader(view)
            bindThemeAccordion(view)
            bindStaticItems(view)
            bindLogout(view, dlg)
        } catch (e: Exception) {
            // Nunca deixar o drawer crashar a app inteira por causa de um
            // findViewById em falta ou id trocado no XML.
            Toast.makeText(activity, "Erro ao abrir o menu", Toast.LENGTH_SHORT).show()
            return
        }

        dialog = dlg
        try {
            dlg.show()
        } catch (e: WindowManager.BadTokenException) {
            // Activity morreu entre o check acima e o show() -> ignora.
        }
    }

    private fun bindHeader(view: View) {
        val nameView = view.findViewById<TextView>(R.id.drawerUserName)
        val initialView = view.findViewById<TextView>(R.id.drawerAvatarInitial)
        val name = SessionManager.getName(context) ?: "Utilizador"
        nameView.text = name
        initialView.text = name.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "U"
    }

    private fun bindThemeAccordion(view: View) {
        val itemTheme = view.findViewById<LinearLayout>(R.id.itemTheme)
        val chevron = view.findViewById<ImageView>(R.id.themeChevron)
        val themeContainer = view.findViewById<LinearLayout>(R.id.themeOptionsContainer)
        val optionDark = view.findViewById<TextView>(R.id.themeOptionDark)
        val optionLight = view.findViewById<TextView>(R.id.themeOptionLight)
        val optionSystem = view.findViewById<TextView>(R.id.themeOptionSystem)

        fun selectTheme(theme: String) {
            currentTheme = theme
            highlightSelected(optionDark, optionLight, optionSystem, theme)
            try {
                onThemeSelected(theme)
            } catch (e: Exception) {
                // Se a HomeActivity falhar a aplicar o tema, o drawer não
                // pode crashar por causa disso.
            }
        }

        highlightSelected(optionDark, optionLight, optionSystem, currentTheme)

        itemTheme.setOnClickListener {
            val expanding = themeContainer.visibility != View.VISIBLE
            themeContainer.visibility = if (expanding) View.VISIBLE else View.GONE
            chevron.animate().rotation(if (expanding) 180f else 0f).setDuration(180).start()
        }

        optionDark.setOnClickListener { selectTheme("dark") }
        optionLight.setOnClickListener { selectTheme("light") }
        optionSystem.setOnClickListener { selectTheme("system") }
    }

    private fun highlightSelected(dark: TextView, light: TextView, system: TextView, selected: String) {
        dark.setTypeface(Typeface.DEFAULT, if (selected == "dark") Typeface.BOLD else Typeface.NORMAL)
        light.setTypeface(Typeface.DEFAULT, if (selected == "light") Typeface.BOLD else Typeface.NORMAL)
        system.setTypeface(Typeface.DEFAULT, if (selected == "system") Typeface.BOLD else Typeface.NORMAL)
    }

    private fun bindStaticItems(view: View) {
        view.findViewById<LinearLayout>(R.id.itemSettings).setOnClickListener {
            Toast.makeText(context, R.string.drawer_settings, Toast.LENGTH_SHORT).show()
        }
        view.findViewById<LinearLayout>(R.id.itemHelp).setOnClickListener {
            Toast.makeText(context, R.string.drawer_help, Toast.LENGTH_SHORT).show()
        }
    }

    private fun bindLogout(view: View, dlg: Dialog) {
        val logoutButton = view.findViewById<TextView>(R.id.drawerLogoutButton)
        logoutButton.setOnClickListener {
            val activity = context as? android.app.Activity
            if (activity == null || activity.isFinishing || activity.isDestroyed) return@setOnClickListener

            AlertDialog.Builder(activity)
                .setMessage(R.string.drawer_logout_confirm)
                .setNegativeButton(R.string.action_cancel, null)
                .setPositiveButton(R.string.drawer_logout) { _, _ ->
                    dlg.dismiss()
                    try {
                        onLogoutConfirmed()
                    } catch (e: Exception) {
                        // idem: não deixar o logout crashar por erro fora daqui
                    }
                }
                .show()
        }
    }
}