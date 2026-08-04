package com.nexa.app.widget

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ObjectAnimator
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import com.nexa.app.R

/**
 * Bottom sheet modal 100% custom, construído sobre android.app.Dialog puro
 * — sem qualquer dependência de com.google.android.material.bottomsheet.
 * Fornece: scrim com fade, slide-up/slide-down animado, fecho ao tocar no
 * scrim, e uma pega (handle) visual no topo do sheet.
 *
 * Uso:
 * val sheet = BottomSheetHelper(context)
 * sheet.setContentView(minhaView)
 * sheet.show()
 * sheet.dismissAnimated() // fecha com animação, depois chama dismiss()
 */
class BottomSheetHelper(context: Context) : Dialog(context, android.R.style.Theme_Translucent_NoTitleBar) {

    private lateinit var sheetContainer: FrameLayout
    private lateinit var contentHolder: FrameLayout
    private lateinit var scrimView: View
    private var isClosing = false
    private var onDismissedByUser: (() -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val root = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        scrimView = View(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.TRANSPARENT)
            setOnClickListener { requestDismiss() }
        }
        root.addView(scrimView)

        sheetContainer = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            )
            background = ContextCompat.getDrawable(context, R.drawable.bg_bottom_sheet)
            clipToPadding = false
            // Bloqueia toques de passarem para o scrim quando tocados dentro
            // do próprio sheet.
            setOnTouchListener { _, _ -> true }
        }

        val handle = View(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                (40 * resources.displayMetrics.density).toInt(),
                (4 * resources.displayMetrics.density).toInt(),
                Gravity.TOP or Gravity.CENTER_HORIZONTAL
            ).apply {
                topMargin = (10 * resources.displayMetrics.density).toInt()
            }
            background = ContextCompat.getDrawable(context, R.drawable.bg_sheet_handle)
        }
        sheetContainer.addView(handle)

        contentHolder = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = (26 * resources.displayMetrics.density).toInt()
            }
        }
        sheetContainer.addView(contentHolder)

        root.addView(sheetContainer)
        setContentView(root)

        window?.apply {
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        }

        setCanceledOnTouchOutside(false)
        setCancelable(true)

        setOnShowListener {
            sheetContainer.translationY = sheetContainer.height.toFloat().let {
                if (it > 0f) it else 1000f
            }
            sheetContainer.post {
                animateIn()
            }
        }
    }

    /** Define o conteúdo interno do sheet (a View passada pelo chamador). */
    fun setContentView2(view: View) {
        contentHolder.removeAllViews()
        contentHolder.addView(
            view,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        )
    }

    fun setOnDismissedByUser(callback: () -> Unit) {
        onDismissedByUser = callback
    }

    private fun animateIn() {
        sheetContainer.translationY = sheetContainer.height.toFloat()
        val scrimAnim = ObjectAnimator.ofInt(0, 0x66)
        scrimAnim.addUpdateListener {
            val alpha = it.animatedValue as Int
            scrimView.setBackgroundColor((alpha shl 24))
        }

        val slideAnim = ObjectAnimator.ofFloat(sheetContainer, "translationY", sheetContainer.height.toFloat(), 0f).apply {
            duration = 240
            interpolator = DecelerateInterpolator()
        }

        scrimAnim.duration = 240
        scrimAnim.start()
        slideAnim.start()
    }

    private fun requestDismiss() {
        if (isClosing) return
        dismissAnimated()
    }

    fun dismissAnimated() {
        if (isClosing) return
        isClosing = true

        val slideAnim = ObjectAnimator.ofFloat(sheetContainer, "translationY", 0f, sheetContainer.height.toFloat()).apply {
            duration = 200
        }
        val scrimAnim = ObjectAnimator.ofInt(0x66, 0)
        scrimAnim.addUpdateListener {
            val alpha = it.animatedValue as Int
            scrimView.setBackgroundColor((alpha shl 24))
        }
        scrimAnim.duration = 200

        slideAnim.addListener(object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: Animator) {
                onDismissedByUser?.invoke()
                dismiss()
            }
        })

        scrimAnim.start()
        slideAnim.start()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        return super.onTouchEvent(event)
    }
}