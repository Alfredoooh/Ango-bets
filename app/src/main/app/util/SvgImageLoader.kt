package com.nexa.app.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.widget.ImageView
import com.caverock.androidsvg.SVG

object SvgImageLoader {

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