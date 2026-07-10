package com.nexa.app

import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.nexa.app.nav.RouteMap
import com.nexa.app.session.SessionManager
import com.nexa.app.webview.setupNexaWebView

/**
 * Única Activity com drawer nativo (DrawerLayout + NavigationView, gestos e
 * animação 100% nativos do Android). Carrega a Home do site dentro do
 * WebView. As outras 17 páginas (chat, docs, sheets...) NÃO usam esta
 * Activity — usam WebPageActivity, que é WebView puro sem chrome nativo,
 * porque já têm o próprio drawer desenhado em Svelte.
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var drawerLayout: DrawerLayout
    private lateinit var navigationView: NavigationView
    private lateinit var webView: WebView
    private lateinit var progressBar: LinearProgressIndicator
    private lateinit var menuButton: View

    private val currentRoute = "home"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        drawerLayout = findViewById(R.id.drawerLayout)
        navigationView = findViewById(R.id.navigationView)
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        menuButton = findViewById(R.id.menuButton)

        setupDrawerHeader()
        setupWebView()
        setupDrawerNavigation()

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    drawerLayout.isDrawerOpen(GravityCompat.START) -> {
                        drawerLayout.closeDrawer(GravityCompat.START)
                    }
                    webView.canGoBack() -> {
                        webView.goBack()
                    }
                    else -> {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(RouteMap.pageUrl(currentRoute))
        }
    }

    private fun setupDrawerHeader() {
        val header = navigationView.getHeaderView(0)
        val nameView = header.findViewById<android.widget.TextView>(R.id.drawerUserName)
        val emailView = header.findViewById<android.widget.TextView>(R.id.drawerUserEmail)
        nameView.text = SessionManager.getName(this) ?: getString(R.string.app_name)
        emailView.text = SessionManager.getEmail(this).orEmpty()
    }

    private fun setupWebView() {
        webView.setupNexaWebView(
            context = this,
            currentRoute = currentRoute,
            progressBar = progressBar,
            onThemeChanged = { isDark -> applyNativeTheme(isDark) },
            onExternalRoute = { route, _ ->
                drawerLayout.closeDrawer(GravityCompat.START)
                RouteMap.openRoute(this, route)
            }
        )
    }

    private fun setupDrawerNavigation() {
        navigationView.setNavigationItemSelectedListener { item ->
            val route = when (item.itemId) {
                R.id.nav_home -> "home"
                R.id.nav_ai -> "ai"
                R.id.nav_chat -> "chat"
                R.id.nav_docs -> "docs"
                R.id.nav_sheets -> "sheets"
                R.id.nav_slides -> "slides"
                R.id.nav_drive -> "drive"
                R.id.nav_calendar -> "calendar"
                R.id.nav_tasks -> "tasks"
                R.id.nav_notes -> "notes"
                R.id.nav_forms -> "forms"
                R.id.nav_projects -> "projects"
                R.id.nav_wiki -> "wiki"
                R.id.nav_whiteboard -> "whiteboard"
                R.id.nav_analytics -> "analytics"
                R.id.nav_profile -> "profile"
                else -> null
            }

            drawerLayout.closeDrawer(GravityCompat.START)

            if (route != null && route != currentRoute) {
                RouteMap.openRoute(this, route)
            }
            true
        }

        navigationView.menu.findItem(R.id.nav_home)?.isChecked = true
    }

    /**
     * Chamado via ThemeBridge quando o Svelte (theme.js) muda o tema.
     * Recolore o drawer/status bar nativos em tempo real, sem reiniciar a Activity.
     */
    private fun applyNativeTheme(isDark: Boolean) {
        runOnUiThread {
            val bg = if (isDark) {
                androidx.core.content.ContextCompat.getColor(this, R.color.app_background)
            } else {
                androidx.core.content.ContextCompat.getColor(this, R.color.app_background)
            }
            drawerLayout.setBackgroundColor(bg)
            window.statusBarColor = bg
            val controller = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
            controller.isAppearanceLightStatusBars = !isDark
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}