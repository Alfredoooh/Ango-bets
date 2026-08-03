// app/src/main/java/com/nexa/app/util/ThemeRevealHelper.kt
package com.nexa.app.util

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.view.View
import android.view.ViewGroup
import android.view.ViewAnimationUtils
import android.view.ViewTreeObserver
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.core.view.ViewCompat
import kotlin.math.hypot
import kotlin.math.max

/**
 * Efeito de troca de tema em círculo, estilo Telegram / Material
 * container transform, a partir do ponto tocado (o botão sol/lua).
 *
 * Como funciona:
 * 1. Cria um overlay opaco com a cor de fundo NOVA (ou ANTIGA, consoante
 *    o sentido), do tamanho do ecrã inteiro, e coloca-o no topo do
 *    z-order (bringToFront) para garantir que fica por cima de tudo.
 * 2. Aplica a nova paleta ao conteúdo real por baixo IMEDIATAMENTE
 *    (antes de animar) — isto é o que faz a animação ser um
 *    verdadeiro "reveal" do tema novo, e não um fade: quando o
 *    círculo termina de animar e o overlay é removido, o conteúdo
 *    por baixo já está correto e não há flash nem salto visual.
 * 3. Espera o overlay estar completamente desenhado (via
 *    OnPreDrawListener) antes de disparar a animação, evitando que o
 *    Android funda a "entrada" da view com o circular reveal — é
 *    esse frame perdido que produzia um fade em vez de uma animação
 *    de raio limpa.
 * 3a. Modo "expandir" (ex: claro -> escuro): reveal cresce de 0 até
 *     cobrir o ecrã todo a partir da origem, depois o overlay é
 *     removido (o conteúdo por baixo, já no tema novo, fica visível).
 * 3b. Modo "encolher" (ex: escuro -> claro): o overlay nasce a cobrir
 *     o ecrã todo já com a cor ANTIGA por cima do conteúdo novo, e o
 *     reveal ENCOLHE até 0 na origem, "engolindo" o tema antigo e
 *     revelando o tema novo por baixo — o reverso exato da animação.
 */
object ThemeRevealHelper {

    private var isRevealInProgress = false

    fun animateThemeChange(
        rootView: ViewGroup,
        originX: Int,
        originY: Int,
        oldBackgroundColor: Int,
        newBackgroundColor: Int,
        isSwitchingToDark: Boolean,
        durationMs: Long = 500L,
        applyNewTheme: () -> Unit
    ) {
        if (isRevealInProgress) return
        isRevealInProgress = true

        if (rootView.width == 0 || rootView.height == 0) {
            // fallback sem animação se ainda não houver bounds válidos
            applyNewTheme()
            isRevealInProgress = false
            return
        }

        val overlayColor = if (isSwitchingToDark) newBackgroundColor else oldBackgroundColor

        val overlay = View(rootView.context).apply {
            setBackgroundColor(overlayColor)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        rootView.addView(overlay)
        overlay.bringToFront()

        // Aplica o tema novo ao conteúdo real JÁ, por baixo do overlay.
        // O overlay é que decide o que fica visualmente por cima até
        // a animação terminar.
        applyNewTheme()

        val maxRadius = hypot(
            max(originX, rootView.width - originX).toDouble(),
            max(originY, rootView.height - originY).toDouble()
        ).toFloat()

        val startRadius = if (isSwitchingToDark) 0f else maxRadius
        val endRadius = if (isSwitchingToDark) maxRadius else 0f

        fun startReveal() {
            if (!ViewCompat.isLaidOut(overlay)) {
                rootView.removeView(overlay)
                isRevealInProgress = false
                return
            }

            val anim = ViewAnimationUtils.createCircularReveal(
                overlay, originX, originY, startRadius, endRadius
            )
            anim.duration = durationMs
            anim.interpolator = AccelerateDecelerateInterpolator()
            anim.addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    rootView.removeView(overlay)
                    isRevealInProgress = false
                }
            })
            anim.start()
        }

        // Garante que o overlay já foi completamente desenhado (cobrindo
        // a tela, na cor certa) ANTES de iniciar a animação do raio —
        // equivalente ao "reflow forçado" que resolveu o mesmo problema
        // na versão web.
        overlay.viewTreeObserver.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
            override fun onPreDraw(): Boolean {
                overlay.viewTreeObserver.removeOnPreDrawListener(this)
                overlay.post { startReveal() }
                return true
            }
        })
    }
}