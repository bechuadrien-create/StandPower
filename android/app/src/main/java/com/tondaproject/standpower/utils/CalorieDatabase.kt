package com.tondaproject.standpower.utils

import android.content.Context
import androidx.room.Database
import androidx.room.Dao
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// Existing calorie tracker item
@Entity(tableName = "calorie_items")
data class CalorieItem(
    @PrimaryKey val foodName: String,
    val caloriesPer100g: Int
)

// Gamification: Pushup Progress table
@Entity(tableName = "pushup_progress")
data class PushupProgress(
    @PrimaryKey val id: String = "singleton_progress",
    val reps: Int = 0,
    val level: Int = 1,
    val xp: Int = 0,
    val streak: Int = 0,
    val lastPushupDate: String = "" // "YYYY-MM-DD"
)

// Gamification: Unlocked Badges table
@Entity(tableName = "unlocked_badges")
data class UnlockedBadge(
    @PrimaryKey val badgeName: String,
    val unlockedAt: Long = System.currentTimeMillis()
)

// User Preferences table
@Entity(tableName = "user_preferences")
data class UserPreferences(
    @PrimaryKey val id: String = "singleton_prefs",
    val selectedMood: String = "AGGRESSIVE",
    val favoriteSport: String = "BOXE"
)

// Custom Workouts table
@Entity(tableName = "custom_workouts")
data class CustomWorkout(
    @PrimaryKey val id: String,
    val title: String,
    val exercisesSerialized: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Dao
interface CalorieDao {
    @Query("SELECT * FROM calorie_items WHERE foodName = :name LIMIT 1")
    suspend fun getCalorieItem(name: String): CalorieItem?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<CalorieItem>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: CalorieItem)
}

@Dao
interface PushupDao {
    @Query("SELECT * FROM pushup_progress WHERE id = 'singleton_progress' LIMIT 1")
    suspend fun getProgress(): PushupProgress?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(progress: PushupProgress)
}

@Dao
interface BadgeDao {
    @Query("SELECT * FROM unlocked_badges")
    suspend fun getAllBadges(): List<UnlockedBadge>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun unlockBadge(badge: UnlockedBadge)
}

@Dao
interface PreferencesDao {
    @Query("SELECT * FROM user_preferences WHERE id = 'singleton_prefs' LIMIT 1")
    suspend fun getPreferences(): UserPreferences?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(prefs: UserPreferences)
}

@Dao
interface CustomWorkoutDao {
    @Query("SELECT * FROM custom_workouts ORDER BY createdAt DESC")
    suspend fun getAllCustomWorkouts(): List<CustomWorkout>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(workout: CustomWorkout)

    @Query("DELETE FROM custom_workouts WHERE id = :id")
    suspend fun deleteWorkout(id: String)
}

@Database(
    entities = [
        CalorieItem::class,
        PushupProgress::class,
        UnlockedBadge::class,
        UserPreferences::class,
        CustomWorkout::class
    ],
    version = 3,
    exportSchema = false
)
abstract class CalorieDatabase : RoomDatabase() {
    abstract fun calorieDao(): CalorieDao
    abstract fun pushupDao(): PushupDao
    abstract fun badgeDao(): BadgeDao
    abstract fun preferencesDao(): PreferencesDao
    abstract fun customWorkoutDao(): CustomWorkoutDao

    companion object {
        @Volatile
        private var INSTANCE: CalorieDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): CalorieDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    CalorieDatabase::class.java,
                    "calorie_database"
                )
                .addCallback(CalorieDatabaseCallback(scope))
                .fallbackToDestructiveMigration() // Reset gracefully on schema change
                .build()
                INSTANCE = instance
                instance
            }
        }
    }

    private class CalorieDatabaseCallback(
        private val scope: CoroutineScope
    ) : RoomDatabase.Callback() {

        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                scope.launch(Dispatchers.IO) {
                    populateDatabase(database.calorieDao())
                }
            }
        }

        suspend fun populateDatabase(calorieDao: CalorieDao) {
            val items = listOf(
                CalorieItem("pizza", 266),
                CalorieItem("burger", 295),
                CalorieItem("salad", 15),
                CalorieItem("salade", 15),
                CalorieItem("fries", 312),
                CalorieItem("frites", 312),
                CalorieItem("chicken", 165),
                CalorieItem("poulet", 165),
                CalorieItem("rice", 130),
                CalorieItem("riz", 130),
                CalorieItem("apple", 52),
                CalorieItem("pomme", 52),
                CalorieItem("banana", 89),
                CalorieItem("banane", 89),
                CalorieItem("pasta", 131),
                CalorieItem("pates", 131),
                CalorieItem("bread", 265),
                CalorieItem("pain", 265),
                CalorieItem("egg", 155),
                CalorieItem("oeuf", 155),
                CalorieItem("fish", 206),
                CalorieItem("poisson", 206),
                CalorieItem("sushi", 143),
                CalorieItem("steak", 271),
                CalorieItem("beef", 250),
                CalorieItem("soup", 36),
                CalorieItem("soupe", 36),
                CalorieItem("sandwich", 250),
                CalorieItem("cheese", 402),
                CalorieItem("fromage", 402),
                CalorieItem("milk", 42),
                CalorieItem("lait", 42),
                CalorieItem("yogurt", 59),
                CalorieItem("yaourt", 59),
                CalorieItem("brocolis", 34),
                CalorieItem("broccoli", 34),
                CalorieItem("avocado", 160),
                CalorieItem("avocat", 160),
                CalorieItem("eggplant", 25),
                CalorieItem("aubergine", 25),
                CalorieItem("tomato", 18),
                CalorieItem("tomate", 18)
            )
            calorieDao.insertAll(items)
        }
    }
}
