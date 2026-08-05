package com.tondaproject.standpower.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.firestore.FirebaseFirestore
import com.tondaproject.standpower.StandPowerApplication
import com.tondaproject.standpower.data.Exercise
import com.tondaproject.standpower.data.Mood
import com.tondaproject.standpower.data.SportType
import com.tondaproject.standpower.utils.UserPreferences
import com.tondaproject.standpower.utils.CustomWorkout
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class WorkoutViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as StandPowerApplication
    private val prefsDao = app.database.preferencesDao()
    private val customWorkoutDao = app.database.customWorkoutDao()
    private val firestore = FirebaseFirestore.getInstance()

    // Preferences states
    private val _selectedMood = MutableStateFlow(Mood.AGGRESSIVE)
    val selectedMood: StateFlow<Mood> = _selectedMood.asStateFlow()

    private val _selectedSport = MutableStateFlow(SportType.BOXE)
    val selectedSport: StateFlow<SportType> = _selectedSport.asStateFlow()

    // Custom workouts state
    private val _customWorkouts = MutableStateFlow<List<CustomWorkout>>(emptyList())
    val customWorkouts: StateFlow<List<CustomWorkout>> = _customWorkouts.asStateFlow()

    // Active workout lists
    private val _generatedExercises = MutableStateFlow<List<Exercise>>(emptyList())
    val generatedExercises: StateFlow<List<Exercise>> = _generatedExercises.asStateFlow()

    // Real-time progress trackers
    private val _completedIndices = MutableStateFlow<Set<Int>>(emptySet())
    val completedIndices: StateFlow<Set<Int>> = _completedIndices.asStateFlow()

    private val _workoutFinished = MutableStateFlow(false)
    val workoutFinished: StateFlow<Boolean> = _workoutFinished.asStateFlow()

    private val _xpEarned = MutableStateFlow(0)
    val xpEarned: StateFlow<Int> = _xpEarned.asStateFlow()

    init {
        loadPreferences()
        loadCustomWorkouts()
    }

    // Load offline preference from Room
    private fun loadPreferences() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val cached = prefsDao.getPreferences()
                if (cached != null) {
                    val mood = Mood.entries.find { it.name == cached.selectedMood } ?: Mood.AGGRESSIVE
                    val sport = SportType.entries.find { it.name == cached.favoriteSport } ?: SportType.BOXE
                    _selectedMood.value = mood
                    _selectedSport.value = sport
                    generateExercisesList(sport, mood)
                } else {
                    // Seed defaults
                    generateExercisesList(SportType.BOXE, Mood.AGGRESSIVE)
                }
            } catch (e: Exception) {
                Log.e("WorkoutViewModel", "Preferences load error: ${e.message}")
                generateExercisesList(SportType.BOXE, Mood.AGGRESSIVE)
            }
        }
    }

    // Set and persist user's chosen mood
    fun selectMood(mood: Mood, userId: String) {
        _selectedMood.value = mood
        resetProgress()
        generateExercisesList(_selectedSport.value, mood)
        savePreferences(userId)
    }

    // Set and persist user's chosen sport
    fun selectSport(sport: SportType, userId: String) {
        _selectedSport.value = sport
        resetProgress()
        generateExercisesList(sport, _selectedMood.value)
        savePreferences(userId)
    }

    // Toggle exercise completed state
    fun toggleExercise(index: Int) {
        val current = _completedIndices.value.toMutableSet()
        if (current.contains(index)) {
            current.remove(index)
        } else {
            current.add(index)
        }
        _completedIndices.value = current

        // Calculate progress
        val exercises = _generatedExercises.value
        if (exercises.isNotEmpty() && current.size == exercises.size) {
            _workoutFinished.value = true
            // Grant completion XP bonus (e.g., 50 XP)
            _xpEarned.value = exercises.size * 10 + 50
        } else {
            _workoutFinished.value = false
            _xpEarned.value = current.size * 10
        }
    }

    // Reset progression for a new workout
    fun resetProgress() {
        _completedIndices.value = emptySet()
        _workoutFinished.value = false
        _xpEarned.value = 0
    }

    // Generate exercises based on chosen mood & sport combinations
    private fun generateExercisesList(sport: SportType, mood: Mood) {
        val exercises = when (sport) {
            SportType.BOXE -> when (mood) {
                Mood.AGGRESSIVE -> listOf(
                    Exercise("Frappes Lourdes Sac de Frappe", 4, 45, isDurationBased = true, "PunchingBag"),
                    Exercise("Shadow Boxing Explosif", 3, 60, isDurationBased = true, "ShadowBoxing"),
                    Exercise("Sprints Croisés Sac de Vitesse", 3, 30, isDurationBased = true, "Timer"),
                    Exercise("Pompes de Combattant Explosives", 4, 15, isDurationBased = false, "Pushups")
                )
                Mood.ENDURANCE -> listOf(
                    Exercise("Corde à Sauter Rythmique Cyber", 5, 90, isDurationBased = true, "JumpRope"),
                    Exercise("Shadow Boxing Rythmé (Footwork)", 4, 120, isDurationBased = true, "ShadowBoxing"),
                    Exercise("Frappes Souples Sac de Frappe", 3, 180, isDurationBased = true, "PunchingBag"),
                    Exercise("Burpees Cardio Explosifs", 3, 15, isDurationBased = false, "FitnessCenter")
                )
                Mood.STRENGTH -> listOf(
                    Exercise("Squat-Jump & Punch de Force", 4, 15, isDurationBased = false, "Squat"),
                    Exercise("Séries Sac de Frappe en Puissance", 4, 30, isDurationBased = true, "PunchingBag"),
                    Exercise("Relevé de Buste & Crochets", 3, 20, isDurationBased = false, "Abs"),
                    Exercise("Pompes Diamant Ultra Cyber", 4, 12, isDurationBased = false, "Pushups")
                )
            }
            SportType.MMA -> when (mood) {
                Mood.AGGRESSIVE -> listOf(
                    Exercise("Takedowns Explosifs Simulés (Sprawls)", 5, 12, isDurationBased = false, "Sprawl"),
                    Exercise("Combinaisons Poings/Pieds Assiégantes", 4, 60, isDurationBased = true, "Fight"),
                    Exercise("Frappes au Sol (Ground & Pound)", 4, 45, isDurationBased = true, "PunchingBag"),
                    Exercise("Tractions Cyber Explosives", 3, 8, isDurationBased = false, "Pullups")
                )
                Mood.ENDURANCE -> listOf(
                    Exercise("Cardio Shadow Grappling Fluide", 4, 120, isDurationBased = true, "ShadowBoxing"),
                    Exercise("Corde à Sauter Double-Under Speed", 4, 60, isDurationBased = true, "JumpRope"),
                    Exercise("Séries d'Esquives & Kicks Continus", 3, 150, isDurationBased = true, "Fight"),
                    Exercise("Gainage Tactique Mobile (Spider Plank)", 3, 45, isDurationBased = true, "Plank")
                )
                Mood.STRENGTH -> listOf(
                    Exercise("Fentes de Force à Genou Slam", 4, 16, isDurationBased = false, "Fente"),
                    Exercise("Pompes Isométriques Basse Garde", 4, 30, isDurationBased = true, "Pushups"),
                    Exercise("Lancer d'Athlète lourd simulé", 3, 10, isDurationBased = false, "Weights"),
                    Exercise("Cyber Squats Gobelet Profonds", 4, 12, isDurationBased = false, "Squat")
                )
            }
            SportType.MUSCULATION -> when (mood) {
                Mood.AGGRESSIVE -> listOf(
                    Exercise("Développé Couché Cyber Explosif", 4, 10, isDurationBased = false, "BenchPress"),
                    Exercise("Tractions Prise Pronation Puissance", 3, 8, isDurationBased = false, "Pullups"),
                    Exercise("Pompes Déclinées avec pause", 4, 15, isDurationBased = false, "Pushups"),
                    Exercise("Burpees Militaires de l'Octogone", 4, 12, isDurationBased = false, "FitnessCenter")
                )
                Mood.ENDURANCE -> listOf(
                    Exercise("Fentes Cyber en Mouvement", 4, 24, isDurationBased = false, "Fente"),
                    Exercise("Pompes Classiques Prise Large", 5, 20, isDurationBased = false, "Pushups"),
                    Exercise("Squats au Poids du Corps (Speed)", 4, 30, isDurationBased = false, "Squat"),
                    Exercise("Gainage Étoile Fluide (Star Plank)", 3, 60, isDurationBased = true, "Plank")
                )
                Mood.STRENGTH -> listOf(
                    Exercise("Dips de Puissance Triceps", 4, 10, isDurationBased = false, "Dips"),
                    Exercise("Soulevé de Terre Isométrique", 3, 8, isDurationBased = false, "Weights"),
                    Exercise("Pompes Diamant Prise Serrée", 4, 12, isDurationBased = false, "Pushups"),
                    Exercise("Leg-Raises Couché de Fer", 3, 15, isDurationBased = false, "Abs")
                )
            }
        }
        _generatedExercises.value = exercises
    }

    // Persist mood and sport offline and back up to Firestore
    private fun savePreferences(userId: String) {
        val mood = _selectedMood.value.name
        val sport = _selectedSport.value.name
        
        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Save locally
                prefsDao.insertOrUpdate(UserPreferences(selectedMood = mood, favoriteSport = sport))

                // Save to Firebase
                if (userId.isNotEmpty()) {
                    firestore.collection("user_profiles")
                        .document(userId)
                        .update(mapOf("selectedMood" to mood, "favoriteSport" to sport))
                        .await()
                }
            } catch (e: Exception) {
                Log.e("WorkoutViewModel", "Preferences save error: ${e.message}")
            }
        }
    }

    // Save workout session wearable stats to Firestore
    fun saveWorkoutSessionToCloud(userId: String, averageHr: Int, maxHr: Int, steps: Int, calories: Int) {
        if (userId.isEmpty()) return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val docId = "session_" + System.currentTimeMillis()
                val data = mapOf(
                    "id" to docId,
                    "userId" to userId,
                    "averageHeartRate" to averageHr,
                    "maxHeartRate" to maxHr,
                    "stepsCount" to steps,
                    "caloriesBurned" to calories,
                    "timestamp" to System.currentTimeMillis()
                )
                firestore.collection("wearable_sessions")
                    .document(docId)
                    .set(data)
                    .await()
                Log.d("WorkoutViewModel", "Saved wearable session stats to cloud successfully.")
            } catch (e: Exception) {
                Log.e("WorkoutViewModel", "Error saving wearable session: ${e.message}")
            }
        }
    }

    // Custom Workout Management
    fun loadCustomWorkouts() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val list = customWorkoutDao.getAllCustomWorkouts()
                _customWorkouts.value = list
            } catch (e: Exception) {
                Log.e("WorkoutViewModel", "Error loading custom workouts: ${e.message}")
            }
        }
    }

    fun createCustomWorkout(title: String, exercises: List<Exercise>, userId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val id = "custom_" + System.currentTimeMillis()
                val serialized = serializeExercises(exercises)
                val newWorkout = CustomWorkout(id = id, title = title, exercisesSerialized = serialized)
                
                // Save locally
                customWorkoutDao.insertOrUpdate(newWorkout)
                loadCustomWorkouts()

                // Sync to Firestore if online
                if (userId.isNotEmpty()) {
                    val map = mapOf(
                        "id" to id,
                        "userId" to userId,
                        "title" to title,
                        "exercisesSerialized" to serialized,
                        "createdAt" to newWorkout.createdAt
                    )
                    firestore.collection("custom_workouts")
                        .document(id)
                        .set(map)
                        .await()
                }
            } catch (e: Exception) {
                Log.e("WorkoutViewModel", "Error saving custom workout: ${e.message}")
            }
        }
    }

    fun deleteCustomWorkout(id: String, userId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                customWorkoutDao.deleteWorkout(id)
                loadCustomWorkouts()
                
                if (userId.isNotEmpty()) {
                    firestore.collection("custom_workouts")
                        .document(id)
                        .delete()
                        .await()
                }
            } catch (e: Exception) {
                Log.e("WorkoutViewModel", "Error deleting custom workout: ${e.message}")
            }
        }
    }

    fun loadCloudCustomWorkouts(userId: String) {
        if (userId.isEmpty()) return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val snapshot = firestore.collection("custom_workouts")
                    .whereEqualTo("userId", userId)
                    .get()
                    .await()
                if (!snapshot.isEmpty) {
                    snapshot.documents.forEach { doc ->
                        val id = doc.id
                        val title = doc.getString("title") ?: "Mon Entraînement"
                        val serialized = doc.getString("exercisesSerialized") ?: ""
                        val createdAt = doc.getLong("createdAt") ?: System.currentTimeMillis()
                        
                        customWorkoutDao.insertOrUpdate(
                            CustomWorkout(id = id, title = title, exercisesSerialized = serialized, createdAt = createdAt)
                        )
                    }
                    loadCustomWorkouts()
                }
            } catch (e: Exception) {
                Log.e("WorkoutViewModel", "Cloud load custom workouts error: ${e.message}")
            }
        }
    }

    fun startCustomWorkout(customWorkout: CustomWorkout) {
        resetProgress()
        val exercises = deserializeExercises(customWorkout.exercisesSerialized)
        _generatedExercises.value = exercises
    }

    private fun serializeExercises(exercises: List<Exercise>): String {
        return exercises.joinToString(";;;") { exercise ->
            "${exercise.name}::${exercise.sets}::${exercise.repsOrDurationSec}::${exercise.isDurationBased}::${exercise.iconName}"
        }
    }

    private fun deserializeExercises(serialized: String): List<Exercise> {
        if (serialized.isEmpty()) return emptyList()
        return try {
            serialized.split(";;;").map { part ->
                val tokens = part.split("::")
                Exercise(
                    name = tokens.getOrNull(0) ?: "Exercice",
                    sets = tokens.getOrNull(1)?.toIntOrNull() ?: 3,
                    repsOrDurationSec = tokens.getOrNull(2)?.toIntOrNull() ?: 10,
                    isDurationBased = tokens.getOrNull(3)?.toBoolean() ?: false,
                    iconName = tokens.getOrNull(4) ?: "FitnessCenter"
                )
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
}
