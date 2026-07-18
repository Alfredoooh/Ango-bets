// app/src/main/java/com/nexa/app/util/ThemeRevealHelper.kt
package com.nexa.app.util

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.core.view.ViewCompat
import kotlin.math.hypot
import kotlin.math.max

/**
 * Efeito de troca de tema em círculo a crescer a partir do ponto de
 * toque, como no Telegram. Implementação por overlay: cria uma View
 * cheia da cor NOVA do tema, revela-a com um circular reveal
 * (ViewAnimationUtils) a partir de (originX, originY), e só quando a
 * animação termina é que o callback onMidAnimation() aplica de facto
 * a nova paleta ao conteúdo real por baixo — depois remove o overlay.
 */
object ThemeRevealHelper {

    fun animateThemeChange(
        rootView: ViewGroup,
        originX: Int,
        originY: Int,
        newBackgroundColor: Int,
        durationMs: Long = 480L,
        onMidAnimation: () -> Unit
    ) {
        val overlay = View(rootView.context).apply {
            setBackgroundColor(newBackgroundColor)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        rootView.addView(overlay)

        val endRadius = hypot(
            max(originX, rootView.width - originX).toDouble(),
            max(originY, rootView.height - originY).toDouble()
        ).toFloat()

        if (!ViewCompat.isLaidOut(overlay)) {
            // fallback sem animação de reveal se a view ainda não tiver bounds
            onMidAnimation()
            rootView.removeView(overlay)
            return
        }

        val anim = android.view.ViewAnimationUtils.createCircularReveal(
            overlay, originX, originY, 0f, endRadius
        )
        anim.duration = durationMs
        anim.interpolator = AccelerateDecelerateInterpolator()
        anim.addListener(object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: Animator) {
                onMidAnimation()
                rootView.removeView(overlay)
            }
        })
        anim.start()
    }
}