package com.tondaproject.standpower.data

import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class FoodItem(
    val name: String = "",
    val calories: Int = 0
)

data class Meal(
    val id: String = "",
    val userId: String = "",
    val totalCalories: Int = 0,
    val foods: List<FoodItem> = emptyList(),
    @ServerTimestamp val timestamp: Date? = null
)
