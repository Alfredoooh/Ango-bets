// app/src/main/java/com/nexa/app/docexport/PdfBuilder.kt
package com.nexa.app.docexport

import android.content.Context
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File
import java.io.FileOutputStream
import java.io.ParcelFileDescriptor

/**
 * Gera um .pdf real a partir do HTML do documento, usando o próprio motor
 * do WebView (Blink) para o layout — garante fidelidade visual com o que
 * o utilizador vê no editor (fontes, cores, tabelas, imagens), em vez de
 * tentar recriar o layout manualmente com Canvas.
 *
 * Usa WebView.createPrintDocumentAdapter(), que é a API pública do
 * Android para "imprimir para PDF" — aqui redirecionamos a escrita para
 * um ficheiro em vez de abrir a caixa de diálogo de impressão do sistema.
 */
object PdfBuilder {

    fun build(context: Context, outputFile: File, fullHtmlDocument: String, onDone: (Boolean) -> Unit) {
        val webView = WebView(context)
        webView.settings.javaScriptEnabled = false

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                printToFile(view, outputFile, onDone)
            }
        }

        webView.loadDataWithBaseURL(null, fullHtmlDocument, "text/html", "UTF-8", null)
    }

    private fun printToFile(webView: WebView, outputFile: File, onDone: (Boolean) -> Unit) {
        val adapter = webView.createPrintDocumentAdapter("nexa_doc")
        val attributes = PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setResolution(android.print.PrintAttributes.Resolution("pdf", "pdf", 300, 300))
            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
            .build()

        adapter.onLayout(null, attributes, null, object : PrintDocumentAdapter.LayoutResultCallback() {
            override fun onLayoutFinished(info: PrintDocumentInfo?, changed: Boolean) {
                try {
                    val pfd = ParcelFileDescriptor.open(
                        outputFile,
                        ParcelFileDescriptor.MODE_CREATE or ParcelFileDescriptor.MODE_TRUNCATE or ParcelFileDescriptor.MODE_READ_WRITE
                    )
                    adapter.onWrite(
                        arrayOf(PageRange.ALL_PAGES),
                        pfd,
                        null,
                        object : PrintDocumentAdapter.WriteResultCallback() {
                            override fun onWriteFinished(pages: Array<out PageRange>?) {
                                pfd.close()
                                onDone(true)
                            }
                            override fun onWriteFailed(error: CharSequence?) {
                                onDone(false)
                            }
                        }
                    )
                } catch (e: Exception) {
                    onDone(false)
                }
            }
            override fun onLayoutFailed(error: CharSequence?) {
                onDone(false)
            }
        }, null)
    }

    /**
     * Envolve o HTML das páginas (mesmo formato de DocPage.getContent(),
     * separado por page-break-marker) num documento HTML completo com
     * estilos equivalentes ao editor, para o WebView renderizar como PDF.
     */
    fun wrapPagesAsHtmlDocument(pagesHtml: String): String {
        val pages = pagesHtml.split("<div class=\"page-break-marker\"></div>")
        val pagesBlocks = pages.joinToString("") { page ->
            "<div class=\"pdf-page\">$page</div>"
        }
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                * { box-sizing: border-box; }
                body { margin: 0; font-family: -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; }
                .pdf-page { padding: 40px 48px; page-break-after: always; }
                p { margin: 0 0 4px 0; }
                table.doc-table { border-collapse: collapse; width: 100%; margin: 4px 0; }
                table.doc-table td { border: 1px solid #d0d0d0; padding: 8px; vertical-align: top; }
                a { color: #2F7BF6; text-decoration: underline; }
                .doc-img-wrap img { max-width: 100%; height: auto; }
                .footnote-ref { color: #2F7BF6; }
              </style>
            </head>
            <body>
              $pagesBlocks
            </body>
            </html>
        """.trimIndent()
    }
}