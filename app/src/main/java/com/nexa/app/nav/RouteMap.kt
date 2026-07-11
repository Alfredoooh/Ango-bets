// app/src/main/java/com/nexa/app/nav/RouteMap.kt
package com.nexa.app.nav

/**
 * Apenas a informação mínima sobre o host da WebApp. Já não existe mapa de
 * rotas nem lógica de navegação nativa — o WebView carrega BASE_URL uma
 * única vez e é o próprio WebApp (Svelte) que trata de todas as rotas,
 * menus e ecrãs internamente, tal como aconteceria num browser normal.
 */
object RouteMap {

    const val HOST = "mobilewebin.onrender.com"
    const val BASE_URL = "https://$HOST/"
}