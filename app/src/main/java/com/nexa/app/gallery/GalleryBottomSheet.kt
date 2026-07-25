// app/src/main/java/com/nexa/app/gallery/GalleryBottomSheet.kt
package com.nexa.app.gallery

import android.app.Dialog
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.launch
import com.nexa.app.session.ThemePreference
import com.nexa.app.util.ThemeColors

/**
 * Galeria Fluent própria: um Dialog em estilo BottomSheet sobre a
 * HomeActivity, com grid de 3 colunas das imagens do dispositivo
 * (via MediaStoreLoader). Se a consulta ao MediaStore não devolver
 * nada (permissão negada, erro, dispositivo sem imagens indexadas),
 * cai automaticamente para onFallbackToSystemPicker — que a
 * HomeActivity liga ao Photo Picker (ActivityResultContracts.PickVisualMedia).
 *
 * Construído inteiramente em código, seguindo os tokens Fluent 2:
 * folha com cantos superiores 8dp, "grabber" central, botões de texto
 * com accent azul.
 */
object GalleryBottomSheet {

    fun show(
        activity: AppCompatActivity,
        multiSelect: Boolean,
        onFallbackToSystemPicker: () -> Unit,
        onPicked: (List<Uri>) -> Unit,
        onCancelled: () -> Unit
    ) {
        val isDark = ThemePreference.resolveIsDark(activity)
        val palette = ThemeColors.get(isDark)
        val density = activity.resources.displayMetrics.density
        fun dp(v: Int) = (v * density).toInt()

        if (!MediaStoreLoader.hasReadImagesPermission(activity)) {
            onFallbackToSystemPicker()
            return
        }

        val dialog = Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(true)
        dialog.setOnCancelListener { onCancelled() }

        val root = FrameLayout(activity).apply {
            setBackgroundColor(Color.parseColor("#66000000"))
        }

        val sheet = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable().apply {
                setColor(if (isDark) Color.parseColor("#1F1F1F") else Color.parseColor("#FFFFFF"))
                cornerRadii = floatArrayOf(
                    dp(8).toFloat(), dp(8).toFloat(),
                    dp(8).toFloat(), dp(8).toFloat(),
                    0f, 0f, 0f, 0f
                )
            }
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                (activity.resources.displayMetrics.heightPixels * 0.72).toInt()
            ).apply { gravity = Gravity.BOTTOM }
            setPadding(dp(12), dp(10), dp(12), dp(12))
        }

        val grabber = View(activity).apply {
            background = GradientDrawable().apply {
                setColor(palette.divider)
                cornerRadius = dp(2).toFloat()
            }
            layoutParams = LinearLayout.LayoutParams(dp(36), dp(4)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                bottomMargin = dp(10)
            }
        }

        val headerRow = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val title = TextView(activity).apply {
            text = "Escolher imagem"
            setTextColor(palette.textPrimary)
            textSize = 16f
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }

        val systemPickerButton = Button(activity).apply {
            text = "Mais fotos"
            isAllCaps = false
            setTextColor(Color.parseColor("#0067C0"))
            background = null
            setOnClickListener {
                dialog.dismiss()
                onFallbackToSystemPicker()
            }
        }

        headerRow.addView(title)
        headerRow.addView(systemPickerButton)

        val progress = ProgressBar(activity).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { gravity = Gravity.CENTER; topMargin = dp(24) }
        }

        val recyclerView = RecyclerView(activity).apply {
            layoutManager = GridLayoutManager(activity, 3)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
            )
            visibility = View.GONE
        }

        val confirmButton = Button(activity).apply {
            text = "Selecionar"
            isAllCaps = false
            setBackgroundColor(Color.parseColor("#0067C0"))
            setTextColor(Color.WHITE)
            isEnabled = false
            alpha = 0.5f
            setOnClickListener {
                val adapter = recyclerView.adapter as? GalleryImageAdapter
                val uris = adapter?.selectedUris().orEmpty()
                if (uris.isNotEmpty()) {
                    dialog.dismiss()
                    onPicked(uris)
                }
            }
        }

        sheet.addView(grabber)
        sheet.addView(headerRow)
        sheet.addView(progress)
        sheet.addView(recyclerView)
        sheet.addView(confirmButton, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(8) })

        root.addView(sheet)
        dialog.setContentView(root)
        dialog.window?.setLayout(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        dialog.window?.setBackgroundDrawable(android.graphics.drawable.ColorDrawable(Color.TRANSPARENT))
        dialog.show()

        activity.lifecycleScope.launch {
            val images = MediaStoreLoader.loadImages(activity)
            progress.visibility = View.GONE

            if (images.isEmpty()) {
                dialog.dismiss()
                onFallbackToSystemPicker()
                return@launch
            }

            recyclerView.visibility = View.VISIBLE
            recyclerView.adapter = GalleryImageAdapter(images, isDark, multiSelect) { selectedCount ->
                confirmButton.isEnabled = selectedCount > 0
                confirmButton.alpha = if (selectedCount > 0) 1f else 0.5f
                confirmButton.text = if (selectedCount > 1) "Selecionar ($selectedCount)" else "Selecionar"
            }
        }
    }
}