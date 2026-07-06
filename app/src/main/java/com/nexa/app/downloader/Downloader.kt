package com.nexa.app.downloader

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

sealed class DownloadResult {
    data class Success(val fileName: String, val bytesWritten: Long) : DownloadResult()
    data class Failure(val message: String, val cause: Throwable? = null) : DownloadResult()
}

sealed class MediaKind(val mimeType: String, val collection: (Boolean) -> android.net.Uri) {
    object Audio : MediaKind(
        "audio/mpeg",
        { useLegacy -> if (useLegacy) MediaStore.Audio.Media.EXTERNAL_CONTENT_URI else MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) }
    )
    object Video : MediaKind(
        "video/mp4",
        { useLegacy -> if (useLegacy) MediaStore.Video.Media.EXTERNAL_CONTENT_URI else MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) }
    )
    object Image : MediaKind(
        "image/jpeg",
        { useLegacy -> if (useLegacy) MediaStore.Images.Media.EXTERNAL_CONTENT_URI else MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY) }
    )
}

class Downloader(private val context: Context) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .build()

    suspend fun download(
        url: String,
        fileName: String,
        kind: MediaKind,
        onProgress: ((bytesRead: Long, bytesTotal: Long) -> Unit)? = null
    ): DownloadResult = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext DownloadResult.Failure("HTTP ${response.code} ao descarregar $url")
                }

                val body = response.body ?: return@withContext DownloadResult.Failure("Corpo da resposta vazio")
                val totalBytes = body.contentLength()

                val useLegacy = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                val collectionUri = kind.collection(useLegacy)

                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, kind.mimeType)
                    if (!useLegacy) {
                        val relativePath = when (kind) {
                            is MediaKind.Audio -> Environment.DIRECTORY_MUSIC
                            is MediaKind.Video -> Environment.DIRECTORY_MOVIES
                            is MediaKind.Image -> Environment.DIRECTORY_PICTURES
                        }
                        put(MediaStore.MediaColumns.RELATIVE_PATH, "$relativePath/Nexa")
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                    }
                }

                val resolver = context.contentResolver
                val itemUri = resolver.insert(collectionUri, values)
                    ?: return@withContext DownloadResult.Failure("Não foi possível criar a entrada no MediaStore")

                var bytesWritten = 0L
                resolver.openOutputStream(itemUri)?.use { output ->
                    body.byteStream().use { input ->
                        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                        while (true) {
                            val read = input.read(buffer)
                            if (read == -1) break
                            output.write(buffer, 0, read)
                            bytesWritten += read
                            onProgress?.invoke(bytesWritten, totalBytes)
                        }
                    }
                } ?: return@withContext DownloadResult.Failure("Não foi possível abrir stream de escrita")

                if (!useLegacy) {
                    values.clear()
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(itemUri, values, null, null)
                }

                DownloadResult.Success(fileName, bytesWritten)
            }
        } catch (e: IOException) {
            DownloadResult.Failure("Erro de rede: ${e.message}", e)
        } catch (e: Exception) {
            DownloadResult.Failure("Erro inesperado: ${e.message}", e)
        }
    }
}