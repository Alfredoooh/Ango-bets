// app/src/main/java/com/nexa/app/gallery/MediaStoreLoader.kt
package com.nexa.app.gallery

import android.content.ContentUris
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Consulta o MediaStore para listar imagens da galeria do dispositivo.
 * Usado pela galeria Fluent própria (GalleryBottomSheet). Se a consulta
 * falhar por qualquer motivo (SecurityException, cursor nulo, etc.),
 * devolve lista vazia — o chamador decide cair para o Photo Picker do
 * sistema nesse caso.
 */
object MediaStoreLoader {

    suspend fun loadImages(context: Context, limit: Int = 400): List<GalleryImage> =
        withContext(Dispatchers.IO) {
            val result = mutableListOf<GalleryImage>()
            try {
                val collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
                val projection = arrayOf(
                    MediaStore.Images.Media._ID,
                    MediaStore.Images.Media.DISPLAY_NAME,
                    MediaStore.Images.Media.DATE_ADDED
                )
                val sortOrder = "${MediaStore.Images.Media.DATE_ADDED} DESC"

                context.contentResolver.query(
                    collection,
                    projection,
                    null,
                    null,
                    sortOrder
                )?.use { cursor ->
                    val idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
                    val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME)
                    val dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED)

                    while (cursor.moveToNext() && result.size < limit) {
                        val id = cursor.getLong(idCol)
                        val name = cursor.getString(nameCol) ?: "image_$id"
                        val date = cursor.getLong(dateCol)
                        val uri = ContentUris.withAppendedId(collection, id)
                        result.add(GalleryImage(uri, name, date))
                    }
                }
            } catch (_: SecurityException) {
                return@withContext emptyList()
            } catch (_: Exception) {
                return@withContext emptyList()
            }
            result
        }

    fun hasReadImagesPermission(context: Context): Boolean {
        val permission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            android.Manifest.permission.READ_MEDIA_IMAGES
        } else {
            android.Manifest.permission.READ_EXTERNAL_STORAGE
        }
        return androidx.core.content.ContextCompat.checkSelfPermission(context, permission) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
    }
}