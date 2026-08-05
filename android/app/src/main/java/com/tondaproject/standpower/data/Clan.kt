package com.tondaproject.standpower.data

data class Clan(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val tag: String = "",
    val totalXp: Int = 0,
    val rank: Int = 1,
    val membersCount: Int = 1,
    val members: List<ClanMember> = emptyList()
)

data class ClanMember(
    val userId: String = "",
    val username: String = "",
    val role: String = "Soldat", // Chef, Officier, Soldat
    val contributedXp: Int = 0
)

data class ClanCompetition(
    val id: String = "",
    val title: String = "",
    val activeClanIdA: String = "",
    val activeClanIdB: String = "",
    val xpClanA: Int = 0,
    val xpClanB: Int = 0,
    val timeLeft: String = "",
    val rewardDescription: String = ""
)
