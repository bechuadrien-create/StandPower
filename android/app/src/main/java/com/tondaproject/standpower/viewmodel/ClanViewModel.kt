package com.tondaproject.standpower.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.firestore.FirebaseFirestore
import com.tondaproject.standpower.data.Clan
import com.tondaproject.standpower.data.ClanMember
import com.tondaproject.standpower.data.ClanCompetition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class ClanViewModel(application: Application) : AndroidViewModel(application) {

    private val firestore = FirebaseFirestore.getInstance()

    private val _clans = MutableStateFlow<List<Clan>>(emptyList())
    val clans: StateFlow<List<Clan>> = _clans.asStateFlow()

    private val _activeClan = MutableStateFlow<Clan?>(null)
    val activeClan: StateFlow<Clan?> = _activeClan.asStateFlow()

    private val _competitions = MutableStateFlow<List<ClanCompetition>>(emptyList())
    val competitions: StateFlow<List<ClanCompetition>> = _competitions.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    init {
        loadClansAndCompetitions()
    }

    fun loadClansAndCompetitions() {
        _isSyncing.value = true
        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Fetch clans from Firestore or seed them
                val clansSnapshot = firestore.collection("clans").get().await()
                val loadedClans = clansSnapshot.documents.mapNotNull { doc ->
                    val id = doc.id
                    val name = doc.getString("name") ?: ""
                    val description = doc.getString("description") ?: ""
                    val tag = doc.getString("tag") ?: ""
                    val totalXp = doc.getLong("totalXp")?.toInt() ?: 0
                    val rank = doc.getLong("rank")?.toInt() ?: 1
                    val membersCount = doc.getLong("membersCount")?.toInt() ?: 1
                    
                    val membersList = mutableListOf<ClanMember>()
                    val membersRaw = doc.get("members") as? List<Map<String, Any>>
                    membersRaw?.forEach { m ->
                        membersList.add(ClanMember(
                            userId = m["userId"] as? String ?: "",
                            username = m["username"] as? String ?: "CyberAthlète",
                            role = m["role"] as? String ?: "Soldat",
                            contributedXp = (m["contributedXp"] as? Long)?.toInt() ?: 0
                        ))
                    }
                    if (membersList.isEmpty()) {
                        membersList.add(ClanMember("system_bot", "CyberBot", "Officier", 1200))
                    }

                    Clan(id, name, description, tag, totalXp, rank, membersCount, membersList)
                }

                if (loadedClans.isNotEmpty()) {
                    _clans.value = loadedClans
                } else {
                    seedDefaultClans()
                }

                // Fetch competitions from Firestore or seed them
                val compSnapshot = firestore.collection("clan_competitions").get().await()
                val loadedComps = compSnapshot.documents.mapNotNull { doc ->
                    ClanCompetition(
                        id = doc.id,
                        title = doc.getString("title") ?: "Compétition de Clan",
                        activeClanIdA = doc.getString("activeClanIdA") ?: "",
                        activeClanIdB = doc.getString("activeClanIdB") ?: "",
                        xpClanA = doc.getLong("xpClanA")?.toInt() ?: 0,
                        xpClanB = doc.getLong("xpClanB")?.toInt() ?: 0,
                        timeLeft = doc.getString("timeLeft") ?: "2 jours restants",
                        rewardDescription = doc.getString("rewardDescription") ?: "+500 XP"
                    )
                }
                if (loadedComps.isNotEmpty()) {
                    _competitions.value = loadedComps
                } else {
                    seedDefaultCompetitions()
                }

            } catch (e: Exception) {
                Log.e("ClanViewModel", "Error loading Firestore data, falling back offline: ${e.message}")
                seedDefaultClans()
                seedDefaultCompetitions()
            } finally {
                _isSyncing.value = false
            }
        }
    }

    private fun seedDefaultClans() {
        val list = listOf(
            Clan(
                id = "clan_shogun",
                name = "Neo Shogunate",
                description = "L'alliance suprême des guerriers cybernétiques. Maîtrise, discipline martiale et entraînement acharné.",
                tag = "SHOGUN",
                totalXp = 4500,
                rank = 1,
                membersCount = 3,
                members = listOf(
                    ClanMember("system_bot", "CyberShogun", "Chef", 2500),
                    ClanMember("bot_2", "Kusanagi", "Officier", 1200),
                    ClanMember("bot_3", "CyberSamurai", "Soldat", 800)
                )
            ),
            Clan(
                id = "clan_syndicate",
                name = "Synth Syndicate",
                description = "Les combattants de l'ombre néon. Rapidité extrême d'impact, ruse tactique et agilité.",
                tag = "SYNTH",
                totalXp = 3200,
                rank = 2,
                membersCount = 2,
                members = listOf(
                    ClanMember("system_bot_2", "SynthOverlord", "Chef", 2000),
                    ClanMember("bot_4", "NeonPhantom", "Soldat", 1200)
                )
            ),
            Clan(
                id = "clan_hacker",
                name = "Netrunners Unit",
                description = "Optimisation mécanique de la masse musculaire par intelligence artificielle tactique.",
                tag = "RUNNER",
                totalXp = 2800,
                rank = 3,
                membersCount = 2,
                members = listOf(
                    ClanMember("system_bot_3", "AltCunningham", "Chef", 1800),
                    ClanMember("bot_5", "SpiderMurphy", "Officier", 1000)
                )
            )
        )
        _clans.value = list
    }

    private fun seedDefaultCompetitions() {
        _competitions.value = listOf(
            ClanCompetition(
                id = "comp_championship",
                title = "CHAMPIONNAT CYBER-OCTOGONE",
                activeClanIdA = "clan_shogun",
                activeClanIdB = "clan_syndicate",
                xpClanA = 3450,
                xpClanB = 3120,
                timeLeft = "14 heures restantes",
                rewardDescription = "+800 XP & Insigne de l'élite pour les membres"
            ),
            ClanCompetition(
                id = "comp_domination",
                title = "GUERRE DES TERRITOIRES NÉON",
                activeClanIdA = "clan_syndicate",
                activeClanIdB = "clan_hacker",
                xpClanA = 1200,
                xpClanB = 1450,
                timeLeft = "3 jours restants",
                rewardDescription = "+450 XP & Augmentation du bonus d'entraînement (+10%)"
            )
        )
    }

    fun joinClan(clanId: String, userId: String, username: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val currentClans = _clans.value.toMutableList()
                val targetIdx = currentClans.indexOfFirst { it.id == clanId }
                if (targetIdx != -1) {
                    val clan = currentClans[targetIdx]
                    if (clan.members.any { it.userId == userId }) return@launch

                    val newMember = ClanMember(
                        userId = userId,
                        username = if (username.isBlank()) "CyberAthlète" else username,
                        role = "Soldat",
                        contributedXp = 0
                    )
                    val updatedMembers = clan.members.toMutableList().apply { add(newMember) }
                    val updatedClan = clan.copy(
                        members = updatedMembers,
                        membersCount = clan.membersCount + 1
                    )
                    currentClans[targetIdx] = updatedClan
                    _clans.value = currentClans
                    _activeClan.value = updatedClan

                    // Persist to Firebase
                    val map = mapOf(
                        "name" to updatedClan.name,
                        "description" to updatedClan.description,
                        "tag" to updatedClan.tag,
                        "totalXp" to updatedClan.totalXp,
                        "rank" to updatedClan.rank,
                        "membersCount" to updatedClan.membersCount,
                        "members" to updatedMembers.map { m ->
                            mapOf(
                                "userId" to m.userId,
                                "username" to m.username,
                                "role" to m.role,
                                "contributedXp" to m.contributedXp
                            )
                        }
                    )
                    firestore.collection("clans").document(clanId).set(map)
                }
            } catch (e: Exception) {
                Log.e("ClanViewModel", "Error joining clan: ${e.message}")
            }
        }
    }

    fun leaveClan(userId: String) {
        val clan = _activeClan.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val currentClans = _clans.value.toMutableList()
                val targetIdx = currentClans.indexOfFirst { it.id == clan.id }
                if (targetIdx != -1) {
                    val updatedMembers = clan.members.filter { it.userId != userId }
                    val updatedClan = clan.copy(
                        members = updatedMembers,
                        membersCount = (clan.membersCount - 1).coerceAtLeast(0)
                    )
                    currentClans[targetIdx] = updatedClan
                    _clans.value = currentClans
                    _activeClan.value = null

                    // Update Firebase Document
                    val map = mapOf(
                        "name" to updatedClan.name,
                        "description" to updatedClan.description,
                        "tag" to updatedClan.tag,
                        "totalXp" to updatedClan.totalXp,
                        "rank" to updatedClan.rank,
                        "membersCount" to updatedClan.membersCount,
                        "members" to updatedMembers.map { m ->
                            mapOf(
                                "userId" to m.userId,
                                "username" to m.username,
                                "role" to m.role,
                                "contributedXp" to m.contributedXp
                            )
                        }
                    )
                    firestore.collection("clans").document(clan.id).set(map)
                }
            } catch (e: Exception) {
                Log.e("ClanViewModel", "Error leaving clan: ${e.message}")
            }
        }
    }

    fun contributeXpToCompetition(competitionId: String, amount: Int, userId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val currentComps = _competitions.value.toMutableList()
                val idx = currentComps.indexOfFirst { it.id == competitionId }
                if (idx != -1) {
                    val comp = currentComps[idx]
                    val clan = _activeClan.value ?: return@launch

                    val updatedComp = if (comp.activeClanIdA == clan.id) {
                        comp.copy(xpClanA = comp.xpClanA + amount)
                    } else if (comp.activeClanIdB == clan.id) {
                        comp.copy(xpClanB = comp.xpClanB + amount)
                    } else {
                        // General fallback increase
                        comp.copy(xpClanA = comp.xpClanA + amount)
                    }

                    currentComps[idx] = updatedComp
                    _competitions.value = currentComps

                    // Save XP contributions
                    contributeXpToClan(amount, userId)

                    // Write competition back
                    val map = mapOf(
                        "title" to updatedComp.title,
                        "activeClanIdA" to updatedComp.activeClanIdA,
                        "activeClanIdB" to updatedComp.activeClanIdB,
                        "xpClanA" to updatedComp.xpClanA,
                        "xpClanB" to updatedComp.xpClanB,
                        "timeLeft" to updatedComp.timeLeft,
                        "rewardDescription" to updatedComp.rewardDescription
                    )
                    firestore.collection("clan_competitions").document(competitionId).set(map)
                }
            } catch (e: Exception) {
                Log.e("ClanViewModel", "Error contributing XP: ${e.message}")
            }
        }
    }

    private fun contributeXpToClan(amount: Int, userId: String) {
        val clan = _activeClan.value ?: return
        val currentClans = _clans.value.toMutableList()
        val targetIdx = currentClans.indexOfFirst { it.id == clan.id }
        if (targetIdx != -1) {
            val updatedMembers = clan.members.map { m ->
                if (m.userId == userId) {
                    m.copy(contributedXp = m.contributedXp + amount)
                } else m
            }
            val updatedClan = clan.copy(
                totalXp = clan.totalXp + amount,
                members = updatedMembers
            )
            currentClans[targetIdx] = updatedClan
            _clans.value = currentClans
            _activeClan.value = updatedClan
        }
    }
}
