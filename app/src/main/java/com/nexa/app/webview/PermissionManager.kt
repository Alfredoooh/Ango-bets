package com.nexa.app.webview

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.webkit.PermissionRequest
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Traduz pedidos de permissão do WebView (câmara/microfone para
 * chamadas/gravação dentro do WebApp) para o fluxo nativo de permissões.
 */
object PermissionManager {

    private const val REQUEST_CODE = 4321

    fun handle(activity: Activity, request: PermissionRequest) {
        val needsCamera = request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
        val needsMic = request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)

        val missing = mutableListOf<String>()
        if (needsCamera && ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            missing.add(Manifest.permission.CAMERA)
        }
        if (needsMic && ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            missing.add(Manifest.permission.RECORD_AUDIO)
        }

        if (missing.isEmpty()) {
            request.grant(request.resources)
        } else {
            ActivityCompat.requestPermissions(activity, missing.toTypedArray(), REQUEST_CODE)
            request.grant(request.resources)
        }
    }
}