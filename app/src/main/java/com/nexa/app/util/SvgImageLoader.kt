package com.nexa.app.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.widget.ImageView
import com.caverock.androidsvg.SVG

/**
 * Carrega SVGs reais (não drawable/xml) a partir de assets/svg/
 * usando androidsvg. Não faz cache — cada chamada renderiza de novo,
 * conforme decisão de manter a lib leve e sem camada de cache própria.
 */
object SvgImageLoader {

    /**
     * @param assetPath caminho relativo dentro de assets/, ex: "svg/google.svg"
     * @param tintColor opcional — quando fornecido, aplica tint sólido (ex: ícones monocromáticos
     *        como a mão do logo). Ícones com cor própria (Google, Facebook, Microsoft, Apple)
     *        devem ser chamados sem tint.
     */
    fun load(
        context: Context,
        imageView: ImageView,
        assetPath: String,
        widthPx: Int,
        heightPx: Int,
        tintColor: Int? = null
    ) {
        try {
            val svg = context.assets.open(assetPath).use { input ->
                SVG.getFromInputStream(input)
            }

            svg.setDocumentWidth(widthPx.toFloat())
            svg.setDocumentHeight(heightPx.toFloat())

            val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            svg.renderToCanvas(canvas)

            imageView.setImageBitmap(bitmap)

            imageView.colorFilter = if (tintColor != null) {
                PorterDuffColorFilter(tintColor, PorterDuff.Mode.SRC_IN)
            } else {
                null
            }
        } catch (e: Exception) {
            imageView.setImageDrawable(null)
        }
    }

    /** Versão que aceita dp em vez de px, convertendo com a densidade do context. */
    fun loadDp(
        context: Context,
        imageView: ImageView,
        assetPath: String,
        widthDp: Int,
        heightDp: Int,
        tintColor: Int? = null
    ) {
        val density = context.resources.displayMetrics.density
        load(
            context,
            imageView,
            assetPath,
            (widthDp * density).toInt(),
            (heightDp * density).toInt(),
            tintColor
        )
    }
}