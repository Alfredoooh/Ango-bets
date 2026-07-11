// app/src/main/java/com/nexa/app/widgets/BottomSnackbar.kt
package com.nexa.app.widgets

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.content.Context
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView

/**
 * Snackbar em barra inferior de largura total, estilo YouTube: ocupa a
 * faixa toda em baixo do ecrã (respeitando a safe area de gestos), entra a
 * deslizar de baixo para cima e sai da mesma forma. Usado para:
 * - erro de login/registo
 * - "Sem ligação à internet"
 * - "Ligação restabelecida"
 *
 * Diferente de um Toast/Snackbar M3: não tem cantos arredondados nem
 * margens laterais, fica colada às 3 bordas (esquerda, direita, baixo),
 * exatamente como a barra de estado de rede do YouTube.
 */
class BottomSnackbar private constructor(private val container: FrameLayout) {

    enum class Style { ERROR, SUCCESS, INFO }

    private var currentBar: View? = null
    private val handler = Handler(Looper.getMainLooper())
    private var dismissRunnable: Runnable? = null

    fun show(message: String, style: Style, durationMs: Long = 3200L, persistent: Boolean = false) {
        dismissRunnable?.let { handler.removeCallbacks(it) }
        currentBar?.let { container.removeView(it) }

        val bgColor = when (style) {
            Style.ERROR -> Color.parseColor("#D93025")
            Style.SUCCESS -> Color.parseColor("#1B873F")
            Style.INFO -> Color.parseColor("#3C4043")
        }

        val density = container.resources.displayMetrics.density
        val bottomInset = getSystemBottomInset()

        val bar = FrameLayout(container.context).apply {
            setBackgroundColor(bgColor)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            )
            setPadding(
                (20 * density).toInt(),
                (14 * density).toInt(),
                (20 * density).toInt(),
                (14 * density).toInt() + bottomInset
            )
            translationY = 200f * density
            alpha = 0f
        }

        val label = TextView(container.context).apply {
            text = message
            setTextColor(Color.WHITE)
            textSize = 14f
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            )
        }
        bar.addView(label)

        container.addView(bar)
        currentBar = bar

        bar.animate()
            .translationY(0f)
            .alpha(1f)
            .setDuration(220L)
            .setInterpolator(android.view.animation.DecelerateInterpolator())
            .start()

        if (!persistent) {
            val runnable = Runnable { dismiss() }
            dismissRunnable = runnable
            handler.postDelayed(runnable, durationMs)
        }
    }

    fun dismiss() {
        dismissRunnable?.let { handler.removeCallbacks(it) }
        dismissRunnable = null
        val bar = currentBar ?: return
        val density = container.resources.displayMetrics.density
        bar.animate()
            .translationY(200f * density)
            .alpha(0f)
            .setDuration(180L)
            .setInterpolator(android.view.animation.AccelerateInterpolator())
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    container.removeView(bar)
                    if (currentBar === bar) currentBar = null
                }
            })
            .start()
    }

    private fun getSystemBottomInset(): Int {
        val insets = androidx.core.view.ViewCompat.getRootWindowInsets(container)
            ?.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars())
        return insets?.bottom ?: 0
    }

    companion object {
        /**
         * Cria (ou reaproveita, se já existir) a camada de snackbar dentro
         * do root passado. O root tem de ser um FrameLayout (ou subclasse)
         * para permitir sobrepor a barra por cima do resto do conteúdo.
         */
        fun attach(root: FrameLayout): BottomSnackbar {
            return BottomSnackbar(root)
        }
    }
}