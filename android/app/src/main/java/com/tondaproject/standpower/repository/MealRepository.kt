package com.tondaproject.standpower.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.tondaproject.standpower.data.Meal
import com.tondaproject.standpower.utils.CalorieDao
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Locale

class MealRepository(
    private val calorieDao: CalorieDao,
    private val firestore: FirebaseFirestore
) {
    // Get calorie mapping for a given food from Room database
    suspend fun getCaloriesForFood(foodName: String): Int {
        val sanitized = foodName.trim().lowercase(Locale.ROOT)
        // Check for exact match
        var item = calorieDao.getCalorieItem(sanitized)
        if (item != null) return item.caloriesPer100g

        // Try simple singular/plural match or substring checks if not found
        val singular = if (sanitized.endsWith("s")) sanitized.dropLast(1) else sanitized
        item = calorieDao.getCalorieItem(singular)
        if (item != null) return item.caloriesPer100g

        return -1 // Indicates item not found in DB
    }

    // Save meal record to Firebase Firestore
    suspend fun saveMealToFirebase(meal: Meal): Result<Unit> {
        return try {
            val documentRef = firestore.collection("meals").document()
            val mealWithId = meal.copy(id = documentRef.id)
            documentRef.set(mealWithId).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Retrieve real-time food history for user from Firebase Firestore
    fun getMealHistory(userId: String): Flow<List<Meal>> = callbackFlow {
        val query = firestore.collection("meals")
            .whereEqualTo("userId", userId)
            .orderBy("timestamp", Query.Direction.DESCENDING)

        val listener = query.addSnapshotListener { snapshot, exception ->
            if (exception != null) {
                close(exception)
                return@addSnapshotListener
            }
            if (snapshot != null) {
                val meals = snapshot.toObjects(Meal::class.java)
                trySend(meals)
            }
        }

        awaitClose { listener.remove() }
    }
}
