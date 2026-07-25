// app/src/main/java/com/nexa/app/webview/BrowserPermissionDialog.kt
package com.nexa.app.webview

import android.app.Activity
import android.app.Dialog
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.ViewGroup
import android.view.Window
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.widget.ImageViewCompat
import com.nexa.app.R
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeColors

/**
 * Modal de permissão "estilo navegador completo" (réplica do padrão
 * Chrome/Edge: "craftlab quer... [ícone] Usar a câmara/microfone.
 * Bloquear / Permitir"), construído 100% em código (sem XML), seguindo
 * os tokens Fluent 2 definidos em fluent_colors.xml.
 *
 * Usado apenas para Câmara e Microfone — os únicos recursos de
 * dispositivo que o WebView deste app pede hoje.
 */
object BrowserPermissionDialog {

    enum class DeviceKind { CAMERA, MICROPHONE, BOTH }

    fun show(
        activity: Activity,
        kind: DeviceKind,
        siteLabel: String = "craftlab",
        onResult: (allow: Boolean) -> Unit
    ) {
        val isDark = ThemePreference.resolveIsDark(activity)
        val palette = ThemeColors.get(isDark)

        val dialog = Dialog(activity)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(true)
        dialog.setOnCancelListener { onResult(false) }

        val density = activity.resources.displayMetrics.density
        fun dp(v: Int) = (v * density).toInt()

        val container = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(20), dp(20), dp(12))
            background = GradientDrawable().apply {
                cornerRadius = dp(8).toFloat()
                setColor(if (isDark) Color.parseColor("#2C2C2C") else Color.parseColor("#FFFFFF"))
            }
        }

        val headerRow = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val icon = ImageView(activity).apply {
            val iconRes = when (kind) {
                DeviceKind.CAMERA -> R.drawable.ic_fluent_camera_24_regular
                DeviceKind.MICROPHONE -> R.drawable.ic_fluent_mic_24_regular
                DeviceKind.BOTH -> R.drawable.ic_fluent_camera_24_regular
            }
            setImageDrawable(ContextCompat.getDrawable(activity, iconRes))
            ImageViewCompat.setImageTintList(
                this,
                ColorStateList.valueOf(Color.parseColor("#0067C0"))
            )
            layoutParams = LinearLayout.LayoutParams(dp(24), dp(24))
        }

        val title = TextView(activity).apply {
            text = "$siteLabel quer"
            setTextColor(palette.textPrimary)
            textSize = 16f
            setPadding(dp(10), 0, 0, 0)
        }

        headerRow.addView(icon)
        headerRow.addView(title)

        val message = TextView(activity).apply {
            text = when (kind) {
                DeviceKind.CAMERA -> "Usar a sua câmara"
                DeviceKind.MICROPHONE -> "Usar o seu microfone"
                DeviceKind.BOTH -> "Usar a sua câmara e microfone"
            }
            setTextColor(palette.textSecondary)
            textSize = 14f
            setPadding(dp(34), dp(6), 0, dp(18))
        }

        val buttonRow = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.END
        }

        val blockButton = Button(activity).apply {
            text = "Bloquear"
            isAllCaps = false
            setTextColor(palette.textSecondary)
            background = null
            setPadding(dp(16), dp(8), dp(16), dp(8))
            setOnClickListener {
                onResult(false)
                dialog.dismiss()
            }
        }

        val allowButton = Button(activity).apply {
            text = "Permitir"
            isAllCaps = false
            setTextColor(Color.parseColor("#0067C0"))
            background = null
            setPadding(dp(16), dp(8), dp(16), dp(8))
            setOnClickListener {
                onResult(true)
                dialog.dismiss()
            }
        }

        buttonRow.addView(blockButton)
        buttonRow.addView(allowButton)

        container.addView(headerRow)
        container.addView(message)
        container.addView(buttonRow)

        dialog.setContentView(
            container,
            ViewGroup.LayoutParams(
                (activity.resources.displayMetrics.widthPixels * 0.86).toInt(),
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        )
        dialog.window?.setBackgroundDrawable(android.graphics.drawable.ColorDrawable(Color.TRANSPARENT))
        dialog.window?.setGravity(Gravity.CENTER)
        dialog.show()
    }
}