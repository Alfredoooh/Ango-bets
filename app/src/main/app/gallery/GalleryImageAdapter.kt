// app/src/main/java/com/nexa/app/gallery/GalleryImageAdapter.kt
package com.nexa.app.gallery

import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.nexa.app.util.ThemeColors

/**
 * Adapter do grid Fluent (3 colunas) da galeria própria. Cada item é
 * construído em código (sem XML), com cantos levemente arredondados
 * (Fluent "small" radius) e feedback de seleção via overlay semi-
 * transparente com o accent azul do Fluent.
 */
class GalleryImageAdapter(
    private val images: List<GalleryImage>,
    private val isDark: Boolean,
    private val multiSelect: Boolean,
    private val onSelectionChanged: (Int) -> Unit
) : RecyclerView.Adapter<GalleryImageAdapter.ImageViewHolder>() {

    private val selectedPositions = linkedSetOf<Int>()

    fun selectedUris(): List<android.net.Uri> =
        selectedPositions.sorted().map { images[it].uri }

    inner class ImageViewHolder(val root: FrameLayout, val imageView: ImageView, val checkOverlay: View) :
        RecyclerView.ViewHolder(root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ImageViewHolder {
        val context = parent.context
        val density = context.resources.displayMetrics.density
        fun dp(v: Int) = (v * density).toInt()

        val imageView = ImageView(context).apply {
            scaleType = ImageView.ScaleType.CENTER_CROP
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        val checkOverlay = View(context).apply {
            setBackgroundColor(Color.parseColor("#330067C0"))
            visibility = View.GONE
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        val root = FrameLayout(context).apply {
            layoutParams = ViewGroup.MarginLayoutParams(dp(110), dp(110)).let {
                RecyclerView.LayoutParams(it.width, it.height).apply {
                    setMargins(dp(2), dp(2), dp(2), dp(2))
                }
            }
            clipToOutline = true
            outlineProvider = object : android.view.ViewOutlineProvider() {
                override fun getOutline(view: View, outline: android.graphics.Outline) {
                    outline.setRoundRect(0, 0, view.width, view.height, dp(4).toFloat())
                }
            }
            addView(imageView)
            addView(checkOverlay)
        }

        return ImageViewHolder(root, imageView, checkOverlay)
    }

    override fun onBindViewHolder(holder: ImageViewHolder, position: Int) {
        val item = images[position]
        holder.imageView.setImageURI(null)
        holder.imageView.setImageURI(item.uri)
        holder.imageView.setBackgroundColor(
            ThemeColors.get(isDark).cardBg
        )
        holder.checkOverlay.visibility =
            if (selectedPositions.contains(position)) View.VISIBLE else View.GONE

        holder.root.setOnClickListener {
            if (multiSelect) {
                if (selectedPositions.contains(position)) {
                    selectedPositions.remove(position)
                } else {
                    selectedPositions.add(position)
                }
                notifyItemChanged(position)
            } else {
                selectedPositions.clear()
                selectedPositions.add(position)
                notifyDataSetChanged()
            }
            onSelectionChanged(selectedPositions.size)
        }
    }

    override fun getItemCount(): Int = images.size
}