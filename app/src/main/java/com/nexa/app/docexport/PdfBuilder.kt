// app/src/main/java/com/nexa/app/docexport/PdfBuilder.kt
package com.nexa.app.docexport

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.pdf.PdfDocument
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File
import java.io.FileOutputStream

/**
 * Gera um .pdf real a partir do HTML do documento, usando o próprio motor
 * do WebView (Blink) para o layout — garante fidelidade visual com o que
 * o utilizador vê no editor (fontes, cores, tabelas, imagens), em vez de
 * tentar recriar o layout manualmente com Canvas a partir do zero.
 *
 * Em vez de WebView.createPrintDocumentAdapter() (cujas classes de
 * callback do Android SDK têm construtor package-private e não podem
 * ser sub-classificadas fora do package android.print), esta versão
 * renderiza o próprio WebView para um Bitmap por página A4 e compõe
 * o PDF diretamente com android.graphics.pdf.PdfDocument.
 */
object PdfBuilder {

    // Dimensões A4 a 300 DPI (aprox.): 210mm x 297mm
    private const val A4_WIDTH_PT = 595  // pontos (72 dpi), tamanho padrão de página PDF
    private const val A4_HEIGHT_PT = 842

    fun build(context: Context, outputFile: File, fullHtmlDocument: String, onDone: (Boolean) -> Unit) {
        val webView = WebView(context)
        webView.settings.javaScriptEnabled = false

        // Layout do WebView com a largura de uma página A4 (escalado para pixels de alta resolução)
        val scale = 2 // fator de nitidez (equivalente a ~144 dpi)
        val widthPx = A4_WIDTH_PT * scale
        val heightPx = A4_HEIGHT_PT * scale

        webView.layout(0, 0, widthPx, heightPx)

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                try {
                    renderToPdf(view, widthPx, heightPx, scale, outputFile)
                    onDone(true)
                } catch (e: Exception) {
                    onDone(false)
                }
            }
        }

        webView.loadDataWithBaseURL(null, fullHtmlDocument, "text/html", "UTF-8", null)
    }

    private fun renderToPdf(webView: WebView, widthPx: Int, heightPx: Int, scale: Int, outputFile: File) {
        val totalContentHeight = webView.contentHeight * scale
        val pageCount = maxOf(1, Math.ceil(totalContentHeight.toDouble() / heightPx).toInt())

        val pdfDocument = PdfDocument()

        for (pageIndex in 0 until pageCount) {
            val pageInfo = PdfDocument.PageInfo.Builder(A4_WIDTH_PT, A4_HEIGHT_PT, pageIndex + 1).create()
            val page = pdfDocument.startPage(pageInfo)

            val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
            val bitmapCanvas = Canvas(bitmap)
            bitmapCanvas.translate(0f, -(pageIndex * heightPx).toFloat())
            webView.draw(bitmapCanvas)

            val pdfCanvas = page.canvas
            val srcRect = android.graphics.Rect(0, 0, widthPx, heightPx)
            val dstRect = android.graphics.Rect(0, 0, A4_WIDTH_PT, A4_HEIGHT_PT)
            pdfCanvas.drawBitmap(bitmap, srcRect, dstRect, null)
            bitmap.recycle()

            pdfDocument.finishPage(page)
        }

        FileOutputStream(outputFile).use { out ->
            pdfDocument.writeTo(out)
        }
        pdfDocument.close()
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