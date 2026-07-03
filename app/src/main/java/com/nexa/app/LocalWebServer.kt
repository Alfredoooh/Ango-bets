package com.nexa.app

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import java.io.IOException
import java.io.InputStream

/**
 * Servidor HTTP local que serve os ficheiros estáticos já compilados
 * do Svelte/Vite (localizados em assets/www dentro do APK, gerados
 * automaticamente pela task Gradle copySvelteBuild durante o build).
 *
 * Isto substitui o carregamento via file:///android_asset/, que tem
 * problemas com módulos ES (type="module"), import/export relativos
 * e fetch() para caminhos absolutos ("/src/main.js"). Servindo via
 * http://127.0.0.1:PORT/ tudo isso funciona exatamente como num
 * servidor real, 100% offline (loopback local, sem rede externa).
 */
class LocalWebServer(
    private val context: Context,
    port: Int = 8080
) : NanoHTTPD(port) {

    private val assetRoot = "www"

    override fun serve(session: IHTTPSession): Response {
        var uri = session.uri ?: "/"

        if (uri == "/") {
            uri = "/index.html"
        }

        // Tenta servir o ficheiro pedido; se não existir e não tiver
        // extensão (rota de SPA tipo /home, /music), cai para o
        // index.html dessa mesma pasta, ou para o index.html raiz.
        val candidatePaths = buildList {
            add("$assetRoot$uri")
            if (!uri.substringAfterLast('/').contains('.')) {
                add("$assetRoot${uri.trimEnd('/')}/index.html")
                add("$assetRoot/index.html")
            }
        }

        for (path in candidatePaths) {
            try {
                val stream = context.assets.open(path)
                val mime = mimeTypeFor(path)
                return newChunkedResponse(Response.Status.OK, mime, stream)
            } catch (e: IOException) {
                // tenta o próximo candidato
            }
        }

        return newFixedLengthResponse(
            Response.Status.NOT_FOUND,
            "text/plain",
            "404 Not Found: $uri"
        )
    }

    private fun mimeTypeFor(path: String): String {
        return when {
            path.endsWith(".html") -> "text/html"
            path.endsWith(".js") || path.endsWith(".mjs") -> "application/javascript"
            path.endsWith(".css") -> "text/css"
            path.endsWith(".json") -> "application/json"
            path.endsWith(".svg") -> "image/svg+xml"
            path.endsWith(".png") -> "image/png"
            path.endsWith(".jpg") || path.endsWith(".jpeg") -> "image/jpeg"
            path.endsWith(".webp") -> "image/webp"
            path.endsWith(".woff") -> "font/woff"
            path.endsWith(".woff2") -> "font/woff2"
            path.endsWith(".ttf") -> "font/ttf"
            path.endsWith(".ico") -> "image/x-icon"
            path.endsWith(".wasm") -> "application/wasm"
            else -> "application/octet-stream"
        }
    }

    fun startServer() {
        try {
            start(SOCKET_READ_TIMEOUT, false)
        } catch (e: IOException) {
            throw RuntimeException("Não foi possível iniciar o servidor local na porta ${listeningPort}", e)
        }
    }

    fun stopServer() {
        stop()
    }
}