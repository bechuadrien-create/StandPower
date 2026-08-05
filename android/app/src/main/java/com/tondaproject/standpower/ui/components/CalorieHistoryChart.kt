package com.tondaproject.standpower.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Fastfood
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.Meal
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

@Composable
fun CalorieHistoryChart(
    meals: List<Meal>,
    modifier: Modifier = Modifier
) {
    // Process last 7 days of calories
    val dailyTotals = remember(meals) {
        val map = mutableMapOf<String, Int>()
        val formatter = SimpleDateFormat("E", Locale.FRANCE)

        // Initialize last 7 days
        for (i in 0..6) {
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -i)
            val dayName = formatter.format(cal.time).uppercase(Locale.FRANCE).take(3)
            map[dayName] = 0
        }

        // Populate with actual data
        meals.forEach { meal ->
            meal.timestamp?.let { date ->
                val dayName = formatter.format(date).uppercase(Locale.FRANCE).take(3)
                if (map.containsKey(dayName)) {
                    map[dayName] = map[dayName]!! + meal.totalCalories
                }
            }
        }

        // Reverse to chronologically show Monday -> Sunday order
        map.toList().reversed()
    }

    val maxCalorieInWeek = dailyTotals.maxOfOrNull { it.second } ?: 1
    val limitCeiling = if (maxCalorieInWeek < 2000) 2500f else (maxCalorieInWeek + 500).toFloat()

    // Calculate user's average calories for comparison (ignoring 0 days to get actual meal averages)
    val activeDaysCalories = dailyTotals.map { it.second }.filter { it > 0 }
    val averageCalories = if (activeDaysCalories.isNotEmpty()) activeDaysCalories.average() else 0.0
    val todayCalories = dailyTotals.lastOrNull()?.second ?: 0

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(CyberDarkCard)
            .border(1.dp, CyberNeonCyan.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "JOURNAL CYBER CALORIES",
                    color = CyberNeonCyan,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "Force & Consommation",
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black
                )
            }
            Icon(
                imageVector = Icons.Default.ElectricBolt,
                contentDescription = null,
                tint = CyberNeonPink,
                modifier = Modifier.size(24.dp)
            )
        }

        // Custom Paint Chart Canvas
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
        ) {
            val width = size.width
            val height = size.height
            val barSpacing = width / dailyTotals.size
            val barWidth = 14.dp.toPx()

            dailyTotals.forEachIndexed { index, pair ->
                val dayLabel = pair.first
                val value = pair.second

                val barHeight = (value.toFloat() / limitCeiling) * (height - 35.dp.toPx())
                val x = (index * barSpacing) + (barSpacing / 2) - (barWidth / 2)
                val y = height - barHeight - 20.dp.toPx()

                // Draw Cyber Glowing Neon Column
                drawRoundRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(CyberNeonPink, CyberNeonPurple)
                    ),
                    topLeft = Offset(x, y),
                    size = Size(barWidth, barHeight),
                    cornerRadius = CornerRadius(6.dp.toPx(), 6.dp.toPx())
                )

                // Neon glow outline shadow
                if (value > 0) {
                    drawRoundRect(
                        color = CyberNeonPink.copy(alpha = 0.25f),
                        topLeft = Offset(x - 2.dp.toPx(), y - 2.dp.toPx()),
                        size = Size(barWidth + 4.dp.toPx(), barHeight + 4.dp.toPx()),
                        cornerRadius = CornerRadius(8.dp.toPx(), 8.dp.toPx()),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(2.dp.toPx())
                    )
                }

                // Day Label text below
                drawContext.canvas.nativeCanvas.drawText(
                    dayLabel,
                    x + (barWidth / 2),
                    height - 2.dp.toPx(),
                    android.graphics.Paint().apply {
                        color = android.graphics.Color.parseColor("#B0A7C4")
                        textSize = 9.dp.toPx()
                        typeface = android.graphics.Typeface.MONOSPACE
                        textAlign = android.graphics.Paint.Align.CENTER
                    }
                )

                // Calorie label on top
                if (value > 0) {
                    drawContext.canvas.nativeCanvas.drawText(
                        "$value",
                        x + (barWidth / 2),
                        y - 6.dp.toPx(),
                        android.graphics.Paint().apply {
                            color = android.graphics.Color.WHITE
                            textSize = 8.dp.toPx()
                            typeface = android.graphics.Typeface.DEFAULT_BOLD
                            textAlign = android.graphics.Paint.Align.CENTER
                        }
                    )
                }
            }
        }

        // 2. COMPARISON METRIC HUD
        if (averageCalories > 0) {
            val isAboveAverage = todayCalories > averageCalories
            val difference = kotlin.math.abs(todayCalories - averageCalories).toInt()
            val statusColor = if (isAboveAverage) CyberNeonPink else CyberNeonCyan
            val statusText = if (isAboveAverage) "AU-DESSUS" else "EN DESSOUS"

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                    .border(1.dp, statusColor.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(statusColor.copy(alpha = 0.1f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = statusColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "STATUT NUTRITIONNEL DU JOUR",
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace,
                        color = CyberTextGray,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Moyenne: ${averageCalories.toInt()} kcal | Aujourd'hui: $todayCalories kcal",
                        fontSize = 11.sp,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "$statusText de la moyenne hebdomadaire de $difference kcal.",
                        fontSize = 10.sp,
                        color = statusColor,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // 3. MEAL RECOMMENDATIONS HUDS
        MealRecommendations(todayCalories.toDouble())
    }
}

@Composable
fun MealRecommendations(todayCalories: Double) {
    val suggestions = remember(todayCalories) {
        val list = mutableListOf<MealSuggestion>()
        if (todayCalories > 2000) {
            list.add(
                MealSuggestion(
                    title = "Repas Léger de Rééquilibrage",
                    description = "Salade de Quinoa et Poulet Grillé",
                    calories = 420,
                    benefits = "Riche en fibres et protéines maigres pour stabiliser l'index insulinique."
                )
            )
        } else if (todayCalories < 1500) {
            list.add(
                MealSuggestion(
                    title = "Repas Énergétique Combattant",
                    description = "Cyber Bowl de Riz, Saumon et Avocat",
                    calories = 680,
                    benefits = "Acides gras essentiels et glucides complexes pour reconstituer le glycogène."
                )
            )
        } else {
            list.add(
                MealSuggestion(
                    title = "Collation Optimale Post-Entraînement",
                    description = "Yaourt Grec, Baies et Amandes",
                    calories = 250,
                    benefits = "Synthèse musculaire rapide avec apport contrôlé en micronutriments."
                )
            )
        }
        list
    }

    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = "RECOMMANDATIONS DE L'IA ATHLÉTIQUE",
            color = CyberNeonCyan,
            fontSize = 9.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 1.sp
        )

        suggestions.forEach { suggestion ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.2f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, CyberNeonPurple.copy(alpha = 0.15f), RoundedCornerShape(14.dp)),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Fastfood,
                        contentDescription = null,
                        tint = CyberNeonPurple,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = suggestion.title.uppercase(),
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = CyberNeonPink
                        )
                        Text(
                            text = suggestion.description,
                            fontSize = 12.sp,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Portion estimée : ${suggestion.calories} kcal",
                            fontSize = 10.sp,
                            color = CyberNeonCyan,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = suggestion.benefits,
                            fontSize = 9.sp,
                            color = CyberTextGray,
                            lineHeight = 11.sp
                        )
                    }
                }
            }
        }
    }
}

data class MealSuggestion(
    val title: String,
    val description: String,
    val calories: Int,
    val benefits: String
)
