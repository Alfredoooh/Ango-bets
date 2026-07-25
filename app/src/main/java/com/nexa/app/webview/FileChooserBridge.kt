// app/src/main/java/com/nexa/app/webview/FileChooserBridge.kt
package com.nexa.app.webview

import android.net.Uri
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import androidx.appcompat.app.AppCompatActivity
import com.nexa.app.gallery.GalleryBottomSheet

/**
 * Liga o onShowFileChooser do WebView (chamado quando o WebApp faz
 * <input type="file" accept="image/*">) à galeria Fluent própria, com
 * fallback automático para o Photo Picker do sistema (registado pela
 * HomeActivity via ActivityResultContracts.PickMultipleVisualMedia).
 */
class FileChooserBridge(
    private val activity: AppCompatActivity,
    private val onNeedSystemPicker: (multiSelect: Boolean, callback: ValueCallback<Array<Uri>>) -> Unit
) {

    fun handleShowFileChooser(
        filePathCallback: ValueCallback<Array<Uri>>,
        fileChooserParams: WebChromeClient.FileChooserParams
    ): Boolean {
        val multiSelect = fileChooserParams.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE

        GalleryBottomSheet.show(
            activity = activity,
            multiSelect = multiSelect,
            onFallbackToSystemPicker = {
                onNeedSystemPicker(multiSelect, filePathCallback)
            },
            onPicked = { uris ->
                filePathCallback.onReceiveValue(uris.toTypedArray())
            },
            onCancelled = {
                filePathCallback.onReceiveValue(null)
            }
        )
        return true
    }
}