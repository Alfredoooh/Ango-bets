package com.nexa.app

import android.app.Application
import com.nexa.app.session.ThemePreference

/**
 * Aplica o tema guardado (dark/light/system) assim que o processo arranca,
 * antes de qualquer Activity fazer onCreate(). Sem isto, a primeira Activity
 * a abrir podia ainda usar o modo do sistema por uma fração de segundo antes
 * do próprio onCreate() da Activity reforçar a escolha.
 */
class NexaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ThemePreference.applyStoredTheme(this)
    }
}