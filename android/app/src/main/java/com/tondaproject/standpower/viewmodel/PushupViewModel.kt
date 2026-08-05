package com.tondaproject.standpower.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.firestore.FirebaseFirestore
import com.tondaproject.standpower.StandPowerApplication
import com.tondaproject.standpower.data.CommunityChallenge
import com.tondaproject.standpower.data.PushupLevel
import com.tondaproject.standpower.data.pushupLevels
import com.tondaproject.standpower.utils.PushupProgress
import com.tondaproject.standpower.utils.UnlockedBadge
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

// Event class to trigger level-up visual animation and synth sound cue
data class LevelUpEvent(val newLevel: PushupLevel, val rewardXP: Int)

class PushupViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as StandPowerApplication
    private val pushupDao = app.database.pushupDao()
    private val badgeDao = app.database.badgeDao()
    private val firestore = FirebaseFirestore.getInstance()

    // UI States
    private val _progressState = MutableStateFlow(PushupProgress())
    val progressState: StateFlow<PushupProgress> = _progressState.asStateFlow()

    private val _unlockedBadges = MutableStateFlow<List<UnlockedBadge>>(emptyList())
    val unlockedBadges: StateFlow<List<UnlockedBadge>> = _unlockedBadges.asStateFlow()

    private val _challenges = MutableStateFlow<List<CommunityChallenge>>(emptyList())
    val challenges: StateFlow<List<CommunityChallenge>> = _challenges.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    // Level-Up triggers
    private val _levelUpEvent = MutableSharedFlow<LevelUpEvent>()
    val levelUpEvent: SharedFlow<LevelUpEvent> = _levelUpEvent.asSharedFlow()

    init {
        loadLocalProgress()
        fetchCommunityChallenges()
    }

    // Load progress and badges from Room DB
    fun loadLocalProgress() {
        viewModelScope.launch(Dispatchers.IO) {
            val progress = pushupDao.getProgress() ?: PushupProgress()
            _progressState.value = progress

            val badges = badgeDao.getAllBadges()
            // If badges are empty, unlock Level 1 default badge
            if (badges.isEmpty() && progress.level >= 1) {
                badgeDao.unlockBadge(UnlockedBadge(badgeName = pushupLevels[0].badgeName))
                _unlockedBadges.value = badgeDao.getAllBadges()
            } else {
                _unlockedBadges.value = badges
            }
        }
    }

    // Add pushup repetitions
    fun addPushups(count: Int, userId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val current = pushupDao.getProgress() ?: PushupProgress()
            val newReps = current.reps + count
            
            // Calculate level
            var newLevelIndex = 0
            for (i in pushupLevels.indices) {
                if (newReps >= pushupLevels[i].minReps) {
                    newLevelIndex = i
                }
            }
            val calculatedLevel = newLevelIndex + 1
            val didLevelUp = calculatedLevel > current.level

            // Calculate Streak
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            var newStreak = current.streak
            if (current.lastPushupDate.isEmpty()) {
                newStreak = 1
            } else if (current.lastPushupDate != todayStr) {
                val yesterdayStr = getYesterdayDateString()
                newStreak = if (current.lastPushupDate == yesterdayStr) {
                    current.streak + 1
                } else {
                    1
                }
            }

            // Calculate XP (1 XP per rep, bonus reward on Level Up)
            var earnedXPOnLevelUp = 0
            if (didLevelUp) {
                earnedXPOnLevelUp = pushupLevels[newLevelIndex].rewardXP
                // Automatically unlock the new Badge in Room
                val newBadgeName = pushupLevels[newLevelIndex].badgeName
                badgeDao.unlockBadge(UnlockedBadge(badgeName = newBadgeName))
                _unlockedBadges.value = badgeDao.getAllBadges()

                // Dispatch animation event
                _levelUpEvent.emit(LevelUpEvent(pushupLevels[newLevelIndex], earnedXPOnLevelUp))
            }

            val finalXP = current.xp + count + earnedXPOnLevelUp

            val updatedProgress = current.copy(
                reps = newReps,
                level = calculatedLevel,
                xp = finalXP,
                streak = newStreak,
                lastPushupDate = todayStr
            )

            // Save to Room
            pushupDao.insertOrUpdate(updatedProgress)
            _progressState.value = updatedProgress

            // Sync with Firebase
            syncProgressToFirebase(userId, updatedProgress)
        }
    }

    // Sync gamified profile progress with Cloud Firestore
    private fun syncProgressToFirebase(userId: String, progress: PushupProgress) {
        if (userId.isEmpty()) return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _isSyncing.value = true
                val map = mapOf(
                    "userId" to userId,
                    "reps" to progress.reps,
                    "level" to progress.level,
                    "xp" to progress.xp,
                    "streak" to progress.streak,
                    "lastPushupDate" to progress.lastPushupDate,
                    "badges" to _unlockedBadges.value.map { it.badgeName },
                    "updatedAt" to System.currentTimeMillis()
                )
                firestore.collection("user_profiles")
                    .document(userId)
                    .set(map)
                    .await()
            } catch (e: Exception) {
                Log.e("PushupViewModel", "Firebase Sync Error: ${e.message}")
            } finally {
                _isSyncing.value = false
            }
        }
    }

    // Load progress from cloud on user login
    fun loadCloudProgress(userId: String) {
        if (userId.isEmpty()) return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _isSyncing.value = true
                val doc = firestore.collection("user_profiles")
                    .document(userId)
                    .get()
                    .await()
                if (doc.exists()) {
                    val cloudReps = doc.getLong("reps")?.toInt() ?: 0
                    val cloudLevel = doc.getLong("level")?.toInt() ?: 1
                    val cloudXp = doc.getLong("xp")?.toInt() ?: 0
                    val cloudStreak = doc.getLong("streak")?.toInt() ?: 0
                    val cloudLastDate = doc.getString("lastPushupDate") ?: ""
                    
                    val mergedProgress = PushupProgress(
                        reps = cloudReps,
                        level = cloudLevel,
                        xp = cloudXp,
                        streak = cloudStreak,
                        lastPushupDate = cloudLastDate
                    )
                    pushupDao.insertOrUpdate(mergedProgress)
                    _progressState.value = mergedProgress

                    val cloudBadges = doc.get("badges") as? List<*>
                    cloudBadges?.forEach { badgeName ->
                        if (badgeName is String) {
                            badgeDao.unlockBadge(UnlockedBadge(badgeName = badgeName))
                        }
                    }
                    _unlockedBadges.value = badgeDao.getAllBadges()
                }
            } catch (e: Exception) {
                Log.e("PushupViewModel", "Cloud Load Error: ${e.message}")
            } finally {
                _isSyncing.value = false
            }
        }
    }

    // Fetch or seed Community Challenges in Firestore
    fun fetchCommunityChallenges() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val snapshot = firestore.collection("challenges").get().await()
                if (snapshot.isEmpty) {
                    // Seed defaults to Firestore if empty
                    seedDefaultChallenges()
                } else {
                    val list = snapshot.documents.map { doc ->
                        CommunityChallenge(
                            id = doc.id,
                            title = doc.getString("title") ?: "",
                            description = doc.getString("description") ?: "",
                            xpReward = doc.getLong("xpReward")?.toInt() ?: 100,
                            durationDays = doc.getLong("durationDays")?.toInt() ?: 30,
                            participantCount = doc.getLong("participantCount")?.toInt() ?: 0,
                            isJoined = false
                        )
                    }
                    _challenges.value = list
                }
            } catch (e: Exception) {
                Log.e("PushupViewModel", "Challenges Fetch Error: ${e.message}")
                // Fallback to offline defaults
                _challenges.value = getOfflineDefaults()
            }
        }
    }

    // Join a challenge
    fun joinChallenge(challengeId: String, userId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Update Firestore
                val docRef = firestore.collection("challenges").document(challengeId)
                firestore.runTransaction { transaction ->
                    val snapshot = transaction.get(docRef)
                    val count = snapshot.getLong("participantCount") ?: 0
                    transaction.update(docRef, "participantCount", count + 1)
                }.await()

                // Store joining locally
                if (userId.isNotEmpty()) {
                    firestore.collection("user_challenges")
                        .document("${userId}_${challengeId}")
                        .set(mapOf("userId" to userId, "challengeId" to challengeId, "joinedAt" to System.currentTimeMillis()))
                        .await()
                }

                // Refresh UI list state
                val list = _challenges.value.map {
                    if (it.id == challengeId) {
                        it.copy(participantCount = it.participantCount + 1, isJoined = true)
                    } else it
                }
                _challenges.value = list

            } catch (e: Exception) {
                Log.e("PushupViewModel", "Join Challenge Error: ${e.message}")
            }
        }
    }

    private suspend fun seedDefaultChallenges() {
        val defaults = getOfflineDefaults()
        for (challenge in defaults) {
            val docRef = firestore.collection("challenges").document()
            docRef.set(challenge.copy(id = docRef.id)).await()
        }
        // Fetch back
        val snapshot = firestore.collection("challenges").get().await()
        val list = snapshot.documents.map { doc ->
            CommunityChallenge(
                id = doc.id,
                title = doc.getString("title") ?: "",
                description = doc.getString("description") ?: "",
                xpReward = doc.getLong("xpReward")?.toInt() ?: 100,
                durationDays = doc.getLong("durationDays")?.toInt() ?: 30,
                participantCount = doc.getLong("participantCount")?.toInt() ?: 0,
                isJoined = false
            )
        }
        _challenges.value = list
    }

    private fun getOfflineDefaults() = listOf(
        CommunityChallenge(
            title = "ZÉRO JUNK FOOD",
            description = "Maintenez 30 jours consécutifs d'alimentation saine sans nourriture ultra-transformée. Validez votre journal chaque jour !",
            xpReward = 300,
            durationDays = 30,
            participantCount = 142
        ),
        CommunityChallenge(
            title = "MARATHON DES 100 POMPES",
            description = "Exécutez 100 répétitions de pompes en une seule journée. Stimulez votre puissance de combat et débloquez le grade supérieur.",
            xpReward = 150,
            durationDays = 1,
            participantCount = 289
        ),
        CommunityChallenge(
            title = "CYBER ENDURANCE",
            description = "Réalisez un entraînement d'endurance cardiovasculaire intensif pendant 5 jours consécutifs dans l'Athletic AI Hub.",
            xpReward = 200,
            durationDays = 5,
            participantCount = 98
        )
    )

    private fun getYesterdayDateString(): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -1)
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
    }
}
