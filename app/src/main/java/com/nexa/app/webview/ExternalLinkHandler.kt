package com.nexa.app.webview

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.nexa.app.nav.RouteMap

/**
 * Decide se um URL deve continuar dentro do WebView (mesmo host da WebApp)
 * ou ser aberto externamente (browser, apps de terceiros).
 */
object ExternalLinkHandler {

    fun isExternal(url: String): Boolean {
        return try {
            val uri = Uri.parse(url)
            uri.host != null && uri.host != RouteMap.HOST
        } catch (e: Exception) {
            false
        }
    }

    fun open(context: Context, url: String): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            context.startActivity(intent)
            true
        } catch (e: ActivityNotFoundException) {
            false
        }
    }
}