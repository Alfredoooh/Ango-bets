package com.nexa.app.nav

import android.content.Context
import android.content.Intent
import com.nexa.app.HomeActivity

/**
 * Mapa central de rotas do site (mobilewebin.onrender.com). Espelha
 * exatamente os "apps" definidos em vite.config.js do projeto web.
 *
 * A navegação entre rotas já não abre Activities separadas — toda a app
 * vive dentro de HomeActivity, que troca qual WebView (mantido em
 * WebViewPool) está visível. openRoute() só é preciso para garantir que
 * HomeActivity está no topo (ex.: a app foi aberta a partir de uma
 * notificação ou deep link); a troca de rota em si é feita chamando
 * HomeActivity diretamente nesses casos.
 */
object RouteMap {

    const val HOST = "mobilewebin.onrender.com"

    val routeToMenuId: Map<String, String> = mapOf(
        "home" to "home",
        "ai" to "ai",
        "chat" to "chat",
        "docs" to "docs",
        "sheets" to "sheets",
        "slides" to "slides",
        "drive" to "drive",
        "calendar" to "calendar",
        "tasks" to "tasks",
        "notes" to "notes",
        "forms" to "forms",
        "projects" to "projects",
        "wiki" to "wiki",
        "whiteboard" to "whiteboard",
        "analytics" to "analytics",
        "profile" to "profile",
        "profilelens" to "profilelens",
        "auth" to "auth",
    )

    /**
     * Extrai o segmento de rota (ex.: "chat") de um path completo (ex.: "/chat/settings").
     */
    fun routeSegment(path: String): String {
        val trimmed = path.trim('/')
        if (trimmed.isEmpty()) return "home"
        return trimmed.substringBefore('/')
    }

    fun pageUrl(route: String): String = "https://$HOST/${route}/"

    /**
     * Garante que HomeActivity está aberta e no topo da stack. Usar apenas
     * quando se navega a partir de fora do WebView (ex.: notificação);
     * dentro da app, a troca de rota é feita diretamente por HomeActivity.
     */
    fun ensureHomeActivity(context: Context) {
        val intent = Intent(context, HomeActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        context.startActivity(intent)
    }
}