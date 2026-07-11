// app/src/main/java/com/nexa/app/widgets/GradientRingLoader.kt
package com.nexa.app.widgets

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.SweepGradient
import android.util.AttributeSet
import android.view.View
import android.view.animation.LinearInterpolator

/**
 * Anel gradiente giratório — réplica 1:1 do protótipo HTML: um anel fino
 * com gradiente cónico (SweepGradient) que roda continuamente, usado como
 * indicador de progresso nativo em LoginActivity e RegisterActivity.
 */
class GradientRingLoader @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    var ringColor: Int = Color.parseColor("#4A4A4A")
        set(value) {
            field = value
            invalidate()
        }

    private var strokeWidthPx: Float = 3f * resources.displayMetrics.density
    private var rotationAngle: Float = 0f
    private var rotationAnimator: ValueAnimator? = null

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
    }

    private val clearPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
    }

    private var offscreenBitmap: Bitmap? = null
    private var offscreenCanvas: Canvas? = null

    init {
        startRotation()
    }

    private fun startRotation() {
        rotationAnimator?.cancel()
        rotationAnimator = ValueAnimator.ofFloat(0f, 360f).apply {
            duration = 900L
            repeatCount = ValueAnimator.INFINITE
            interpolator = LinearInterpolator()
            addUpdateListener {
                rotationAngle = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w > 0 && h > 0) {
            offscreenBitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            offscreenCanvas = Canvas(offscreenBitmap!!)
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val bmp = offscreenBitmap ?: return
        val offCanvas = offscreenCanvas ?: return

        offCanvas.drawColor(0, PorterDuff.Mode.CLEAR)

        val cx = width / 2f
        val cy = height / 2f
        val radius = (minOf(width, height) / 2f) - strokeWidthPx

        if (radius <= 0f) return

        paint.strokeWidth = strokeWidthPx
        paint.shader = SweepGradient(
            cx, cy,
            intArrayOf(Color.TRANSPARENT, ringColor),
            floatArrayOf(0f, 1f)
        )

        offCanvas.save()
        offCanvas.rotate(rotationAngle, cx, cy)
        offCanvas.drawCircle(cx, cy, radius, paint)
        offCanvas.restore()

        canvas.drawBitmap(bmp, 0f, 0f, null)
    }

    override fun onDetachedFromWindow() {
        rotationAnimator?.cancel()
        rotationAnimator = null
        offscreenBitmap?.recycle()
        offscreenBitmap = null
        super.onDetachedFromWindow()
    }
}