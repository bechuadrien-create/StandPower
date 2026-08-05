package com.tondaproject.standpower.data

import androidx.compose.ui.graphics.Color

enum class Mood(val color: Color, val iconName: String, val titleFr: String, val descFr: String) {
    AGGRESSIVE(Color(0xFFFF5722), "Flame", "AGRESSIF", "Intensité maximale pour repousser vos limites."),
    ENDURANCE(Color(0xFF4CAF50), "DirectionsRun", "ENDURANCE", "Effort prolongé pour brûler et stabiliser."),
    STRENGTH(Color(0xFF2196F3), "FitnessCenter", "FORCE", "Exercices explosifs de puissance musculaire.")
}

enum class SportType(val titleFr: String) {
    BOXE("BOXE SHADOW"),
    MMA("MMA COMBAT"),
    MUSCULATION("MUSCULATION CYBER")
}

data class Exercise(
    val name: String,
    val sets: Int,
    val repsOrDurationSec: Int,
    val isDurationBased: Boolean = false,
    val iconName: String = "FitnessCenter"
)
