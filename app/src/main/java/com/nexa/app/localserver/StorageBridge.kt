// app/src/main/java/com/nexa/app/localserver/StorageBridge.kt
package com.nexa.app.localserver

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.nexa.app.docexport.DocxBuilder
import com.nexa.app.docexport.PdfBuilder
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Ponte JS exposta ao WebView como window.AndroidStorage. Ao contrário da
 * FolderPickerActivity nativa anterior, esta ponte NÃO desenha nenhuma UI
 * — só dá acesso a dados de sistema de ficheiros e à geração de docx/pdf.
 * A tela em si (navegação de pastas, escolha de formato) é 100% a página
 * ExportPickerPage.svelte, dentro do próprio WebApp — mais consistente
 * com o resto do produto e mais fácil de manter visualmente.
 *
 * exportDocument é assíncrono: devolve de imediato (nunca bloqueia a UI
 * thread) e avisa o JS do resultado via
 * window.onNexaExportResult(requestId, resultJson) quando terminar.
 * A versão anterior bloqueava a própria UI thread à espera de um
 * runOnUiThread agendado nela mesma — um deadlock garantido que fazia
 * a exportação nunca responder (nem PDF nem DOCX).
 */
class StorageBridge(private val activity: Activity, private val webView: WebView) {

    @JavascriptInterface
    fun hasPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Environment.isExternalStorageManager()
        } else {
            true
        }
    }

    @JavascriptInterface
    fun requestPermission() {
        activity.runOnUiThread {
            try {
                val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
                    data = Uri.parse("package:${activity.packageName}")
                }
                activity.startActivity(intent)
            } catch (e: Exception) {
                activity.startActivity(Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION))
            }
        }
    }

    @JavascriptInterface
    fun getRootPath(): String {
        return Environment.getExternalStorageDirectory().absolutePath
    }

    /**
     * Devolve um JSON { path, folders: [{name, path}] } com apenas as
     * subpastas diretas do caminho pedido (sem ficheiros — este picker só
     * navega em pastas, para escolher onde gravar).
     */
    @JavascriptInterface
    fun listFolders(path: String): String {
        return try {
            val dir = File(path)
            val children = dir.listFiles() ?: emptyArray()
            val foldersJson = JSONArray()
            children
                .filter { it.isDirectory && !it.name.startsWith(".") }
                .sortedBy { it.name.lowercase() }
                .forEach { folder ->
                    foldersJson.put(JSONObject().apply {
                        put("name", folder.name)
                        put("path", folder.absolutePath)
                    })
                }
            JSONObject().apply {
                put("path", dir.absolutePath)
                put("folders", foldersJson)
            }.toString()
        } catch (e: Exception) {
            JSONObject().apply {
                put("path", path)
                put("folders", JSONArray())
            }.toString()
        }
    }

    @JavascriptInterface
    fun createFolder(parentPath: String, name: String): Boolean {
        return try {
            File(parentPath, name).mkdirs()
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Gera o ficheiro (.docx ou .pdf) diretamente no targetPath indicado.
     * Devolve de imediato ao JS (retorno vazio ignorado do lado do JS);
     * o resultado real chega via callback assíncrono para
     * window.onNexaExportResult(requestId, resultJson).
     *
     * mode "share" também guarda o ficheiro (no targetPath escolhido pelo
     * utilizador) e, depois de gravar, abre o ShareSheet nativo custom
     * (Intent.ACTION_SEND) apontando para esse mesmo ficheiro.
     */
    @JavascriptInterface
    fun exportDocument(requestId: Int, html: String, targetPath: String, format: String, mode: String) {
        activity.runOnUiThread {
            try {
                val file = File(targetPath)
                file.parentFile?.mkdirs()

                if (format == "docx") {
                    DocxBuilder.build(file, html)
                    if (mode == "share") {
                        com.nexa.app.widgets.ShareSheet.show(activity, file, format)
                    }
                    val result = JSONObject().apply { put("ok", true); put("path", file.absolutePath) }
                    deliverResult(requestId, result)
                } else {
                    val fullHtml = PdfBuilder.wrapPagesAsHtmlDocument(html)
                    PdfBuilder.build(activity, file, fullHtml) { ok ->
                        val result = if (ok) {
                            JSONObject().apply { put("ok", true); put("path", file.absolutePath) }
                        } else {
                            JSONObject().apply { put("ok", false); put("error", "falha ao gerar pdf") }
                        }
                        if (ok && mode == "share") {
                            com.nexa.app.widgets.ShareSheet.show(activity, file, format)
                        }
                        deliverResult(requestId, result)
                    }
                }
            } catch (e: Exception) {
                val result = JSONObject().apply { put("ok", false); put("error", e.message ?: "erro desconhecido") }
                deliverResult(requestId, result)
            }
        }
    }

    private fun deliverResult(requestId: Int, result: JSONObject) {
        activity.runOnUiThread {
            val resultJson = result.toString()
                .replace("\\", "\\\\")
                .replace("'", "\\'")
            webView.evaluateJavascript(
                "window.onNexaExportResult && window.onNexaExportResult($requestId, '$resultJson');",
                null
            )
        }
    }
}