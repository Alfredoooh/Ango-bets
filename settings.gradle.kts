pluginManagement {
    includeBuild("${rootDir}/coinbox/node_modules/@react-native/gradle-plugin")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("com.facebook.react.settings")
}

extensions.configure<com.facebook.react.ReactSettingsExtension> {
    autolinkLibrariesFromCommand()
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("${rootDir}/coinbox/node_modules/react-native/android") }
        maven { url = uri("${rootDir}/coinbox/node_modules/jsc-android/dist") }
    }
}

rootProject.name = "nexa"
include(":app")