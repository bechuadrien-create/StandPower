package com.tondaproject.standpower.viewmodel

import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.tondaproject.standpower.data.FoodItem
import com.tondaproject.standpower.data.Meal
import com.tondaproject.standpower.repository.MealRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Date
import java.util.Locale

sealed class ScanState {
    object Idle : ScanState()
    object Loading : ScanState()
    data class Success(val foods: List<FoodItem>, val totalCalories: Int) : ScanState()
    data class Error(val message: String) : ScanState()
}

class MealViewModel(
    private val repository: MealRepository
) : ViewModel() {

    private val _scanState = MutableStateFlow<ScanState>(ScanState.Idle)
    val scanState: StateFlow<ScanState> = _scanState.asStateFlow()

    private val _saveStatus = MutableStateFlow<Result<Unit>?>(null)
    val saveStatus: StateFlow<Result<Unit>?> = _saveStatus.asStateFlow()

    private val _mealHistory = MutableStateFlow<List<Meal>>(emptyList())
    val mealHistory: StateFlow<List<Meal>> = _mealHistory.asStateFlow()

    private val labeler = ImageLabeling.getClient(
        ImageLabelerOptions.Builder()
            .setConfidenceThreshold(0.7f) // 70% threshold as requested
            .build()
    )

    // Analyze the bitmap image captured with CameraX
    fun analyzeMeal(bitmap: Bitmap, context: Context) {
        _scanState.value = ScanState.Loading
        _saveStatus.value = null

        val image = InputImage.fromBitmap(bitmap, 0)
        
        labeler.process(image)
            .addOnSuccessListener { labels ->
                if (labels.isEmpty()) {
                    _scanState.value = ScanState.Error("Aucun aliment ou objet détecté. Assurez-vous que l'image est nette et lumineuse.")
                    return@addOnSuccessListener
                }

                viewModelScope.launch {
                    val detectedFoods = mutableListOf<FoodItem>()
                    var totalCals = 0

                    for (label in labels) {
                        val englishName = label.text.lowercase(Locale.ROOT)
                        val frenchName = translateFoodName(englishName)
                        
                        // Look up calories per 100g in Room DB
                        val dbCalories = repository.getCaloriesForFood(frenchName)
                        val finalCalories = if (dbCalories != -1) {
                            // Assume a standard portion (e.g., 200g for meal items, 150g for fries, etc.)
                            val portionFactor = getPortionFactor(frenchName)
                            (dbCalories * portionFactor).toInt()
                        } else {
                            // Food is unknown in the Room DB: perform a smart approximation
                            estimateUnknownFoodCalories(frenchName)
                        }

                        detectedFoods.add(FoodItem(name = frenchName.capitalize(Locale.ROOT), calories = finalCalories))
                        totalCals += finalCalories
                    }

                    if (detectedFoods.isEmpty()) {
                        _scanState.value = ScanState.Error("La détection n'a pas pu identifier d'aliments connus. Essayez une photo plus claire.")
                    } else {
                        _scanState.value = ScanState.Success(detectedFoods, totalCals)
                    }
                }
            }
            .addOnFailureListener { e ->
                _scanState.value = ScanState.Error("Échec de l'analyse ML Kit : ${e.localizedMessage ?: "Erreur inconnue"}")
            }
    }

    // Save the analyzed meal to Firebase Firestore
    fun saveMealToFirebase(userId: String) {
        val currentState = _scanState.value
        if (currentState is ScanState.Success) {
            viewModelScope.launch {
                val meal = Meal(
                    userId = userId,
                    totalCalories = currentState.totalCalories,
                    foods = currentState.foods,
                    timestamp = Date()
                )
                val result = repository.saveMealToFirebase(meal)
                _saveStatus.value = result
                if (result.isSuccess) {
                    _scanState.value = ScanState.Idle // Reset to idle on success
                }
            }
        }
    }

    // Start listening to the meal history for the user
    fun loadMealHistory(userId: String) {
        viewModelScope.launch {
            repository.getMealHistory(userId).collect { meals ->
                _mealHistory.value = meals
            }
        }
    }

    // Translate common ML Kit label outputs from English to French for UX
    private fun translateFoodName(englishName: String): String {
        return when (englishName) {
            "pizza" -> "pizza"
            "hamburger", "burger" -> "burger"
            "french fries", "fries" -> "frites"
            "salad", "vegetable", "leaf vegetable" -> "salade"
            "chicken", "poultry", "fried chicken" -> "poulet"
            "rice" -> "riz"
            "apple" -> "pomme"
            "banana" -> "banane"
            "pasta", "spaghetti", "macaroni" -> "pates"
            "bread", "bun", "baked goods" -> "pain"
            "egg", "boiled egg", "fried egg" -> "oeuf"
            "fish", "seafood" -> "poisson"
            "sushi" -> "sushi"
            "beef", "steak", "meat" -> "steak"
            "soup" -> "soupe"
            "sandwich" -> "sandwich"
            "cheese" -> "fromage"
            "milk" -> "lait"
            "yogurt", "yoghurt" -> "yaourt"
            "broccoli" -> "brocolis"
            "avocado" -> "avocat"
            "eggplant" -> "aubergine"
            "tomato" -> "tomate"
            else -> englishName // fallback
        }
    }

    // Return a default portion multiplier for realistic meal estimates (100g is often too small for a full portion)
    private fun getPortionFactor(foodName: String): Float {
        return when (foodName) {
            "pizza" -> 2.5f // 250g
            "burger" -> 2.2f // 220g
            "frites" -> 1.5f // 150g
            "salade" -> 1.0f // 100g
            "poulet" -> 1.8f // 180g
            "riz" -> 1.5f // 150g
            "pates" -> 2.0f // 200g
            "pain" -> 0.8f // 80g
            "oeuf" -> 0.6f // 60g
            "fromage" -> 0.4f // 40g
            "sandwich" -> 2.0f // 200g
            "poisson" -> 1.5f // 150g
            else -> 1.5f
        }
    }

    // Estimates calorie count for items not in the database, with a dynamic "Inconnu" marker
    private fun estimateUnknownFoodCalories(foodName: String): Int {
        val name = foodName.lowercase(Locale.ROOT)
        return when {
            name.contains("sweet") || name.contains("cake") || name.contains("sugar") || name.contains("dessert") -> 350
            name.contains("juice") || name.contains("drink") || name.contains("beverage") -> 120
            name.contains("fruit") || name.contains("berry") -> 70
            name.contains("green") || name.contains("herb") -> 30
            name.contains("sauce") -> 90
            else -> 200 // Reasonable default portion fallback
        }
    }

    // Standard Factory pattern for injection
    class Factory(private val repository: MealRepository) : androidx.lifecycle.ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(MealViewModel::class.java)) {
                return MealViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}
