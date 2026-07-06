package com.nexa.app.downloader

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.textfield.TextInputEditText
import com.nexa.app.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.downloader.Downloader as NewPipeDownloaderBase
import org.schabi.newpipe.extractor.downloader.Request as NewPipeRequest
import org.schabi.newpipe.extractor.downloader.Response as NewPipeResponse
import org.schabi.newpipe.extractor.stream.AudioStream
import org.schabi.newpipe.extractor.stream.VideoStream
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.Request as OkRequest

enum class MediaKind {
    Audio,
    Video,
    Image
}

sealed class DownloadResult {
    data class Success(val fileName: String, val bytesWritten: Long) : DownloadResult()
    data class Failure(val message: String) : DownloadResult()
}

data class StreamOption(
    val label: String,
    val url: String,
    val extension: String,
    val approxSizeBytes: Long,
    val isAudioOnly: Boolean
)

data class LinkInfo(
    val title: String,
    val thumbnailUrl: String?,
    val durationSeconds: Long,
    val uploader: String?,
    val streams: List<StreamOption>,
    val isDirectFile: Boolean
)

object NewPipeInit {
    @Volatile private var initialized = false

    fun ensureInit() {
        if (initialized) return
        synchronized(this) {
            if (initialized) return
            NewPipe.init(OkHttpNewPipeDownloader())
            initialized = true
        }
    }
}

private class OkHttpNewPipeDownloader : NewPipeDownloaderBase() {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    override fun execute(request: NewPipeRequest): NewPipeResponse {
        val builder = OkRequest.Builder().url(request.url())

        val headers = request.headers()
        for ((key, values) in headers) {
            for (value in values) {
                builder.addHeader(key, value)
            }
        }
        if (headers["User-Agent"].isNullOrEmpty()) {
            builder.addHeader(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        }

        val dataToSend = request.dataToSend()
        when (request.httpMethod()) {
            "POST" -> builder.post(
                okhttp3.RequestBody.create(null, dataToSend ?: ByteArray(0))
            )
            "PUT" -> builder.put(
                okhttp3.RequestBody.create(null, dataToSend ?: ByteArray(0))
            )
            else -> builder.get()
        }

        client.newCall(builder.build()).execute().use { resp ->
            val body = resp.body?.string() ?: ""
            val respHeaders = mutableMapOf<String, List<String>>()
            for (name in resp.headers.names()) {
                respHeaders[name] = resp.headers.values(name)
            }
            return NewPipeResponse(
                resp.code,
                resp.message,
                respHeaders,
                body,
                resp.request.url.toString()
            )
        }
    }
}

class LinkAnalyzer {

