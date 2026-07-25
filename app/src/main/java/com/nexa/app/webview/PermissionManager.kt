// app/src/main/java/com/nexa/app/webview/PermissionManager.kt
package com.nexa.app.webview

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.webkit.PermissionRequest
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Traduz pedidos de permissão do WebView (câmara/microfone para
 * chamadas/gravação dentro do WebApp) para o fluxo nativo de permissões,
 * passando primeiro por um modal "estilo navegador completo"
 * (BrowserPermissionDialog) antes de decidir conceder ou negar — replica
 * o comportamento visível em Chrome/Edge quando um site pede acesso a
 * dispositivos.
 */
object PermissionManager {

    private const val REQUEST_CODE = 4321

    fun handle(activity: Activity, request: PermissionRequest) {
        val needsCamera = request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
        val needsMic = request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)

        if (!needsCamera && !needsMic) {
            request.deny()
            return
        }

        val kind = when {
            needsCamera && needsMic -> BrowserPermissionDialog.DeviceKind.BOTH
            needsCamera -> BrowserPermissionDialog.DeviceKind.CAMERA
            else -> BrowserPermissionDialog.DeviceKind.MICROPHONE
        }

        BrowserPermissionDialog.show(activity, kind) { allowed ->
            if (!allowed) {
                request.deny()
                return@show
            }

            val missing = mutableListOf<String>()
            if (needsCamera && ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                missing.add(Manifest.permission.CAMERA)
            }
            if (needsMic && ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                missing.add(Manifest.permission.RECORD_AUDIO)
            }

            if (missing.isNotEmpty()) {
                ActivityCompat.requestPermissions(activity, missing.toTypedArray(), REQUEST_CODE)
            }
            request.grant(request.resources)
        }
    }
}