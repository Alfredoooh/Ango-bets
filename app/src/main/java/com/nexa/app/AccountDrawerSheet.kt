package com.nexa.app

import android.app.Dialog
import android.content.Context
import android.graphics.Typeface
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.nexa.app.session.SessionManager

/**
 * Drawer de conta nativo LATERAL, ancorado à direita, com gesto de
 * "arrastar para fechar": o utilizador pode arrastar o painel com o dedo
 * (segue o toque em tempo real) e soltar para fechar — tanto se arrastar
 * mais de 40% da largura do painel, como se soltar com velocidade alta
 * mesmo tendo arrastado pouco (igual ao comportamento do BottomSheet/
 * drawer nativo do Android e do iOS).
 */
class AccountDrawerSheet(
    private val context: Context,
    private val isDark: Boolean,
    private val onThemeSelected: (theme: String) -> Unit,
    private val onLogoutConfirmed: () -> Unit
) {

    private var currentTheme: String = if (isDark) "dark" else "light"
    private var dialog: Dialog? = null
    private var panelView: View? = null
    private var scrimView: View? = null

    private var panelWidthPx = 0f
    private var downX = 0f
    private var downTranslationX = 0f
    private var isDragging = false
    private var lastMoveX = 0f
    private var lastMoveTime = 0L
    private var velocityPxPerMs = 0f

    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop

    fun show() {
        val activity = context as? android.app.Activity
        if (activity == null || activity.isFinishing || activity.isDestroyed) return

        val dlg = Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar)
        val root = FrameLayoutRoot(activity)
        dlg.setContentView(root)

        dlg.window?.apply {
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setGravity(Gravity.END)
            setBackgroundDrawableResource(android.R.color.transparent)
            attributes = attributes?.apply {
                dimAmount = 0f
                flags = flags or WindowManager.LayoutParams.FLAG_DIM_BEHIND
            }
        }

        val scrim = View(activity).apply {
            setBackgroundColor(android.graphics.Color.BLACK)
            alpha = 0f
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setOnClickListener { animateClose() }
        }
        root.addView(scrim)
        scrimView = scrim

        val panel = LayoutInflater.from(activity).inflate(R.layout.dialog_account_drawer, root, false)
        panel.layoutParams = FrameLayout.LayoutParams(
            (300 * activity.resources.displayMetrics.density).toInt(),
            ViewGroup.LayoutParams.MATCH_PARENT
        ).apply {
            gravity = Gravity.END
        }
        root.addView(panel)
        panelView = panel

        try {
            bindHeader(panel)
            bindThemeAccordion(panel)
            bindStaticItems(panel)
            bindLogout(panel, dlg)
            bindDragToClose(panel)
        } catch (e: Exception) {
            Toast.makeText(activity, "Erro ao abrir o menu", Toast.LENGTH_SHORT).show()
            return
        }

        dialog = dlg
        try {
            dlg.show()
            panel.post {
                panelWidthPx = panel.width.toFloat()
                animateOpen()
            }
        } catch (e: WindowManager.BadTokenException) {
            // Activity morreu entre o check acima e o show() -> ignora.
        }
    }

    /** FrameLayout simples só para servir de raiz do Dialog. */
    private class FrameLayoutRoot(context: Context) : android.widget.FrameLayout(context)

    private fun animateOpen() {
        val panel = panelView ?: return
        val scrim = scrimView ?: return
        panel.translationX = panelWidthPx
        panel.animate()
            .translationX(0f)
            .setDuration(260)
            .setInterpolator(android.view.animation.PathInterpolator(0.25f, 0.1f, 0.25f, 1f))
            .start()
        scrim.animate().alpha(0.4f).setDuration(260).start()
    }

    private fun animateClose() {
        val panel = panelView ?: return
        val scrim = scrimView ?: return
        panel.animate()
            .translationX(panelWidthPx)
            .setDuration(220)
            .setInterpolator(android.view.animation.PathInterpolator(0.25f, 0.1f, 0.25f, 1f))
            .withEndAction { dialog?.dismiss() }
            .start()
        scrim.animate().alpha(0f).setDuration(220).start()
    }

    /**
     * Gesto de arrastar para fechar: intercepta o toque no painel inteiro,
     * segue o dedo em tempo real via translationX, e ao soltar decide
     * fechar (se arrastou mais de 40% da largura OU soltou com velocidade
     * alta para a direita) ou volta à posição aberta com animação.
     */
    private fun bindDragToClose(panel: View) {
        panel.setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downX = event.rawX
                    downTranslationX = view.translationX
                    lastMoveX = event.rawX
                    lastMoveTime = event.eventTime
                    velocityPxPerMs = 0f
                    isDragging = false
                    // Não consome ainda: deixa cliques em botões internos
                    // funcionarem normalmente se não houver arrasto real.
                    false
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = event.rawX - downX
                    if (!isDragging && deltaX > touchSlop) {
                        isDragging = true
                        view.parent?.requestDisallowInterceptTouchEvent(true)
                    }
                    if (isDragging) {
                        val newTranslation = (downTranslationX + deltaX).coerceAtLeast(0f)
                        view.translationX = newTranslation
                        val progress = (newTranslation / panelWidthPx).coerceIn(0f, 1f)
                        scrimView?.alpha = 0.4f * (1f - progress)

                        val dt = (event.eventTime - lastMoveTime).coerceAtLeast(1L)
                        velocityPxPerMs = (event.rawX - lastMoveX) / dt
                        lastMoveX = event.rawX
                        lastMoveTime = event.eventTime
                        true
                    } else {
                        false
                    }
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (isDragging) {
                        isDragging = false
                        val progress = (view.translationX / panelWidthPx).coerceIn(0f, 1f)
                        val fastFlingRight = velocityPxPerMs > 1.2f
                        if (progress > 0.4f || fastFlingRight) {
                            animateClose()
                        } else {
                            view.animate()
                                .translationX(0f)
                                .setDuration(200)
                                .setInterpolator(android.view.animation.PathInterpolator(0.25f, 0.1f, 0.25f, 1f))
                                .start()
                            scrimView?.animate()?.alpha(0.4f)?.setDuration(200)?.start()
                        }
                        true
                    } else {
                        false
                    }
                }
                else -> false
            }
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
                com.nexa.app.session.ThemePreference.save(context, theme)
                onThemeSelected(theme)
            } catch (e: Exception) {
                // Nunca deixar a escolha de tema crashar o drawer.
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
                        // idem
                    }
                }
                .show()
        }
    }
}