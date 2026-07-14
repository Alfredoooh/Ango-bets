// app/src/main/java/com/nexa/app/docexport/DocxBuilder.kt
package com.nexa.app.docexport

import android.util.Base64
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import org.jsoup.nodes.Node
import org.jsoup.nodes.TextNode
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * Gera um ficheiro .docx real (Office Open XML) a partir do HTML produzido
 * por DocPage.svelte (getContent(), que devolve o innerHTML de cada folha
 * separado por <div class="page-break-marker"></div>).
 *
 * Cobre: parágrafos, negrito/itálico/sublinhado, cor de texto inline
 * (style="color:#..."), links <a href>, imagens <img src="data:..."> em
 * base64 embutidas como relationship de imagem, e tabelas <table class=
 * "doc-table">. Não é um conversor genérico de HTML — cobre exatamente o
 * subconjunto de markup que o editor produz.
 */
object DocxBuilder {

    private var imageRelCounter = 1
    private var imageIdCounter = 1000

    fun build(outputFile: File, pagesHtml: String) {
        imageRelCounter = 1
        imageIdCounter = 1000

        val pages = pagesHtml.split("<div class=\"page-break-marker\"></div>")
        val imageParts = mutableListOf<ImagePart>()
        val bodyXml = StringBuilder()

        pages.forEachIndexed { index, pageHtml ->
            val doc = Jsoup.parseBodyFragment(pageHtml)
            for (child in doc.body().children()) {
                bodyXml.append(elementToXml(child, imageParts))
            }
            if (index < pages.size - 1) {
                bodyXml.append("<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>")
            }
        }

        writeZip(outputFile, bodyXml.toString(), imageParts)
    }

    private data class ImagePart(val relId: String, val fileName: String, val bytes: ByteArray)

    private fun elementToXml(el: Element, imageParts: MutableList<ImagePart>): String {
        return when (el.tagName()) {
            "p", "div" -> paragraphToXml(el, imageParts)
            "table" -> tableToXml(el, imageParts)
            else -> paragraphToXml(el, imageParts)
        }
    }

    private fun paragraphToXml(el: Element, imageParts: MutableList<ImagePart>): String {
        val runs = StringBuilder()
        collectRuns(el, runs, imageParts, bold = false, italic = false, underline = false, color = null)
        if (runs.isEmpty()) return "<w:p/>"
        return "<w:p>$runs</w:p>"
    }

    private fun collectRuns(
        node: Node,
        out: StringBuilder,
        imageParts: MutableList<ImagePart>,
        bold: Boolean,
        italic: Boolean,
        underline: Boolean,
        color: String?
    ) {
        for (child in node.childNodes()) {
            when (child) {
                is TextNode -> {
                    val text = child.text()
                    if (text.isNotEmpty()) {
                        out.append(textRunXml(text, bold, italic, underline, color))
                    }
                }
                is Element -> {
                    when (child.tagName()) {
                        "b", "strong" -> collectRuns(child, out, imageParts, true, italic, underline, color)
                        "i", "em" -> collectRuns(child, out, imageParts, bold, true, underline, color)
                        "u" -> collectRuns(child, out, imageParts, bold, italic, true, color)
                        "a" -> {
                            val href = child.attr("href")
                            collectRuns(child, out, imageParts, bold, italic, true, "2F7BF6")
                        }
                        "sup" -> {
                            val text = child.text()
                            out.append(textRunXml(text, bold, italic, underline, color, superscript = true))
                        }
                        "span" -> {
                            val styleColor = extractColor(child.attr("style")) ?: color
                            if (child.hasClass("doc-img-wrap")) {
                                val img = child.selectFirst("img")
                                if (img != null) {
                                    out.append(imageRunXml(img, imageParts))
                                }
                            } else {
                                collectRuns(child, out, imageParts, bold, italic, underline, styleColor)
                            }
                        }
                        "br" -> out.append("<w:r><w:br/></w:r>")
                        else -> collectRuns(child, out, imageParts, bold, italic, underline, color)
                    }
                }
            }
        }
    }

    private fun extractColor(style: String): String? {
        val match = Regex("color:\\s*#?([0-9a-fA-F]{6})").find(style) ?: return null
        return match.groupValues[1]
    }

    private fun textRunXml(
        text: String,
        bold: Boolean,
        italic: Boolean,
        underline: Boolean,
        color: String?,
        superscript: Boolean = false
    ): String {
        val escaped = escapeXml(text)
        val props = StringBuilder("<w:rPr>")
        if (bold) props.append("<w:b/>")
        if (italic) props.append("<w:i/>")
        if (underline) props.append("<w:u w:val=\"single\"/>")
        if (color != null) props.append("<w:color w:val=\"$color\"/>")
        if (superscript) props.append("<w:vertAlign w:val=\"superscript\"/>")
        props.append("</w:rPr>")
        return "<w:r>$props<w:t xml:space=\"preserve\">$escaped</w:t></w:r>"
    }

