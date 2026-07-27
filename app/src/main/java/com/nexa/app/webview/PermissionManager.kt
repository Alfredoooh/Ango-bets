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
 *
 * CORRIGIDO: antes, request.grant() era chamado logo a seguir a
 * ActivityCompat.requestPermissions(), sem esperar pelo resultado real
 * do popup do sistema — isto fazia o WebView pensar que tinha acesso
 * mesmo que o utilizador ainda não tivesse respondido, ou tivesse
 * negado. Agora o pedido fica pendente (pendingRequest/pendingGrantList)
 * e só é resolvido (grant ou deny) quando HomeActivity.onRequestPermissionsResult
 * efetivamente chamar resolvePendingResult() com a resposta real do
 * utilizador.
 */
object PermissionManager {

    const val REQUEST_CODE = 4321

    private var pendingRequest: PermissionRequest? = null
    private var pendingGrantList: Array<String> = emptyArray()

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

            if (missing.isEmpty()) {
                // Já tínhamos tudo o que era preciso — pode conceder já.
                request.grant(request.resources)
                return@show
            }

            // Fica pendente: só resolvemos no callback real do sistema,
            // em HomeActivity.onRequestPermissionsResult.
            pendingRequest = request
            pendingGrantList = request.resources
            ActivityCompat.requestPermissions(activity, missing.toTypedArray(), REQUEST_CODE)
        }
    }

    /**
     * Chamado pela Activity a partir de onRequestPermissionsResult.
     * Só aqui, com a resposta REAL do utilizador ao popup do sistema,
     * é que decidimos grant() ou deny() do pedido do WebView.
     */
    fun resolvePendingResult(requestCode: Int, grantResults: IntArray) {
        if (requestCode != REQUEST_CODE) return
        val request = pendingRequest ?: return
        pendingRequest = null

        val allGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
        if (allGranted) {
            request.grant(pendingGrantList)
        } else {
            request.deny()
        }
        pendingGrantList = emptyArray()
    }
}