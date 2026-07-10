// app/src/main/java/com/nexa/app/webview/PermissionManager.kt
package com.nexa.app.webview

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

/**
 * Verifica permissões runtime necessárias para o WebView usar câmera,
 * microfone e seletor de ficheiros/galeria. minSdk é 24, ou seja, todas
 * as permissões abaixo são SEMPRE runtime (API 23+ já exige pedido em
 * tempo de execução, não basta declarar no Manifest).
 */
object PermissionManager {

    fun hasCameraPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED

    fun hasAudioPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED

    /**
     * Storage/galeria: o nome da permissão certa muda conforme a versão do
     * Android. Em API 33+ (Tiramisu) usa-se READ_MEDIA_IMAGES/VIDEO em vez
     * da antiga READ_EXTERNAL_STORAGE, que deixou de dar acesso a mídia
     * nessas versões.
     */
    fun hasMediaPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val images = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_IMAGES) ==
                PackageManager.PERMISSION_GRANTED
            val video = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_VIDEO) ==
                PackageManager.PERMISSION_GRANTED
            images || video
        } else {
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) ==
                PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Lista de permissões a pedir de uma vez para cobrir upload de galeria
     * (input file simples) — câmera é pedida à parte, só quando o próprio
     * chooser do sistema for abrir a app de câmera.
     */
    fun mediaPermissionsToRequest(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VIDEO
            )
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    fun cameraAndAudioPermissionsToRequest(): Array<String> {
        return arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
    }
}