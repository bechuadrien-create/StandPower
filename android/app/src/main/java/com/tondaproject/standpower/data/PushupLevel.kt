package com.tondaproject.standpower.data

import androidx.compose.ui.graphics.Color

data class PushupLevel(
    val level: Int,
    val minReps: Int,
    val maxReps: Int,
    val badgeName: String,
    val iconName: String, // Symbol representation (e.g., "Trophy", "Shield", "Bolt", "Flame", "Star", "Crown")
    val rewardXP: Int,
    val badgeColor: Color
)

val pushupLevels = listOf(
    PushupLevel(
        level = 1, minReps = 0, maxReps = 10, badgeName = "Novice de la Force", iconName = "Trophy", rewardXP = 10,
        badgeColor = Color(0xFF9E9E9E)
    ),
    PushupLevel(
        level = 2, minReps = 10, maxReps = 20, badgeName = "Apprenti Combattant", iconName = "Shield", rewardXP = 25,
        badgeColor = Color(0xFF2196F3)
    ),
    PushupLevel(
        level = 3, minReps = 20, maxReps = 50, badgeName = "Guerrier de Bronze", iconName = "Bolt", rewardXP = 50,
        badgeColor = Color(0xFF4CAF50)
    ),
    PushupLevel(
        level = 4, minReps = 50, maxReps = 100, badgeName = "Athlète d'Argent", iconName = "Flame", rewardXP = 100,
        badgeColor = Color(0xFFFFEB3B)
    ),
    PushupLevel(
        level = 5, minReps = 100, maxReps = 200, badgeName = "Maître Spécialiste", iconName = "Star", rewardXP = 200,
        badgeColor = Color(0xFF9C27B0)
    ),
    PushupLevel(
        level = 6, minReps = 200, maxReps = 500, badgeName = "Légende de l'Octogone", iconName = "Crown", rewardXP = 500,
        badgeColor = Color(0xFF00FFFF)
    ),
    PushupLevel(
        level = 7, minReps = 500, maxReps = 100000, badgeName = "Cyber Champion Suprême", iconName = "ElectricBolt", rewardXP = 1000,
        badgeColor = Color(0xFFFF2E93)
    )
)
