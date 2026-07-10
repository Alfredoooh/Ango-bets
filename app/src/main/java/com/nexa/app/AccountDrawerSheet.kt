// app/src/main/java/com/nexa/app/AccountDrawerSheet.kt
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
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.view.WindowCompat
import com.nexa.app.session.SessionManager
import com.nexa.app.session.ThemePreference
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Drawer de conta nativo LATERAL, ancorado à direita, com gesto de
 * "arrastar para fechar". A janela do Dialog usa FLAG_LAYOUT_NO_LIMITS e
 * decor edge-to-edge com status bar e navigation bar transparentes, para
 * que o painel se desenhe fisicamente por cima de toda a tela — incluindo
 * a status bar — sem depender de pintar a status bar da Activity por
 * baixo (essa nunca é tocada).
 *
 * O dim por trás do painel é 100% controlado pela própria View `scrimView`
 * (alpha animado manualmente). O dimAmount nativo da Window é forçado a 0
 * e a flag FLAG_DIM_BEHIND é explicitamente removida, porque alguns temas
 * base do sistema aplicam um dim residual próprio por trás de Dialogs
 * mesmo com dimAmount=0f.
 *
 * Troca de tema: ao escolher dark/light/system aqui dentro, o callback
 * onThemeSelected() é responsável por aplicar ThemePreference.save() +
 * repintar a status bar nativa no HomeActivity (ver applyThemeSelection()
 * lá). Este ficheiro só cuida da UI local — realce da opção selecionada
 * e emissão do evento.
 *
 * Guard anti-double-open: tryClaim()/release() são o ÚNICO ponto de
 * verdade sobre se há um drawer aberto/a abrir em qualquer instância.
 * O CALLER (HomeActivity.showAccountDrawer) tem de chamar tryClaim()
 * ANTES de sequer agendar o runOnUiThread — é isso que fecha a race
 * condition. Antes, o guard só era marcado dentro de show(), ou seja,
 * já dentro do Runnable da UI thread; se a bridge JS disparasse
 * openAccountDrawer() duas vezes seguidas (toque físico duplo, ou
 * touchstart+click no botão), os dois Runnables ficavam enfileirados
 * ANTES de qualquer marcação existir, e nasciam dois Dialogs empilhados
 * — o "aparece, desaparece rápido, aparece de novo".
 */