    private fun imageRunXml(img: Element, imageParts: MutableList<ImagePart>): String {
        val src = img.attr("src")
        if (!src.startsWith("data:")) return ""

        val base64Data = src.substringAfter(",", "")
        val bytes = try {
            Base64.decode(base64Data, Base64.DEFAULT)
        } catch (e: Exception) {
            return ""
        }

        val widthPx = img.attr("style").let {
            Regex("width:\\s*(\\d+)px").find(it)?.groupValues?.get(1)?.toIntOrNull()
        } ?: 220

        val relId = "rIdImg${imageRelCounter++}"
        val fileName = "image${imageIdCounter}.png"
        val docPrId = imageIdCounter++
        imageParts.add(ImagePart(relId, fileName, bytes))

        val emuWidth = widthPx * 9525
        val emuHeight = (widthPx * 0.75).toInt() * 9525

        return """
            <w:r><w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0">
                <wp:extent cx="$emuWidth" cy="$emuHeight"/>
                <wp:docPr id="$docPrId" name="Picture$docPrId"/>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:nvPicPr>
                        <pic:cNvPr id="$docPrId" name="Picture$docPrId"/>
                        <pic:cNvPicPr/>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="$relId" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                        <a:stretch><a:fillRect/></a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm><a:off x="0" y="0"/><a:ext cx="$emuWidth" cy="$emuHeight"/></a:xfrm>
                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing></w:r>
        """.trimIndent()
    }

    private fun tableToXml(table: Element, imageParts: MutableList<ImagePart>): String {
        val rows = table.select("tr")
        if (rows.isEmpty()) return ""
        val colCount = rows.first()!!.select("td, th").size
        val colWidth = 9000 / maxOf(colCount, 1)

        val xml = StringBuilder("<w:tbl><w:tblPr><w:tblW w:w=\"9000\" w:type=\"dxa\"/><w:tblBorders>")
        listOf("top", "left", "bottom", "right", "insideH", "insideV").forEach {
            xml.append("<w:$it w:val=\"single\" w:sz=\"4\" w:color=\"D0D0D0\"/>")
        }
        xml.append("</w:tblBorders></w:tblPr>")
        xml.append("<w:tblGrid>")
        repeat(colCount) { xml.append("<w:gridCol w:w=\"$colWidth\"/>") }
        xml.append("</w:tblGrid>")

        for (row in rows) {
            xml.append("<w:tr>")
            for (cell in row.select("td, th")) {
                xml.append("<w:tc><w:tcPr><w:tcW w:w=\"$colWidth\" w:type=\"dxa\"/></w:tcPr>")
                xml.append(paragraphToXml(cell, imageParts))
                xml.append("</w:tc>")
            }
            xml.append("</w:tr>")
        }
        xml.append("</w:tbl>")
        return xml.toString()
    }

    private fun escapeXml(text: String): String {
        return text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;")
    }

    private fun writeZip(outputFile: File, bodyXml: String, imageParts: List<ImagePart>) {
        FileOutputStream(outputFile).use { fos ->
            ZipOutputStream(fos).use { zip ->
                writeEntry(zip, "[Content_Types].xml", contentTypesXml(imageParts))
                writeEntry(zip, "_rels/.rels", rootRelsXml())
                writeEntry(zip, "word/_rels/document.xml.rels", documentRelsXml(imageParts))
                writeEntry(zip, "word/document.xml", documentXml(bodyXml))
                for (part in imageParts) {
                    writeEntry(zip, "word/media/${part.fileName}", part.bytes)
                }
            }
        }
    }

    private fun writeEntry(zip: ZipOutputStream, name: String, content: String) {
        writeEntry(zip, name, content.toByteArray(Charsets.UTF_8))
    }

    private fun writeEntry(zip: ZipOutputStream, name: String, bytes: ByteArray) {
        zip.putNextEntry(ZipEntry(name))
        zip.write(bytes)
        zip.closeEntry()
    }

    private fun contentTypesXml(imageParts: List<ImagePart>): String {
        return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
              <Default Extension="png" ContentType="image/png"/>
              <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
            </Types>""".trimIndent()
    }

    private fun rootRelsXml(): String {
        return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
              <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
            </Relationships>""".trimIndent()
    }

    private fun documentRelsXml(imageParts: List<ImagePart>): String {
        val rels = imageParts.joinToString("\n") { part ->
            "<Relationship Id=\"${part.relId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"media/${part.fileName}\"/>"
        }
        return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
              $rels
            </Relationships>""".trimIndent()
    }

    private fun documentXml(bodyXml: String): String {
        return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
              <w:body>
                $bodyXml
                <w:sectPr>
                  <w:pgSz w:w="11906" w:h="16838"/>
                  <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
                </w:sectPr>
              </w:body>
            </w:document>""".trimIndent()
    }
}