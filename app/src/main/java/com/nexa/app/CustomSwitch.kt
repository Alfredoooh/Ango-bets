package com.nexa.app.widget

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.view.animation.DecelerateInterpolator
import androidx.core.content.ContextCompat
import com.nexa.app.R

/**
 * Toggle custom desenhado diretamente em Canvas — track (cápsula) + thumb
 * (círculo) que desliza com animação. Não depende de Material Components;
 * usa só android.view.View e Paint/Canvas puros, como pedido.
 *
 * Uso em XML:
 * <com.nexa.app.widget.CustomSwitch
 *     android:layout_width="52dp"
 *     android:layout_height="30dp" />
 *
 * Uso em código:
 * customSwitch.setChecked(true, animate = false)
 * customSwitch.setOnCheckedChangeListener { isChecked -> ... }
 */
class CustomSwitch @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var isChecked = false
    private var listener: ((Boolean) -> Unit)? = null

    // thumbOffset vai de 0f (desligado, encostado à esquerda) a 1f (ligado,
    // encostado à direita) — é isto que a animação interpola.
    private var thumbOffset = 0f

    private val trackPaintOn = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.toggle_track_on)
        style = Paint.Style.FILL
    }
    private val trackPaintOff = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.toggle_track_off)
        style = Paint.Style.FILL
    }
    private val thumbPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.toggle_thumb)
        style = Paint.Style.FILL
        setShadowLayer(3f, 0f, 1.5f, 0x33000000)
    }

    private val trackRect = RectF()
    private var animator: ValueAnimator? = null

    init {
        // Sombra do thumb precisa de layer software para renderizar bem
        setLayerType(LAYER_TYPE_SOFTWARE, thumbPaint)
        isClickable = true
        isFocusable = true
    }

    fun setOnCheckedChangeListener(l: (Boolean) -> Unit) {
        listener = l
    }

    fun isChecked(): Boolean = isChecked

    fun setChecked(checked: Boolean, animate: Boolean = true, notify: Boolean = false) {
        if (isChecked == checked && animator == null) {
            thumbOffset = if (checked) 1f else 0f
            invalidate()
            return
        }
        isChecked = checked
        val target = if (checked) 1f else 0f

        animator?.cancel()
        if (animate) {
            animator = ValueAnimator.ofFloat(thumbOffset, target).apply {
                duration = 180
                interpolator = DecelerateInterpolator()
                addUpdateListener {
                    thumbOffset = it.animatedValue as Float
                    invalidate()
                }
                start()
            }
        } else {
            thumbOffset = target
            invalidate()
        }

        if (notify) {
            listener?.invoke(isChecked)
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isEnabled) return false
        when (event.action) {
            MotionEvent.ACTION_UP -> {
                if (isClickable) {
                    performClick()
                }
                return true
            }
            MotionEvent.ACTION_DOWN -> return true
        }
        return super.onTouchEvent(event)
    }

    override fun performClick(): Boolean {
        super.performClick()
        setChecked(!isChecked, animate = true, notify = true)
        return true
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val h = height.toFloat()
        val w = width.toFloat()
        val trackHeight = h
        val radius = trackHeight / 2f

        trackRect.set(0f, 0f, w, trackHeight)

        // Interpola a cor do track diretamente entre off e on usando o
        // thumbOffset, para que a cor mude suavemente durante o arrasto/
        // animação, não só o thumb.
        val trackPaint = if (thumbOffset >= 0.5f) trackPaintOn else trackPaintOff
        canvas.drawRoundRect(trackRect, radius, radius, trackPaint)

        val thumbRadius = radius - 3f
        val minCx = radius
        val maxCx = w - radius
        val cx = minCx + (maxCx - minCx) * thumbOffset
        val cy = h / 2f

        canvas.drawCircle(cx, cy, thumbRadius, thumbPaint)
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        // Garante um tamanho mínimo sensato mesmo que o XML não especifique
        // dimensões exatas (evita toggle de 0px se alguém usar wrap_content).
        val minWidth = (52 * resources.displayMetrics.density).toInt()
        val minHeight = (30 * resources.displayMetrics.density).toInt()
        val w = resolveSize(minWidth, widthMeasureSpec)
        val h = resolveSize(minHeight, heightMeasureSpec)
        setMeasuredDimension(w, h)
    }
}