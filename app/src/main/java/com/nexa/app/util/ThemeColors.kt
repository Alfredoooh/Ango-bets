// app/src/main/java/com/nexa/app/util/ThemeColors.kt
package com.nexa.app.util

import android.graphics.Color

/**
 * Paleta nativa única. Ao contrário de colors.xml (recurso estático,
 * resolvido uma vez por configuração do sistema via values/values-night),
 * esta paleta é escolhida em runtime a partir de ThemePreference.resolveIsDark(),
 * que reflete o tema do PWA — não o do sistema operativo diretamente.
 */
data class ThemePalette(
    val bgPrimary: Int,
    val cardBg: Int,
    val textPrimary: Int,
    val textSecondary: Int,
    val divider: Int
)

object ThemeColors {

    private val dark = ThemePalette(
        bgPrimary = Color.parseColor("#0E0E0E"),
        cardBg = Color.parseColor("#242424"),
        textPrimary = Color.parseColor("#F2F2F2"),
        textSecondary = Color.parseColor("#8A8A8A"),
        divider = Color.parseColor("#3A3A3A")
    )

    private val light = ThemePalette(
        bgPrimary = Color.parseColor("#FFFFFF"),
        cardBg = Color.parseColor("#F0F0F0"),
        textPrimary = Color.parseColor("#10151C"),
        textSecondary = Color.parseColor("#6E6E6E"),
        divider = Color.parseColor("#DDDDDD")
    )

    fun get(isDark: Boolean): ThemePalette = if (isDark) dark else light
}