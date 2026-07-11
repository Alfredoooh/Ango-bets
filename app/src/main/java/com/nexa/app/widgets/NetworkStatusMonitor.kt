// app/src/main/java/com/nexa/app/widgets/NetworkStatusMonitor.kt
package com.nexa.app.widgets

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Handler
import android.os.Looper

/**
 * Observa o estado da ligação à internet e chama onOffline()/onOnline()
 * sempre que houver mudança — usado para mostrar "Sem ligação à internet"
 * e "Ligação restabelecida" na BottomSnackbar, tal como o YouTube faz.
 */
class NetworkStatusMonitor(
    private val context: Context,
    private val onOffline: () -> Unit,
    private val onOnline: () -> Unit
) {
    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private val mainHandler = Handler(Looper.getMainLooper())

    private var wasOffline = false
    private var hasEmittedOnce = false

    private val callback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            mainHandler.post {
                if (wasOffline && hasEmittedOnce) {
                    onOnline()
                }
                wasOffline = false
                hasEmittedOnce = true
            }
        }

        override fun onLost(network: Network) {
            mainHandler.post {
                if (!isCurrentlyConnected()) {
                    wasOffline = true
                    hasEmittedOnce = true
                    onOffline()
                }
            }
        }
    }

    private fun isCurrentlyConnected(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun start() {
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, callback)
    }

    fun stop() {
        try {
            connectivityManager.unregisterNetworkCallback(callback)
        } catch (e: Exception) {
            // já estava desregistado
        }
    }
}