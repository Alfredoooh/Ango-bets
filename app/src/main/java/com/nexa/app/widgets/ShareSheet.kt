// app/src/main/java/com/nexa/app/widgets/ShareSheet.kt
package com.nexa.app.widgets

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.FileProvider
import com.nexa.app.session.ThemePreference
import java.io.File

/**
 * Modal-sheet de partilha 100% custom (não é o Android Share Sheet
 * padrão). Mostra opções fixas (WhatsApp, Email, "Mais opções" que abre
 * o chooser do sistema como fallback) desenhadas com o visual da app.
 */
object ShareSheet {

    fun show(context: Context, file: File, format: String) {
        val isDark = ThemePreference.resolveIsDark(context)
        val bgColor = if (isDark) Color.parseColor("#1F1F23") else Color.WHITE
        val textColor = if (isDark) Color.parseColor("#F2F2F2") else Color.parseColor("#10151C")
        val secondaryColor = if (isDark) Color.parseColor("#9A9A9E") else Color.parseColor("#888888")

        val mimeType = if (format == "pdf") "application/pdf"
            else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)

        val dialog = android.app.Dialog(context, android.R.style.Theme_Translucent_NoTitleBar)

        val sheet = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(context, 20), dp(context, 20), dp(context, 20), dp(context, 24))
            background = GradientDrawable().apply {
                setColor(bgColor)
                cornerRadii = floatArrayOf(
                    dp(context, 22).toFloat(), dp(context, 22).toFloat(),
                    dp(context, 22).toFloat(), dp(context, 22).toFloat(),
                    0f, 0f, 0f, 0f
                )
            }
        }

        sheet.addView(TextView(context).apply {
            text = "Partilhar \"${file.name}\""
            setTextColor(textColor)
            textSize = 16f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setPadding(0, 0, 0, dp(context, 16))
        })

        fun option(label: String, onClick: () -> Unit) {
            val row = TextView(context).apply {
                text = label
                setTextColor(textColor)
                textSize = 15f
                setPadding(dp(context, 4), dp(context, 14), dp(context, 4), dp(context, 14))
                setOnClickListener {
                    dialog.dismiss()
                    onClick()
                }
            }
            sheet.addView(row)
        }

        option("Partilhar via…") {
            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(Intent.createChooser(sendIntent, "Partilhar documento"))
        }

        option("Copiar caminho do ficheiro") {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("path", file.absolutePath))
        }

        val cancel = TextView(context).apply {
            text = "Cancelar"
            setTextColor(secondaryColor)
            textSize = 15f
            gravity = Gravity.CENTER
            setPadding(0, dp(context, 12), 0, 0)
            setOnClickListener { dialog.dismiss() }
        }
        sheet.addView(cancel)

        val wrapper = FrameLayout(context).apply {
            addView(sheet, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.BOTTOM
            })
        }

        dialog.setContentView(wrapper)
        dialog.window?.apply {
            setBackgroundDrawable(android.graphics.drawable.ColorDrawable(Color.TRANSPARENT))
            setDimAmount(0.5f)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setGravity(Gravity.BOTTOM)
        }
        dialog.show()
    }

    private fun dp(context: Context, value: Int): Int {
        return (value * context.resources.displayMetrics.density).toInt()
    }
}