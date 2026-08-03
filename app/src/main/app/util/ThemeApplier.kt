// app/src/main/java/com/nexa/app/util/ThemeApplier.kt
package com.nexa.app.util

import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.view.View
import android.widget.TextView

/**
 * Aplica a ThemePalette a uma Activity inteira, pintando o fundo raiz,
 * textos e o drawable dos "cartões" (botões sociais, inputs) em runtime.
 * Substitui a dependência de @color/ estático, que nunca reagia ao tema
 * do PWA.
 */
object ThemeApplier {

    fun applyBackground(rootView: View, palette: ThemePalette) {
        rootView.setBackgroundColor(palette.bgPrimary)
    }

    fun applyCardBackground(view: View, palette: ThemePalette, cornerRadiusDp: Float, activity: Activity) {
        val density = activity.resources.displayMetrics.density
        view.background = GradientDrawable().apply {
            setColor(palette.cardBg)
            cornerRadius = cornerRadiusDp * density
        }
    }

    /**
     * Igual a applyCardBackground, mas envolve o fundo num RippleDrawable
     * para dar feedback visual ao toque. Usar apenas em elementos clicáveis
     * (botões), nunca em EditText.
     */
    fun applyClickableCardBackground(view: View, palette: ThemePalette, cornerRadiusDp: Float, activity: Activity) {
        val density = activity.resources.displayMetrics.density
        val baseDrawable = GradientDrawable().apply {
            setColor(palette.cardBg)
            cornerRadius = cornerRadiusDp * density
        }
        val maskDrawable = GradientDrawable().apply {
            setColor(Color.WHITE)
            cornerRadius = cornerRadiusDp * density
        }
        val rippleColor = Color.argb(60, 128, 128, 128)
        view.background = RippleDrawable(
            android.content.res.ColorStateList.valueOf(rippleColor),
            baseDrawable,
            maskDrawable
        )
    }

    /**
     * Botão de AÇÃO PRIMÁRIA no padrão Fluent 2 da Microsoft — o "botão
     * azul" (Entrar, Criar conta): preenchimento sólido com
     * FluentColors.accent(isDark), cantos a 8dp (não pill — Fluent 2
     * usa cantos discretos, ao contrário do padrão iOS/Material
     * arredondado ao máximo que estava a ser usado antes com 28dp).
     * O texto sobre este botão deve usar FluentColors.onAccent(isDark),
     * nunca palette.textPrimary — precisa de contraste com o azul, não
     * com o fundo da tela.
     */
    fun applyFluentPrimaryButton(view: View, isDark: Boolean, activity: Activity) {
        val density = activity.resources.displayMetrics.density
        val accent = FluentColors.accent(isDark)
        val cornerRadiusDp = 8f
        val baseDrawable = GradientDrawable().apply {
            setColor(accent)
            cornerRadius = cornerRadiusDp * density
        }
        val maskDrawable = GradientDrawable().apply {
            setColor(Color.WHITE)
            cornerRadius = cornerRadiusDp * density
        }
        // Ripple mais escuro sobre azul (não o ripple cinzento genérico
        // usado nos cartões neutros), para o feedback de toque continuar
        // visível sobre uma cor sólida de destaque.
        val rippleColor = Color.argb(70, 0, 0, 0)
        view.background = RippleDrawable(
            android.content.res.ColorStateList.valueOf(rippleColor),
            baseDrawable,
            maskDrawable
        )
    }

    /**
     * Botão de AÇÃO SECUNDÁRIA no padrão Fluent 2 — usado para "Continuar
     * com o Google" e "Continuar com o Email": contorno fino (1dp) na cor
     * de acento, fundo transparente/neutro, cantos a 8dp. É o botão
     * "subtle/outline" que a Microsoft usa ao lado de um botão primário
     * sólido, para não competir visualmente com ele.
     */
    fun applyFluentSecondaryButton(view: View, palette: ThemePalette, isDark: Boolean, activity: Activity) {
        val density = activity.resources.displayMetrics.density
        val accent = FluentColors.accent(isDark)
        val cornerRadiusDp = 8f
        val baseDrawable = GradientDrawable().apply {
            setColor(palette.cardBg)
            setStroke((1.25f * density).toInt(), accent)
            cornerRadius = cornerRadiusDp * density
        }
        val maskDrawable = GradientDrawable().apply {
            setColor(Color.WHITE)
            cornerRadius = cornerRadiusDp * density
        }
        val rippleColor = Color.argb(50, 0, 103, 192)
        view.background = RippleDrawable(
            android.content.res.ColorStateList.valueOf(rippleColor),
            baseDrawable,
            maskDrawable
        )
    }

    fun applyPrimaryText(textView: TextView, palette: ThemePalette) {
        textView.setTextColor(palette.textPrimary)
    }

    fun applySecondaryText(textView: TextView, palette: ThemePalette) {
        textView.setTextColor(palette.textSecondary)
    }

    /** Texto sobre um botão Fluent primário (fundo azul sólido) — precisa
     * de contraste com o azul, nunca com palette.textPrimary. */
    fun applyOnAccentText(textView: TextView, isDark: Boolean) {
        textView.setTextColor(FluentColors.onAccent(isDark))
    }

    /** Texto de um botão Fluent secundário/link — usa a própria cor de
     * acento, como a Microsoft faz em "Já tens conta? Entrar". */
    fun applyAccentText(textView: TextView, isDark: Boolean) {
        textView.setTextColor(FluentColors.accent(isDark))
    }

    fun applyDivider(view: View, palette: ThemePalette) {
        view.setBackgroundColor(palette.divider)
    }
}