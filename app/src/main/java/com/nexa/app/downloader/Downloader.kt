package com.nexa.app.downloader

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.textfield.TextInputEditText
import com.nexa.app.R
import kotlinx.coroutines.launch

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

    private var pendingDownload: (() -> Unit)? = null

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

        downloadButton.setOnClickListener { onDownloadClicked() }

        intent.getStringExtra(EXTRA_URL)?.let { urlEditText.setText(it) }
        intent.getStringExtra(EXTRA_FILE_NAME)?.let { fileNameEditText.setText(it) }
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