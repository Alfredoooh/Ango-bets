package com.nexa.app.nav

import android.content.Context
import android.content.Intent
import com.nexa.app.HomeActivity

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

    fun routeSegment(path: String): String {
        val trimmed = path.trim('/')
        if (trimmed.isEmpty()) return "home"
        return trimmed.substringBefore('/')
    }

    fun pageUrl(route: String): String = "https://$HOST/${route}/"

    fun ensureHomeActivity(context: Context, route: String? = null) {
        val intent = Intent(context, HomeActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            route?.takeIf { it.isNotBlank() }?.let { putExtra(HomeActivity.EXTRA_INITIAL_ROUTE, it) }
        }
        context.startActivity(intent)
    }
}
