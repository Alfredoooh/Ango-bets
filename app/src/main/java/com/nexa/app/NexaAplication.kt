package com.nexa.app

import android.app.Application
import com.nexa.app.util.ThemePreferenceManager

class NexaApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Aplica o modo de tema guardado (Claro/Escuro/Automático) o mais
        // cedo possível no ciclo de vida do processo, antes de qualquer
        // Activity ser criada, para evitar qualquer flash do tema errado.
        ThemePreferenceManager.applyStoredTheme(this)
    }
}