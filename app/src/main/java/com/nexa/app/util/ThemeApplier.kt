// app/src/main/java/com/nexa/app/util/ThemeApplier.kt
package com.nexa.app.util

import android.app.Activity
import android.graphics.drawable.GradientDrawable
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

    fun applyPrimaryText(textView: TextView, palette: ThemePalette) {
        textView.setTextColor(palette.textPrimary)
    }

    fun applySecondaryText(textView: TextView, palette: ThemePalette) {
        textView.setTextColor(palette.textSecondary)
    }

    fun applyDivider(view: View, palette: ThemePalette) {
        view.setBackgroundColor(palette.divider)
    }
}