class AccountDrawerSheet(
    private val context: Context,
    private val isDark: Boolean,
    private val onOpenProfile: () -> Unit,
    private val onThemeSelected: (theme: String) -> Unit,
    private val onLogoutConfirmed: () -> Unit
) {

    companion object {
        // AtomicBoolean em vez de @Volatile Boolean: compareAndSet é uma
        // operação atómica única (test-and-set), sem janela entre o "ler"
        // e o "escrever" onde uma segunda chamada possa colar-se no meio.
        private val isAnyDrawerOpen = AtomicBoolean(false)

        private const val OPEN_DURATION = 280L
        private const val CLOSE_DURATION = 220L
        private const val SCRIM_ALPHA = 0.4f

        /**
         * Tenta reclamar o direito de abrir um drawer. Devolve true apenas
         * para a PRIMEIRA chamada enquanto nenhum drawer estiver aberto;
         * qualquer chamada seguinte, antes de release(), devolve false.
         * Deve ser chamado pelo caller ANTES de agendar runOnUiThread.
         */
        fun tryClaim(): Boolean = isAnyDrawerOpen.compareAndSet(false, true)

        /**
         * Liberta o guard. Chamado sempre que o drawer fecha, por qualquer
         * via (dismiss, back físico, erro ao construir a UI, BadTokenException).
         */
        fun release() {
            isAnyDrawerOpen.set(false)
        }
    }

    // Lido sempre do disco, nunca do parâmetro isDark isolado — garante que
    // a opção realçada no accordion reflete a escolha real gravada, mesmo
    // que o drawer tenha sido reaberto depois de o tema mudar por fora
    // (ex.: mudou no sistema com "system" selecionado).
    private var currentTheme: String = ThemePreference.get(context)

    private var dialog: Dialog? = null
    private var panelView: View? = null
    private var scrimView: View? = null
    private var hasReleased = false
    private var isClosing = false

    private var panelWidthPx = 0f
    private var downX = 0f
    private var downTranslationX = 0f
    private var isDragging = false
    private var lastMoveX = 0f
    private var lastMoveTime = 0L
    private var velocityPxPerMs = 0f

    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
    private val easeOut = android.view.animation.PathInterpolator(0.22f, 0.61f, 0.36f, 1f)
    private val easeIn = android.view.animation.PathInterpolator(0.5f, 0f, 0.75f, 0.35f)

    /**
     * NOTA: esta função já NÃO faz nenhuma verificação/marcação de guard —
     * isso é responsabilidade exclusiva do caller via tryClaim() antes de
     * sequer construir este objeto. show() assume que, se foi chamado, o
     * direito já foi reclamado, e a sua única responsabilidade é libertar
     * esse direito (release()) em todos os caminhos de saída possíveis.
     */
    fun show() {
        val activity = context as? android.app.Activity
        if (activity == null || activity.isFinishing || activity.isDestroyed) {
            releaseGuard()
            return
        }

        val dlg = Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar)
        val root = FrameLayout(activity)
        dlg.setContentView(root)

        dlg.window?.apply {
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setGravity(Gravity.END)
            setBackgroundDrawableResource(android.R.color.transparent)
            addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
            clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            attributes = attributes?.apply {
                dimAmount = 0f
            }
            WindowCompat.setDecorFitsSystemWindows(this, false)
            statusBarColor = android.graphics.Color.TRANSPARENT
            navigationBarColor = android.graphics.Color.TRANSPARENT
            WindowCompat.getInsetsController(this, decorView).isAppearanceLightStatusBars = !isDark
        }

        // Liberta o guard também se o utilizador fechar o Dialog por fora
        // (botão físico de voltar do sistema aciona onDismiss aqui).
        dlg.setOnDismissListener {
            releaseGuard()
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
            bindHeader(panel, dlg)
            bindThemeAccordion(panel)
            bindStaticItems(panel)
            bindLogout(panel, dlg)
            bindDragToClose(panel)
        } catch (e: Exception) {
            Toast.makeText(activity, "Erro ao abrir o menu", Toast.LENGTH_SHORT).show()
            releaseGuard()
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
            // Diálogo não pôde ser mostrado (activity finalizando); nada a reverter.
            releaseGuard()
        }
    }

    private fun releaseGuard() {
        if (!hasReleased) {
            hasReleased = true
            release()
        }
    }

    /**
     * Entrada suave e nativa: slide + leve escala + fade, com curva de
     * desaceleração (ease-out). O painel nasce ligeiramente mais estreito
     * e menos opaco, chegando ao estado final com uma sensação de "settle"
     * em vez de um corte seco a 0/1.
     */
    private fun animateOpen() {
        val panel = panelView ?: return
        val scrim = scrimView ?: return

        panel.translationX = panelWidthPx
        panel.alpha = 0.85f
        panel.scaleX = 0.96f
        panel.pivotX = panelWidthPx

        panel.animate()
            .translationX(0f)
            .alpha(1f)
            .scaleX(1f)
            .setDuration(OPEN_DURATION)
            .setInterpolator(easeOut)
            .start()

        scrim.alpha = 0f
        scrim.animate()
            .alpha(SCRIM_ALPHA)
            .setDuration(OPEN_DURATION)
            .setInterpolator(android.view.animation.LinearInterpolator())
            .start()
    }

    /**
     * Saída simétrica ao gesto de entrada: sai com ease-in (acelera para
     * fora), leve escala para dentro e fade — nunca um "salto" abrupto.
     */
    private fun animateClose() {
        // Evita reentrância: se já estiver a fechar (ex: scrim tocado
        // duas vezes seguidas), não reinicia a animação de saída.
        if (isClosing) return
        isClosing = true

        val panel = panelView ?: run { dialog?.dismiss(); return }
        val scrim = scrimView ?: run { dialog?.dismiss(); return }

        panel.pivotX = panelWidthPx
        panel.animate()
            .translationX(panelWidthPx)
            .alpha(0.85f)
            .scaleX(0.96f)
            .setDuration(CLOSE_DURATION)
            .setInterpolator(easeIn)
            .withEndAction { dialog?.dismiss() }
            .start()

        scrim.animate()
            .alpha(0f)
            .setDuration(CLOSE_DURATION)
            .setInterpolator(android.view.animation.LinearInterpolator())
            .start()
    }

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
                        scrimView?.alpha = SCRIM_ALPHA * (1f - progress)
                        view.alpha = 1f - (progress * 0.15f)
                        view.scaleX = 1f - (progress * 0.04f)

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
                                .alpha(1f)
                                .scaleX(1f)
                                .setDuration(200)
                                .setInterpolator(easeOut)
                                .start()
                            scrimView?.animate()?.alpha(SCRIM_ALPHA)?.setDuration(200)?.start()
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

    private fun bindHeader(view: View, dlg: Dialog) {
        val headerBlock = view.findViewById<LinearLayout>(R.id.drawerHeaderBlock)
        val nameView = view.findViewById<TextView>(R.id.drawerUserName)
        val initialView = view.findViewById<TextView>(R.id.drawerAvatarInitial)
        val name = SessionManager.getName(context) ?: "Utilizador"
        nameView.text = name
        initialView.text = name.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "U"

        // Mesmo comportamento do web: tocar no avatar/nome fecha o drawer
        // e navega para o perfil (goProfile() em AppDrawer.svelte).
        headerBlock.setOnClickListener {
            dlg.dismiss()
            try {
                onOpenProfile()
            } catch (e: Exception) {
                // Nunca deixar a navegação para perfil crashar o drawer.
            }
        }
    }

    private fun bindThemeAccordion(view: View) {
        val itemTheme = view.findViewById<LinearLayout>(R.id.itemTheme)
        val chevron = view.findViewById<ImageView>(R.id.themeChevron)
        val themeContainer = view.findViewById<LinearLayout>(R.id.themeOptionsContainer)
        val optionDark = view.findViewById<TextView>(R.id.themeOptionDark)
        val optionLight = view.findViewById<TextView>(R.id.themeOptionLight)
        val optionSystem = view.findViewById<TextView>(R.id.themeOptionSystem)

        fun selectTheme(theme: String) {
            if (currentTheme == theme) return
            currentTheme = theme
            highlightSelected(optionDark, optionLight, optionSystem, theme)
            try {
                // onThemeSelected é o único ponto de verdade: grava a
                // preferência E repinta a status bar/loader nativos no
                // HomeActivity, na MESMA chamada — sem recriar a Activity
                // nem o WebView, apenas repintando o que já existe.
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