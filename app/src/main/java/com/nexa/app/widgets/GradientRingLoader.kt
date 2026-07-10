// app/src/main/java/com/nexa/app/widgets/GradientRingLoader.kt
package com.nexa.app.widgets

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.SweepGradient
import android.util.AttributeSet
import android.view.View
import android.view.animation.LinearInterpolator

/**
 * Anel gradiente giratório (espelha o loader 14 do protótipo HTML:
 * conic-gradient(from 0deg, transparent, #fff) com máscara circular).
 * Desenhado inteiramente em Canvas, sem Material Components e sem
 * dependências externas. Cor do anel configurável (ringColor), para
 * poder usar branco sobre fundo escuro ou o azul da marca sobre claro.
 *
 * O arco NÃO é fechado em 360°: fica com uma pequena folga (SWEEP_ANGLE)
 * para que exista uma ponta real onde o strokeCap ROUND se aplica. Com
 * sweepAngle = 360f o Canvas desenha um círculo contínuo sem ponta —
 * o "corte" do gradiente transparente->sólido aparecia reto porque não
 * havia ali uma ponta de traço, só a costura do shader. Com a folga, o
 * lado mais escuro (fundo do gradiente, perto da transparência) termina
 * numa ponta arredondada de verdade, exatamente como o lado da cor cheia.
 */
class GradientRingLoader @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    var ringColor: Int = Color.WHITE
        set(value) {
            field = value
            invalidate()
        }

    companion object {
        // Folga em graus deixada em aberto no anel para dar espaço à ponta
        // arredondada. Pequena o suficiente para não parecer um "gap"
        // visível, grande o suficiente para o cap ROUND ter onde desenhar.
        private const val SWEEP_ANGLE = 328f
        private const val START_ANGLE = -90f
    }

    private val strokeWidthPx = dp(6f)
    private val rect = RectF()
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

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
        val inset = strokeWidthPx / 2f
        rect.set(inset, inset, w - inset, h - inset)
        updateShader()
    }

    private fun updateShader() {
        if (width == 0 || height == 0) return
        val cx = width / 2f
        val cy = height / 2f
        // Gradiente cónico: transparente -> cor sólida, igual ao CSS
        // conic-gradient(from 0deg, transparent, #fff). A ponta
        // transparente coincide com o início da folga deixada no arco.
        val transparentRing = Color.argb(0, Color.red(ringColor), Color.green(ringColor), Color.blue(ringColor))
        val shader = SweepGradient(cx, cy, intArrayOf(transparentRing, ringColor), floatArrayOf(0f, 1f))
        paint.shader = shader
        paint.strokeWidth = strokeWidthPx
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (paint.shader == null) updateShader()
        canvas.save()
        canvas.rotate(rotationDegrees, width / 2f, height / 2f)
        canvas.drawArc(rect, START_ANGLE, SWEEP_ANGLE, false, paint)
        canvas.restore()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        updateShader()
        animator.start()
    }

    override fun onDetachedFromWindow() {
        animator.cancel()
        super.onDetachedFromWindow()
    }
}