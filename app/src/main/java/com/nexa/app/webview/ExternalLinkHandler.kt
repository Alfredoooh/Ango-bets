// app/src/main/java/com/nexa/app/webview/ExternalLinkHandler.kt
package com.nexa.app.webview

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent

/**
 * Abre links que saem do host da app (mobilewebin.onrender.com) dentro de
 * uma Chrome Custom Tab, exatamente como o ChatGPT faz: continua "dentro
 * da app" visualmente (barra de topo, botão de fechar, transição própria),
 * mas usa o motor e a sessão do browser do sistema, sem sair para uma app
 * de browser separada.
 */
object ExternalLinkHandler {

    fun open(context: Context, uri: Uri) {
        val colorScheme = CustomTabColorSchemeParams.Builder()
            .setToolbarColor(android.graphics.Color.parseColor("#17171A"))
            .build()

        val customTabsIntent = CustomTabsIntent.Builder()
            .setDefaultColorSchemeParams(colorScheme)
            .setShowTitle(true)
            .setUrlBarHidingEnabled(true)
            .build()

        try {
            customTabsIntent.launchUrl(context, uri)
        } catch (e: Exception) {
            // Sem nenhum browser compatível com Custom Tabs instalado:
            // recorre ao Intent.ACTION_VIEW normal do sistema.
            try {
                val fallback = android.content.Intent(android.content.Intent.ACTION_VIEW, uri)
                context.startActivity(fallback)
            } catch (ignored: Exception) {
                // Sem nenhum handler disponível para este URI; ignora.
            }
        }
    }
}