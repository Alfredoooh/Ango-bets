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
 * (ViewAnimationUtils) a partir de (originX, originY). Só quando o
 * overlay já cobre o ecrã por completo é que onAnimationComplete()
 * aplica de facto a nova paleta ao conteúdo real por baixo — e só
 * depois disso o overlay é removido, garantindo que nunca há um
 * frame com o tema trocado mas ainda visível por baixo do overlay
 * antigo.
 */
object ThemeRevealHelper {

    private var isRevealInProgress = false

    fun animateThemeChange(
        rootView: ViewGroup,
        originX: Int,
        originY: Int,
        newBackgroundColor: Int,
        durationMs: Long = 480L,
        onAnimationComplete: () -> Unit
    ) {
        // Evita sobrepor duas animações de reveal se o utilizador tocar
        // várias vezes seguidas antes da primeira terminar.
        if (isRevealInProgress) return
        isRevealInProgress = true

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
            onAnimationComplete()
            rootView.removeView(overlay)
            isRevealInProgress = false
            return
        }

        val anim = android.view.ViewAnimationUtils.createCircularReveal(
            overlay, originX, originY, 0f, endRadius
        )
        anim.duration = durationMs
        anim.interpolator = AccelerateDecelerateInterpolator()
        anim.addListener(object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: Animator) {
                onAnimationComplete()
                rootView.removeView(overlay)
                isRevealInProgress = false
            }
        })
        anim.start()
    }
}