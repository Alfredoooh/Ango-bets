// app/src/main/java/com/nexa/app/webview/AndroidStorageBridge.kt
package com.nexa.app.webview

import android.content.Context
import android.net.Uri
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.content.edit
import androidx.documentfile.provider.DocumentFile
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter

/**
 * Bridge exposta ao WebApp como window.AndroidStorage — implementa o
 * contrato que ExportPickerPage.svelte já assume:
 *
 *   hasPermission(): boolean
 *   requestPermission(): void  (dispara o picker de pasta do sistema)
 *   getRootPath(): string      (devolve o path "virtual" da árvore SAF escolhida)
 *   listFolders(path): string  (JSON: {path, folders:[{name,path}]})
 *   createFolder(path, name): boolean
 *   exportDocument(requestId, content, targetPath, format, mode): void
 *       — assíncrono; resolve via window.onNexaExportResult(requestId, resultJson)
 *
 * Usa Storage Access Framework (SAF): o utilizador escolhe UMA pasta
 * raiz via ACTION_OPEN_DOCUMENT_TREE (disparado pela Activity, não por
 * esta classe — ver HomeActivity.requestStorageAccess()), e a partir
 * daí guardamos a URI dessa árvore com permissão PERSISTENTE
 * (takePersistableUriPermission), para não ter de pedir de novo em
 * cada sessão. Isto evita por completo a necessidade de
 * MANAGE_EXTERNAL_STORAGE (que a Play Store restringe).
 *
 * "path" aqui NUNCA é um caminho de ficheiro real do sistema — é
 * sempre uma URI SAF (content://...) tratada como string opaca. O
 * Svelte só passa esse valor de um lado para o outro (getRootPath ->
 * listFolders -> openFolder -> listFolders...), nunca o interpreta,
 * por isso isto é transparente para ele.
 */
class AndroidStorageBridge(
    private val context: Context,
    private val webView: WebView,
    private val onNeedRootPicker: () -> Unit
) {

    companion object {
        private const val PREFS_NAME = "nexa_storage_prefs"
        private const val KEY_ROOT_URI = "root_tree_uri"
    }

    private fun prefs() = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun getRootUri(): Uri? {
        val raw = prefs().getString(KEY_ROOT_URI, null) ?: return null
        return try { Uri.parse(raw) } catch (e: Exception) { null }
    }

    /**
     * Chamado pela Activity depois do utilizador escolher a pasta no
     * picker do sistema (ACTION_OPEN_DOCUMENT_TREE). Persiste a
     * permissão para sobreviver a reinícios da app.
     */
    fun onRootTreeChosen(treeUri: Uri) {
        try {
            context.contentResolver.takePersistableUriPermission(
                treeUri,
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION or
                    android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            )
        } catch (e: SecurityException) {
            // Se falhar a persistir, ainda fica válida para esta sessão.
        }
        prefs().edit { putString(KEY_ROOT_URI, treeUri.toString()) }
    }

    @JavascriptInterface
    fun hasPermission(): Boolean {
        val uri = getRootUri() ?: return false
        val doc = DocumentFile.fromTreeUri(context, uri)
        return doc != null && doc.canRead() && doc.canWrite()
    }

    @JavascriptInterface
    fun requestPermission() {
        onNeedRootPicker()
    }

    @JavascriptInterface
    fun getRootPath(): String {
        return getRootUri()?.toString() ?: ""
    }

    @JavascriptInterface
    fun listFolders(path: String): String {
        val result = JSONObject()
        try {
            val uri = Uri.parse(path)
            val doc = DocumentFile.fromTreeUri(context, uri) ?: DocumentFile.fromSingleUri(context, uri)
            if (doc == null || !doc.isDirectory) {
                result.put("path", path)
                result.put("folders", JSONArray())
                return result.toString()
            }

            val folders = JSONArray()
            doc.listFiles().forEach { child ->
                if (child.isDirectory) {
                    val entry = JSONObject()
                    entry.put("name", child.name ?: "")
                    entry.put("path", child.uri.toString())
                    folders.put(entry)
                }
            }

            result.put("path", path)
            result.put("folders", folders)
        } catch (e: Exception) {
            result.put("path", path)
            result.put("folders", JSONArray())
        }
        return result.toString()
    }

    @JavascriptInterface
    fun createFolder(path: String, name: String): Boolean {
        return try {
            val uri = Uri.parse(path)
            val doc = DocumentFile.fromTreeUri(context, uri) ?: return false
            doc.createDirectory(name) != null
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Grava o conteúdo já pronto (vindo do Svelte) dentro da pasta de
     * destino. content pode ser texto puro ou base64 — isBase64 diz
     * qual. O Kotlin não interpreta nem converte o conteúdo, apenas
     * grava-o tal como chega, exatamente como combinado: a geração do
     * PDF/DOCX em si é responsabilidade do lado do WebApp.
     *
     * targetPath aqui é a URI da PASTA (não do ficheiro final) — o
     * ficheiro é criado dentro dela com createFile, porque em SAF não
     * se escreve por caminho de string livre, só por URI de documento.
     */
    @JavascriptInterface
    fun exportDocument(
        requestId: Int,
        content: String,
        targetPath: String,
        format: String,
        mode: String,
        isBase64: Boolean
    ) {
        val result = JSONObject()
        try {
            val folderUri = Uri.parse(targetPath)
            val folderDoc = DocumentFile.fromTreeUri(context, folderUri)
                ?: DocumentFile.fromSingleUri(context, folderUri)

            if (folderDoc == null || !folderDoc.isDirectory) {
                result.put("ok", false)
                result.put("error", "Pasta de destino inválida")
                notifyResult(requestId, result)
                return
            }

            val mime = when (format) {
                "pdf" -> "application/pdf"
                "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                else -> "application/octet-stream"
            }
            val fileName = "documento.$format"

            // Remove um ficheiro homónimo anterior, se existir, para
            // não acumular duplicados a cada export.
            folderDoc.findFile(fileName)?.delete()

            val fileDoc = folderDoc.createFile(mime, fileName)
            if (fileDoc == null) {
                result.put("ok", false)
                result.put("error", "Não foi possível criar o ficheiro")
                notifyResult(requestId, result)
                return
            }

            context.contentResolver.openOutputStream(fileDoc.uri)?.use { out ->
                if (isBase64) {
                    val bytes = android.util.Base64.decode(content, android.util.Base64.DEFAULT)
                    out.write(bytes)
                } else {
                    OutputStreamWriter(out, Charsets.UTF_8).use { writer ->
                        writer.write(content)
                    }
                }
            } ?: run {
                result.put("ok", false)
                result.put("error", "Não foi possível abrir o ficheiro para escrita")
                notifyResult(requestId, result)
                return
            }

            result.put("ok", true)
            result.put("path", fileDoc.uri.toString())
        } catch (e: Exception) {
            result.put("ok", false)
            result.put("error", e.message ?: "Erro desconhecido ao exportar")
        }
        notifyResult(requestId, result)
    }

    private fun notifyResult(requestId: Int, result: JSONObject) {
        val escaped = result.toString().replace("\\", "\\\\").replace("'", "\\'")
        webView.post {
            webView.evaluateJavascript(
                "if (window.onNexaExportResult) { window.onNexaExportResult($requestId, '$escaped'); }",
                null
            )
        }
    }
}