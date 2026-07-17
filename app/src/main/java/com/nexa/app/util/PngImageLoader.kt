// app/src/main/java/com/nexa/app/util/PngImageLoader.kt
package com.nexa.app.util

import android.content.Context
import android.graphics.BitmapFactory
import android.widget.ImageView

/**
 * Carrega PNGs reais a partir de assets/icons/png/ (paralelo ao
 * SvgImageLoader, que só trata de assets/*.svg). Sem cache, mesma
 * filosofia do SvgImageLoader.
 */
object PngImageLoader {

    /**
     * @param assetPath caminho relativo dentro de assets/, ex: "icons/png/google.png"
     */
    fun load(context: Context, imageView: ImageView, assetPath: String) {
        try {
            val bitmap = context.assets.open(assetPath).use { input ->
                BitmapFactory.decodeStream(input)
            }
            imageView.setImageBitmap(bitmap)
        } catch (e: Exception) {
            imageView.setImageDrawable(null)
        }
    }
}