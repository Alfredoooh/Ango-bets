package com.nexa.app.nav

import android.content.Context
import android.content.Intent
import com.nexa.app.HomeActivity
import com.nexa.app.WebPageActivity

/**
 * Mapa central de rotas do site (mobilewebin.onrender.com) para as Activities nativas.
 * Espelha exatamente os "apps" definidos em vite.config.js do projeto web.
 *
 * Qualquer navegação dentro de qualquer WebView (drawer nativo da Home OU
 * links/drawer Svelte dentro de uma sub-app) passa por aqui para decidir
 * que Activity nativa abrir.
 */
object RouteMap {

    const val HOST = "mobilewebin.onrender.com"

    // segmento de rota (primeiro pedaço do path) -> id usado no menu do drawer nativo
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
     * Abre a Activity nativa correspondente à rota, com transição de slide+fade nativa
     * (usa app/src/main/res/anim/slide_in_left.xml e slide_out_right.xml).
     * A Home usa a sua própria Activity com drawer; todas as outras usam WebPageActivity puro.
     */
    fun openRoute(context: Context, route: String) {
        val url = pageUrl(route)
        val intent = if (route == "home") {
            Intent(context, HomeActivity::class.java)
        } else {
            Intent(context, WebPageActivity::class.java).apply {
                putExtra(WebPageActivity.EXTRA_URL, url)
                putExtra(WebPageActivity.EXTRA_ROUTE, route)
            }
        }
        context.startActivity(intent)
        if (context is android.app.Activity) {
            context.overridePendingTransition(
                com.nexa.app.R.anim.slide_in_left,
                com.nexa.app.R.anim.slide_out_right
            )
        }
    }

    /**
     * Transição inversa a usar quando a Activity termina (botão voltar nativo),
     * para o slide sair pela direita e a anterior entrar pela esquerda, coerente
     * com a entrada em openRoute().
     */
    fun applyFinishTransition(activity: android.app.Activity) {
        activity.overridePendingTransition(
            com.nexa.app.R.anim.slide_in_right,
            com.nexa.app.R.anim.slide_out_left
        )
    }
}