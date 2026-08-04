package com.nexa.app.util

import android.content.Context
import java.io.File

/**
 * Persiste o conteúdo HTML do editor A4 (tab Edit) em ficheiro local,
 * dentro do diretório privado da app (filesDir). Não usa base de dados
 * porque só existe, por agora, um único documento "de trabalho" — se no
 * futuro for preciso suportar múltiplos documentos, troca-se isto por
 * uma pasta com um ficheiro por id de documento, mantendo a mesma API.
 */
object DocumentStorage {

    private const val FILE_NAME = "editor_document.html"

    private fun file(context: Context): File =
        File(context.applicationContext.filesDir, FILE_NAME)

    /** Lê o HTML guardado, ou null se ainda não existir nada guardado. */
    fun load(context: Context): String? {
        val f = file(context)
        return if (f.exists()) {
            try {
                f.readText(Charsets.UTF_8)
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
    }

    /** Guarda o HTML do documento, substituindo o que existir. */
    fun save(context: Context, html: String) {
        try {
            file(context).writeText(html, Charsets.UTF_8)
        } catch (e: Exception) {
            // Falha silenciosa intencional: perder uma gravação pontual não
            // deve rebentar a UI; o utilizador continua a editar normalmente
            // e a próxima gravação bem sucedida corrige o estado.
        }
    }

    /** Remove o documento guardado (não usado ainda, mas útil ter). */
    fun clear(context: Context) {
        val f = file(context)
        if (f.exists()) f.delete()
    }
}