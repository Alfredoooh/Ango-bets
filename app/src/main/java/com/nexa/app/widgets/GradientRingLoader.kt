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
 * Anel gradiente giratório — réplica 1:1 do protótipo HTML:
 *
 *   background: conic-gradient(from 0deg, transparent, var(--ring-color));
 *   mask-image: radial-gradient(farthest-side,
 *       transparent calc(100% - stroke - 1px),
 *       #000 calc(100% - stroke));
 *
 * A abordagem anterior (drawArc com SweepGradient) desenhava um ARCO, não
 * um DISCO mascarado — por isso o resultado nunca batia com o CSS: o CSS
 * pinta o círculo INTEIRO com o conic-gradient e depois recorta um anel
 * com a máscara radial (que também suaviza a borda interna em ~1px).
 * Aqui replicamos exatamente esse pipeline:
 *
 *   1. Desenha um disco cheio com SweepGradient (equivalente ao conic-gradient).
 *   2. Aplica uma máscara radial com PorterDuff.DST_IN para abrir o buraco
 *      central, com a mesma zona de transição suave de ~1px do CSS.
 *   3. O bitmap resultante (já um anel com ponta arredondada, gerado pelo
 *      próprio gradiente, sem stroke cap extra) é rotacionado por frame.
 *
 * Cor do anel configurável via ringColor (branco sobre fundo escuro,
 * ou o azul/cinza da marca sobre fundo claro).
 */
class GradientRingLoader @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    var ringColor: Int = Color.WHITE
        set(value) {
            field = value
            ringBitmap = null
            invalidate()
        }

    // --ring-size: 28px / --stroke-width: 6px no protótipo original.
    private val strokeWidthPx = dp(6f)

    private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        isFilterBitmap = true
    }

    private var ringBitmap: Bitmap? = null
    private var rotationDegrees = 0f

    private val animator = ValueAnimator.ofFloat(0f, 360f).apply {
        duration = 1000L
        repeatCount = ValueAnimator.INFINITE
        interpolator = LinearInterpolator()
        addUpdateListener {
            rotationDegrees = it.animatedValue as Float
            invalidate()
        }
    }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        ringBitmap = null
    }

    /**
     * Gera o bitmap do anel uma única vez por tamanho/cor: conic-gradient
     * completo mascarado por um radial-gradient, exatamente como o CSS.
     */
    private fun buildRingBitmap(): Bitmap? {
        val size = width.coerceAtMost(height)
        if (size <= 0) return null

        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val cx = size / 2f
        val cy = size / 2f
        val radius = size / 2f

        // 1) conic-gradient(from 0deg, transparent, ring-color) — disco cheio.
        val transparentRing = Color.argb(0, Color.red(ringColor), Color.green(ringColor), Color.blue(ringColor))
        val conicPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = SweepGradient(cx, cy, intArrayOf(transparentRing, ringColor), floatArrayOf(0f, 1f))
        }
        canvas.drawCircle(cx, cy, radius, conicPaint)

        // 2) mask-image: radial-gradient(farthest-side,
        //      transparent calc(100% - stroke - 1px),
        //      #000 calc(100% - stroke))
        // farthest-side => o raio da máscara é o próprio raio do círculo.
        // Reproduzido aqui com DST_IN: preto = mantém pixel, transparente = apaga.
        val innerRadius = (radius - strokeWidthPx - dp(1f)).coerceAtLeast(0f)
        val outerRadius = (radius - strokeWidthPx).coerceAtLeast(innerRadius + 0.01f)
        val innerStop = (innerRadius / radius).coerceIn(0f, 1f)
        val outerStop = (outerRadius / radius).coerceIn(innerStop, 1f)

        val maskPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
            shader = RadialGradient(
                cx, cy, radius,
                intArrayOf(Color.TRANSPARENT, Color.TRANSPARENT, Color.BLACK),
                floatArrayOf(0f, innerStop, outerStop),
                Shader.TileMode.CLAMP
            )
        }
        canvas.drawCircle(cx, cy, radius, maskPaint)

        return bitmap
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val bmp = ringBitmap ?: buildRingBitmap()?.also { ringBitmap = it } ?: return

        canvas.save()
        canvas.rotate(rotationDegrees, width / 2f, height / 2f)
        val left = (width - bmp.width) / 2f
        val top = (height - bmp.height) / 2f
        canvas.drawBitmap(bmp, left, top, bitmapPaint)
        canvas.restore()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        animator.start()
    }

    override fun onDetachedFromWindow() {
        animator.cancel()
        ringBitmap?.recycle()
        ringBitmap = null
        super.onDetachedFromWindow()
    }
}