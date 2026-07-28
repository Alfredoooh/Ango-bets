// app/src/main/java/com/nexa/app/util/FluentColors.kt
package com.nexa.app.util

import android.graphics.Color

/**
 * Cor de acento oficial do Fluent Design 2 da Microsoft — os mesmos
 * tons já usados nos date/time pickers nativos (ver
 * styles_fluent_pickers.xml: colorAccent #0067C0 light / #4CC2FF
 * dark), agora centralizados aqui para serem partilhados também pelas
 * telas de autenticação (Login, Register, EmailLogin, EmailRegister).
 * Isto é o azul "botão do Microsoft Account/MeTab" — o botão de ação
 * primária sólido, com texto branco.
 */
object FluentColors {
    val accentLight: Int = Color.parseColor("#0067C0")
    val accentDark: Int = Color.parseColor("#4CC2FF")

    /** Texto sobre o botão de acento: branco no claro (contraste com azul
     * escuro), quase-preto no escuro (contraste com o ciano claro). */
    val onAccentLight: Int = Color.parseColor("#FFFFFF")
    val onAccentDark: Int = Color.parseColor("#00171F")

    fun accent(isDark: Boolean): Int = if (isDark) accentDark else accentLight
    fun onAccent(isDark: Boolean): Int = if (isDark) onAccentDark else onAccentLight
}