    suspend fun analyze(url: String): Result<LinkInfo> = withContext(Dispatchers.IO) {
        try {
            if (isYoutubeUrl(url)) {
                analyzeYoutube(url)
            } else {
                analyzeDirectFile(url)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun isYoutubeUrl(url: String): Boolean {
        val lower = url.lowercase()
        return lower.contains("youtube.com") || lower.contains("youtu.be")
    }

    private fun analyzeYoutube(url: String): Result<LinkInfo> {
        NewPipeInit.ensureInit()
        val service = ServiceList.YouTube
        val extractor = service.getStreamExtractor(url)
        extractor.fetchPage()

        val title = extractor.name ?: "Sem título"
        val thumbnail = extractor.thumbnails?.lastOrNull()?.url
        val duration = extractor.length
        val uploader = extractor.uploaderName

        val streams = mutableListOf<StreamOption>()

        val videoStreams: List<VideoStream> = extractor.videoStreams ?: emptyList()
        for (v in videoStreams) {
            val ext = v.format?.suffix ?: "mp4"
            val approxSize = estimateSize(v.bitrate, duration)
            streams.add(
                StreamOption(
                    label = "${v.resolution ?: "?"} (${ext.uppercase()})",
                    url = v.content,
                    extension = ext,
                    approxSizeBytes = approxSize,
                    isAudioOnly = false
                )
            )
        }

        val audioStreams: List<AudioStream> = extractor.audioStreams ?: emptyList()
        for (a in audioStreams) {
            val ext = a.format?.suffix ?: "m4a"
            val approxSize = estimateSize(a.averageBitrate, duration)
            streams.add(
                StreamOption(
                    label = "Áudio ${a.averageBitrate}kbps (${ext.uppercase()})",
                    url = a.content,
                    extension = ext,
                    approxSizeBytes = approxSize,
                    isAudioOnly = true
                )
            )
        }

        if (streams.isEmpty()) {
            return Result.failure(Exception("Nenhum stream encontrado para este vídeo"))
        }

        return Result.success(
            LinkInfo(
                title = title,
                thumbnailUrl = thumbnail,
                durationSeconds = duration,
                uploader = uploader,
                streams = streams,
                isDirectFile = false
            )
        )
    }

    private fun estimateSize(bitrateKbps: Int, durationSeconds: Long): Long {
        if (bitrateKbps <= 0 || durationSeconds <= 0) return -1L
        return (bitrateKbps.toLong() * 1000L / 8L) * durationSeconds
    }

    private fun analyzeDirectFile(url: String): Result<LinkInfo> {
        var connection: HttpURLConnection? = null
        return try {
            connection = URL(url).openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            connection.instanceFollowRedirects = true
            connection.setRequestProperty(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            connection.connect()

            val contentType = connection.contentType ?: ""

            if (contentType.startsWith("text/html")) {
                val html = connection.inputStream.bufferedReader().use { it.readText() }
                connection.disconnect()
                return extractFromHtml(html, url)
            }

            val size = connection.contentLengthLong
            val fileName = url.substringAfterLast('/').substringBefore('?')

            val stream = StreamOption(
                label = if (contentType.isNotEmpty()) contentType else "Ficheiro direto",
                url = url,
                extension = fileName.substringAfterLast('.', "bin"),
                approxSizeBytes = size,
                isAudioOnly = contentType.startsWith("audio")
            )

            Result.success(
                LinkInfo(
                    title = fileName.ifEmpty { "Ficheiro" },
                    thumbnailUrl = null,
                    durationSeconds = 0L,
                    uploader = null,
                    streams = listOf(stream),
                    isDirectFile = true
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            connection?.disconnect()
        }
    }

    private fun extractFromHtml(html: String, pageUrl: String): Result<LinkInfo> {
        val title = Regex("<meta[^>]+property=[\"']og:title[\"'][^>]+content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            .find(html)?.groupValues?.get(1)
            ?: Regex("<title[^>]*>([^<]+)</title>", RegexOption.IGNORE_CASE)
                .find(html)?.groupValues?.get(1)
            ?: pageUrl

        val thumbnail = Regex("<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            .find(html)?.groupValues?.get(1)

        val streams = mutableListOf<StreamOption>()

        val ogVideo = Regex("<meta[^>]+property=[\"']og:video(?::secure_url)?[\"'][^>]+content=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            .findAll(html).map { it.groupValues[1] }.toList()

        val videoTagSrcs = Regex("<video[^>]+src=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            .findAll(html).map { it.groupValues[1] }.toList()

        val sourceTagSrcs = Regex("<source[^>]+src=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
            .findAll(html).map { it.groupValues[1] }.toList()

        val allVideoUrls = (ogVideo + videoTagSrcs + sourceTagSrcs).distinct()

        for (rawUrl in allVideoUrls) {
            val resolved = resolveUrl(rawUrl, pageUrl)
            val ext = resolved.substringAfterLast('.', "mp4").substringBefore('?').take(4)
            streams.add(
                StreamOption(
                    label = "Vídeo (${ext.uppercase()})",
                    url = resolved,
                    extension = if (ext.isEmpty()) "mp4" else ext,
                    approxSizeBytes = -1L,
                    isAudioOnly = false
                )
            )
        }

        if (streams.isEmpty() && thumbnail != null) {
            val resolvedThumb = resolveUrl(thumbnail, pageUrl)
            val ext = resolvedThumb.substringAfterLast('.', "jpg").substringBefore('?').take(4)
            streams.add(
                StreamOption(
                    label = "Imagem (${ext.uppercase()})",
                    url = resolvedThumb,
                    extension = if (ext.isEmpty()) "jpg" else ext,
                    approxSizeBytes = -1L,
                    isAudioOnly = false
                )
            )
        }

        if (streams.isEmpty()) {
            return Result.failure(Exception("Não foi possível encontrar ficheiro de media na página"))
        }

        return Result.success(
            LinkInfo(
                title = title,
                thumbnailUrl = thumbnail?.let { resolveUrl(it, pageUrl) },
                durationSeconds = 0L,
                uploader = null,
                streams = streams,
                isDirectFile = false
            )
        )
    }

    private fun resolveUrl(candidate: String, pageUrl: String): String {
        return try {
            if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
                candidate
            } else {
                URL(URL(pageUrl), candidate).toString()
            }
        } catch (e: Exception) {
            candidate
        }
    }
}

class Downloader(private val context: Context) {

    suspend fun download(
        url: String,
        fileName: String,
        kind: MediaKind,
        onProgress: (bytesRead: Long, bytesTotal: Long) -> Unit
    ): DownloadResult = withContext(Dispatchers.IO) {
        var connection: HttpURLConnection? = null
        try {
            connection = URL(url).openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.connect()

            if (connection.responseCode !in 200..299) {
                return@withContext DownloadResult.Failure("HTTP ${connection.responseCode}")
            }

            val totalBytes = connection.contentLengthLong
            val mimeType = mimeTypeFor(kind, fileName)

            val outputStream: OutputStream
            var tempFile: File? = null
            var resolvedUri: Uri? = null

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val (uri, stream) = openMediaStoreOutputStream(kind, fileName, mimeType)
                    ?: return@withContext DownloadResult.Failure("Não foi possível criar o ficheiro de destino")
                resolvedUri = uri
                outputStream = stream
            } else {
                val dir = legacyPublicDir(kind)
                if (!dir.exists()) dir.mkdirs()
                tempFile = File(dir, fileName)
                outputStream = FileOutputStream(tempFile)
            }

            var bytesWritten = 0L
            outputStream.use { out ->
                connection.inputStream.use { input ->
                    val buffer = ByteArray(8192)
                    var read: Int
                    while (input.read(buffer).also { read = it } != -1) {
                        out.write(buffer, 0, read)
                        bytesWritten += read
                        onProgress(bytesWritten, totalBytes)
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && resolvedUri != null) {
                finalizeMediaStoreEntry(kind, resolvedUri)
            } else {
                tempFile?.let { file ->
                    @Suppress("DEPRECATION")
                    context.sendBroadcast(
                        android.content.Intent(android.content.Intent.ACTION_MEDIA_SCANNER_SCAN_FILE).apply {
                            data = Uri.fromFile(file)
                        }
                    )
                }
            }

            DownloadResult.Success(fileName, bytesWritten)
        } catch (e: Exception) {
            DownloadResult.Failure(e.message ?: "Erro desconhecido")
        } finally {
            connection?.disconnect()
        }
    }

    private fun openMediaStoreOutputStream(
        kind: MediaKind,
        fileName: String,
        mimeType: String
    ): Pair<Uri, OutputStream>? {
        val collection: Uri
        val relativePath: String

        when (kind) {
            MediaKind.Audio -> {
                collection = MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                relativePath = Environment.DIRECTORY_MUSIC + "/Nexa"
            }
            MediaKind.Video -> {
                collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                relativePath = Environment.DIRECTORY_MOVIES + "/Nexa"
            }
            MediaKind.Image -> {
                collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                relativePath = Environment.DIRECTORY_PICTURES + "/Nexa"
            }
        }

        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }

        val uri = context.contentResolver.insert(collection, values) ?: return null
        val stream = context.contentResolver.openOutputStream(uri) ?: return null
        return uri to stream
    }

    private fun finalizeMediaStoreEntry(kind: MediaKind, uri: Uri) {
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.IS_PENDING, 0)
        }
        context.contentResolver.update(uri, values, null, null)
    }

    private fun legacyPublicDir(kind: MediaKind): File {
        val baseDir = when (kind) {
            MediaKind.Audio -> Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
            MediaKind.Video -> Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
            MediaKind.Image -> Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
        }
        return File(baseDir, "Nexa")
    }

    private fun mimeTypeFor(kind: MediaKind, fileName: String): String {
        val extension = fileName.substringAfterLast('.', "").lowercase()
        return when (kind) {
            MediaKind.Audio -> when (extension) {
                "wav" -> "audio/wav"
                "ogg" -> "audio/ogg"
                "m4a" -> "audio/mp4"
                else -> "audio/mpeg"
            }
            MediaKind.Video -> when (extension) {
                "mkv" -> "video/x-matroska"
                "webm" -> "video/webm"
                else -> "video/mp4"
            }
            MediaKind.Image -> when (extension) {
                "png" -> "image/png"
                "webp" -> "image/webp"
                "gif" -> "image/gif"
                else -> "image/jpeg"
            }
        }
    }
}

class DownloaderActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_FILE_NAME = "extra_file_name"
    }

    private lateinit var root: CoordinatorLayout
    private lateinit var urlEditText: TextInputEditText
    private lateinit var fileNameEditText: TextInputEditText
    private lateinit var chipGroup: ChipGroup
    private lateinit var progress: LinearProgressIndicator
    private lateinit var progressLabel: android.widget.TextView
    private lateinit var downloadButton: MaterialButton
    private lateinit var analyzeButton: MaterialButton
    private lateinit var analyzeProgress: LinearProgressIndicator
    private lateinit var videoInfoCard: MaterialCardView
    private lateinit var videoThumbnail: android.widget.ImageView
    private lateinit var videoTitle: android.widget.TextView
    private lateinit var videoMeta: android.widget.TextView
    private lateinit var streamChipGroup: ChipGroup

    private var pendingDownload: (() -> Unit)? = null
    private var currentStreams: List<StreamOption> = emptyList()
    private var selectedStream: StreamOption? = null

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            pendingDownload?.invoke()
        } else {
            Snackbar.make(root, "Permissão de armazenamento negada", Snackbar.LENGTH_LONG).show()
        }
        pendingDownload = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_downloader)

        root = findViewById(R.id.downloaderRoot)
        urlEditText = findViewById(R.id.urlEditText)
        fileNameEditText = findViewById(R.id.fileNameEditText)
        chipGroup = findViewById(R.id.mediaKindChipGroup)
        progress = findViewById(R.id.downloadProgress)
        progressLabel = findViewById(R.id.progressLabel)
        downloadButton = findViewById(R.id.downloadButton)
        analyzeButton = findViewById(R.id.analyzeButton)
        analyzeProgress = findViewById(R.id.analyzeProgress)
        videoInfoCard = findViewById(R.id.videoInfoCard)
        videoThumbnail = findViewById(R.id.videoThumbnail)
        videoTitle = findViewById(R.id.videoTitle)
        videoMeta = findViewById(R.id.videoMeta)
        streamChipGroup = findViewById(R.id.streamChipGroup)

        downloadButton.setOnClickListener { onDownloadClicked() }
        analyzeButton.setOnClickListener { onAnalyzeClicked() }

        intent.getStringExtra(EXTRA_URL)?.let { urlEditText.setText(it) }
        intent.getStringExtra(EXTRA_FILE_NAME)?.let { fileNameEditText.setText(it) }
    }

    private fun onAnalyzeClicked() {
        val url = urlEditText.text?.toString()?.trim().orEmpty()
        if (url.isEmpty() || !(url.startsWith("http://") || url.startsWith("https://"))) {
            Snackbar.make(root, "URL inválido", Snackbar.LENGTH_SHORT).show()
            return
        }

        videoInfoCard.visibility = View.GONE
        streamChipGroup.removeAllViews()
        currentStreams = emptyList()
        selectedStream = null
        analyzeButton.isEnabled = false
        analyzeProgress.visibility = View.VISIBLE

        lifecycleScope.launch {
            val analyzer = LinkAnalyzer()
            val result = analyzer.analyze(url)

            analyzeProgress.visibility = View.INVISIBLE
            analyzeButton.isEnabled = true

            result.onSuccess { info ->
                showInfo(info)
            }.onFailure { e ->
                Snackbar.make(root, "Erro ao analisar: ${e.message}", Snackbar.LENGTH_LONG).show()
            }
        }
    }

    private fun showInfo(info: LinkInfo) {
        videoInfoCard.visibility = View.VISIBLE
        videoTitle.text = info.title

        val durationText = if (info.durationSeconds > 0) {
            val m = info.durationSeconds / 60
            val s = info.durationSeconds % 60
            String.format("%d:%02d", m, s)
        } else null

        val metaParts = mutableListOf<String>()
        durationText?.let { metaParts.add("Duração: $it") }
        info.uploader?.let { metaParts.add(it) }
        videoMeta.text = metaParts.joinToString(" • ")

        if (info.thumbnailUrl != null) {
            loadThumbnail(info.thumbnailUrl)
        } else {
            videoThumbnail.setImageDrawable(null)
        }

        currentStreams = info.streams
        streamChipGroup.removeAllViews()

        for ((index, stream) in info.streams.withIndex()) {
            val chip = Chip(this)
            chip.id = View.generateViewId()
            val sizeLabel = if (stream.approxSizeBytes > 0) {
                " ~${formatSize(stream.approxSizeBytes)}"
            } else ""
            chip.text = "${stream.label}$sizeLabel"
            chip.isCheckable = true
            chip.setChipBackgroundColorResource(android.R.color.transparent)
            streamChipGroup.addView(chip)
            if (index == 0) {
                chip.isChecked = true
                selectedStream = stream
                applySelectedStreamDefaults(stream)
            }
        }

        streamChipGroup.setOnCheckedStateChangeListener { group, checkedIds ->
            val checkedId = checkedIds.firstOrNull() ?: return@setOnCheckedStateChangeListener
            val checkedIndex = (0 until group.childCount).firstOrNull { group.getChildAt(it).id == checkedId }
            if (checkedIndex != null && checkedIndex < currentStreams.size) {
                selectedStream = currentStreams[checkedIndex]
                applySelectedStreamDefaults(currentStreams[checkedIndex])
            }
        }
    }

    private fun applySelectedStreamDefaults(stream: StreamOption) {
        chipGroup.check(if (stream.isAudioOnly) R.id.chipAudio else R.id.chipVideo)

        val currentName = fileNameEditText.text?.toString()?.trim().orEmpty()
        val baseName = if (currentName.isEmpty() || !currentName.contains('.')) {
            videoTitle.text?.toString()?.take(50)?.ifEmpty { "download" } ?: "download"
        } else {
            currentName.substringBeforeLast('.')
        }
        val sanitized = baseName.replace(Regex("[\\\\/:*?\"<>|]"), "_")
        fileNameEditText.setText("$sanitized.${stream.extension}")

        urlEditText.setText(stream.url)
    }

    private fun loadThumbnail(thumbUrl: String) {
        lifecycleScope.launch {
            val bitmap = withContext(Dispatchers.IO) {
                try {
                    val conn = URL(thumbUrl).openConnection() as HttpURLConnection
                    conn.connectTimeout = 10000
                    conn.readTimeout = 10000
                    conn.connect()
                    conn.inputStream.use { BitmapFactory.decodeStream(it) }
                } catch (e: Exception) {
                    null
                }
            }
            if (bitmap != null) {
                videoThumbnail.setImageBitmap(bitmap)
            }
        }
    }

    private fun formatSize(bytes: Long): String {
        if (bytes <= 0) return "?"
        val kb = bytes / 1024.0
        val mb = kb / 1024.0
        val gb = mb / 1024.0
        return when {
            gb >= 1 -> String.format("%.2f GB", gb)
            mb >= 1 -> String.format("%.1f MB", mb)
            else -> String.format("%.0f KB", kb)
        }
    }

    private fun onDownloadClicked() {
        val url = urlEditText.text?.toString()?.trim().orEmpty()
        val fileName = fileNameEditText.text?.toString()?.trim().orEmpty()

        if (url.isEmpty() || !(url.startsWith("http://") || url.startsWith("https://"))) {
            Snackbar.make(root, "URL inválido", Snackbar.LENGTH_SHORT).show()
            return
        }
        if (fileName.isEmpty()) {
            Snackbar.make(root, "Indica o nome do ficheiro", Snackbar.LENGTH_SHORT).show()
            return
        }

        val kind = when (chipGroup.checkedChipId) {
            R.id.chipVideo -> MediaKind.Video
            R.id.chipImage -> MediaKind.Image
            else -> MediaKind.Audio
        }

        val startDownload = { startDownload(url, fileName, kind) }

        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED
        ) {
            pendingDownload = startDownload
            permissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            return
        }

        startDownload()
    }

    private fun startDownload(url: String, fileName: String, kind: MediaKind) {
        downloadButton.isEnabled = false
        progress.visibility = View.VISIBLE
        progressLabel.visibility = View.VISIBLE
        progress.progress = 0
        progressLabel.text = "A descarregar..."

        lifecycleScope.launch {
            val downloader = Downloader(applicationContext)
            val result = downloader.download(url, fileName, kind) { bytesRead, bytesTotal ->
                runOnUiThread {
                    if (bytesTotal > 0) {
                        val percent = ((bytesRead * 100) / bytesTotal).toInt()
                        progress.isIndeterminate = false
                        progress.progress = percent
                        progressLabel.text = "$percent% ($bytesRead / $bytesTotal bytes)"
                    } else {
                        progress.isIndeterminate = true
                        progressLabel.text = "${bytesRead} bytes"
                    }
                }
            }

            downloadButton.isEnabled = true
            when (result) {
                is DownloadResult.Success -> {
                    progressLabel.text = "Concluído: ${result.fileName} (${result.bytesWritten} bytes)"
                    Snackbar.make(root, "Download concluído: ${result.fileName}", Snackbar.LENGTH_LONG).show()
                }
                is DownloadResult.Failure -> {
                    progressLabel.text = "Falhou: ${result.message}"
                    Snackbar.make(root, "Erro: ${result.message}", Snackbar.LENGTH_LONG).show()
                }
            }
        }
    }
}