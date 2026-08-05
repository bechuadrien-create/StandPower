package com.tondaproject.standpower

import android.app.Application
import com.google.firebase.FirebaseApp
import com.tondaproject.standpower.repository.MealRepository
import com.tondaproject.standpower.utils.CalorieDatabase
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

class StandPowerApplication : Application() {
    
    // Application-wide coroutine scope for database populating
    val applicationScope = CoroutineScope(SupervisorJob())

    // Database and repository initialized lazily
    val database by lazy { CalorieDatabase.getDatabase(this, applicationScope) }
    
    val repository by lazy { 
        MealRepository(
            calorieDao = database.calorieDao(),
            firestore = FirebaseFirestore.getInstance()
        ) 
    }

    override fun onCreate() {
        super.onCreate()
        
        // Initialize Firebase SDK
        FirebaseApp.initializeApp(this)
    }
}
