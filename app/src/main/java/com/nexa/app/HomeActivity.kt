package com.nexa.app

import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.nexa.app.util.SvgImageLoader

class HomeActivity : AppCompatActivity() {

    private lateinit var drawerLayout: DrawerLayout
    private lateinit var mainContent: FrameLayout
    private lateinit var drawerPanel: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupStatusBar()
        setContentView(R.layout.activity_home)

        val textColor = ContextCompat.getColor(this, R.color.text_primary)

        drawerLayout = findViewById(R.id.drawerLayout)
        mainContent = findViewById(R.id.mainContent)
        drawerPanel = findViewById(R.id.drawerPanel)

        drawerLayout.drawerElevation = 0f
        drawerLayout.setScrimColor(0x00000000)

        val menuBtn = findViewById<ImageView>(R.id.menuBtn)
        SvgImageLoader.loadDp(this, menuBtn, "menu.svg", widthDp = 24, heightDp = 24, tintColor = textColor)

        val userPillIcon = findViewById<ImageView>(R.id.userPillIcon)
        SvgImageLoader.loadDp(this, userPillIcon, "user.svg", widthDp = 24, heightDp = 24, tintColor = textColor)

        menuBtn.setOnClickListener {
            drawerLayout.openDrawer(GravityCompatStart())
        }

        findViewById<LinearLayout>(R.id.userPill).setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        setupPushEffect()
    }

    /** Retorna Gravity.START respeitando RTL/LTR. */
    private fun GravityCompatStart(): Int = Gravity.START

    /**
     * Efeito de "push": em vez do modo overlay padrão do DrawerLayout
     * (drawer flutua por cima do conteúdo), este listener translada o
     * mainContent horizontalmente conforme o drawer desliza, dando a
     * sensação de o drawer empurrar a tela para o lado.
     */
    private fun setupPushEffect() {
        drawerLayout.addDrawerListener(object : DrawerLayout.DrawerListener {
            override fun onDrawerSlide(drawerView: View, slideOffset: Float) {
                val pushDistance = drawerView.width * 0.28f
                mainContent.translationX = slideOffset * pushDistance
            }

            override fun onDrawerOpened(drawerView: View) {}

            override fun onDrawerClosed(drawerView: View) {}

            override fun onDrawerStateChanged(newState: Int) {}
        })
    }

    private fun setupStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = resources.getBoolean(R.bool.isLightTheme)
            isAppearanceLightNavigationBars = resources.getBoolean(R.bool.isLightTheme)
        }
    }

    override fun onBackPressed() {
        if (drawerLayout.isDrawerOpen(Gravity.START)) {
            drawerLayout.closeDrawer(Gravity.START)
        } else {
            super.onBackPressed()
        }
    }
}