// app/src/main/java/com/nexa/app/gallery/GalleryImage.kt
package com.nexa.app.gallery

import android.net.Uri

data class GalleryImage(
    val uri: Uri,
    val displayName: String,
    val dateAddedSeconds: Long
)