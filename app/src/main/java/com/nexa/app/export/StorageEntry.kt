// app/src/main/java/com/nexa/app/export/StorageEntry.kt
package com.nexa.app.export

import java.io.File

/**
 * Representa uma pasta ou ficheiro dentro do armazenamento real do
 * telemóvel, para a listagem da FolderPickerActivity.
 */
data class StorageEntry(
    val file: File,
    val name: String,
    val isDirectory: Boolean
)

object StorageBrowser {

    fun rootDir(): File = android.os.Environment.getExternalStorageDirectory()

    fun list(dir: File): List<StorageEntry> {
        val children = dir.listFiles() ?: return emptyList()
        return children
            .filter { !it.name.startsWith(".") }
            .sortedWith(compareBy({ !it.isDirectory }, { it.name.lowercase() }))
            .map { StorageEntry(it, it.name, it.isDirectory) }
    }

    fun createFolder(parent: File, name: String): Boolean {
        val target = File(parent, name)
        return target.mkdirs()
    }
}