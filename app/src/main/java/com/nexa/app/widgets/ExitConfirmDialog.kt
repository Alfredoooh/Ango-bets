// app/src/main/java/com/nexa/app/widgets/ExitConfirmDialog.kt
package com.nexa.app.widgets

import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat

/**
 * Popup nativo de confirmação para sair da app. Usado em qualquer
 * Activity nativa (ex.: LoginActivity) onde não há WebView/Svelte
 * carregado para delegar a confirmação de saída ao lado web.
 * Cores fixas alinhadas com colors.xml (tema único, dark).
 */
object ExitConfirmDialog {

    fun show(context: Context, onConfirm: () -> Unit) {
        val bgColor = Color.parseColor("#242424")
        val textColor = Color.parseColor("#F2F2F2")
        val secondaryColor = Color.parseColor("#8A8A8A")
        val primaryColor = Color.parseColor("#2F7BF6")

        val dialog = Dialog(context, android.R.style.Theme_Translucent_NoTitleBar)
        dialog.setCancelable(true)

        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(context, 24), dp(context, 24), dp(context, 24), dp(context, 16))
            background = GradientDrawable().apply {
                setColor(bgColor)
                cornerRadius = dp(context, 20).toFloat()
            }
        }

        val title = TextView(context).apply {
            text = "Sair da aplicação"
            textSize = 17f
            setTextColor(textColor)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        card.addView(title)

        val message = TextView(context).apply {
            text = "Tens a certeza que queres sair?"
            textSize = 14f
            setTextColor(secondaryColor)
            setPadding(0, dp(context, 8), 0, dp(context, 20))
        }
        card.addView(message)

        val buttonRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.END
        }

        val cancelButton = Button(context).apply {
            text = "Cancelar"
            isAllCaps = false
            setTextColor(secondaryColor)
            background = null
            setOnClickListener { dialog.dismiss() }
        }
        buttonRow.addView(cancelButton)

        val spacer = View(context).apply {
            layoutParams = LinearLayout.LayoutParams(dp(context, 8), 0)
        }
        buttonRow.addView(spacer)

        val confirmButton = Button(context).apply {
            text = "Sair"
            isAllCaps = false
            setTextColor(primaryColor)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            background = null
            setOnClickListener {
                dialog.dismiss()
                onConfirm()
            }
        }
        buttonRow.addView(confirmButton)

        card.addView(buttonRow)

        val wrapper = FrameLayout(context).apply {
            setPadding(dp(context, 32), 0, dp(context, 32), 0)
            addView(
                card,
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { gravity = Gravity.CENTER }
            )
        }

        dialog.setContentView(wrapper)
        dialog.window?.apply {
            setBackgroundDrawable(ContextCompat.getDrawable(context, android.R.color.transparent))
            setDimAmount(0.5f)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }

        dialog.show()
    }

    private fun dp(context: Context, value: Int): Int {
        return (value * context.resources.displayMetrics.density).toInt()
    }
}