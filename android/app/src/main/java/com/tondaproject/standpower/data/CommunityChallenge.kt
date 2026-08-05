package com.tondaproject.standpower.data

data class CommunityChallenge(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val xpReward: Int = 0,
    val durationDays: Int = 30,
    val participantCount: Int = 0,
    val isJoined: Boolean = false
)
