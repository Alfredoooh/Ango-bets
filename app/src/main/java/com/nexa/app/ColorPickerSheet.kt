package com.nexa.app.widget

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.nexa.app.R

/**
 * Constrói o conteúdo (View) apresentado dentro do BottomSheetHelper para
 * seleção de cor no toolbar do editor. Grelha simples de swatches em
 * GridLayout puro, sem Material.
 */
object ColorPickerSheet {

    private val PALETTE = listOf(
        "#10151C", "#6E6E6E", "#F03D3D", "#F0A63D",
        "#F0DC3D", "#3DBF4E", "#3DA9F0", "#0067C0",
        "#7B4CF0", "#F03D9E", "#8A5A32", "#FFFFFF"
    )

    fun build(context: Context, onColorSelected: (Int) -> Unit): FrameLayout {
        val density = context.resources.displayMetrics.density

        val root = FrameLayout(context).apply {
            setPadding((20 * density).toInt(), (4 * density).toInt(), (20 * density).toInt(), (24 * density).toInt())
        }

        val container = android.widget.LinearLayout(context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
        }

        val title = TextView(context).apply {
            text = "Cor"
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 16f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setPadding(0, 0, 0, (16 * density).toInt())
        }
        container.addView(title)

        val grid = GridLayout(context).apply {
            columnCount = 6
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        val swatchSize = (44 * density).toInt()
        val swatchMargin = (6 * density).toInt()

        for (hex in PALETTE) {
            val swatch = FrameLayout(context)
            val params = GridLayout.LayoutParams().apply {
                width = swatchSize
                height = swatchSize
                setMargins(swatchMargin, swatchMargin, swatchMargin, swatchMargin)
            }
            swatch.layoutParams = params

            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor(hex))
                setStroke((1.5f * density).toInt(), ContextCompat.getColor(context, R.color.divider))
            }
            swatch.background = bg
            swatch.isClickable = true
            swatch.isFocusable = true

            swatch.setOnClickListener {
                onColorSelected(Color.parseColor(hex))
            }

            grid.addView(swatch)
        }

        container.addView(grid)
        root.addView(container, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.TOP
        ))

        return root
    }
}