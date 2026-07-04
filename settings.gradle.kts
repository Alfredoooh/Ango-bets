pluginManagement {
    includeBuild("coinbox/node_modules/@react-native/gradle-plugin")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("com.facebook.react.settings")
}

configure<com.facebook.react.ReactSettingsExtension> {
    autolinkLibrariesFromCommand(
        workingDirectory = file("coinbox"),
        lockFiles = files(
            "coinbox/package-lock.json"
        )
    )
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("coinbox/node_modules/react-native/android") }
        maven { url = uri("coinbox/node_modules/jsc-android/dist") }
    }
}

rootProject.name = "nexa"
include(":app")