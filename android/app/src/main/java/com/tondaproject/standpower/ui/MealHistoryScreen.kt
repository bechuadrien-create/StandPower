package com.tondaproject.standpower.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.Meal
import com.tondaproject.standpower.ui.components.CalorieHistoryChart
import com.tondaproject.standpower.viewmodel.MealViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MealHistoryScreen(
    viewModel: MealViewModel,
    userId: String,
    onNavigateBack: () -> Unit
) {
    val meals by viewModel.mealHistory.collectAsState()

    // Trigger load of meal history on startup
    LaunchedEffect(userId) {
        viewModel.loadMealHistory(userId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "VOS REPAS & STATS ATHLÉTIQUES",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Retour",
                            tint = CyberNeonCyan
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CyberDarkBg,
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = CyberDarkBg
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            // 1. NEON CALORIE WEEKLY CHART WITH AI SUGGESTIONS
            CalorieHistoryChart(meals)

            // 2. DETAILED SAVED HISTORY HEADER
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "HISTORIQUE DU JOURNAL",
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "${meals.size} repas enregistrés",
                    color = CyberTextGray,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            // 3. MEALS LIST
            if (meals.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .clip(RoundedCornerShape(20.dp))
                        .background(CyberDarkCard)
                        .border(1.dp, CyberNeonPurple.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.CalendarMonth,
                            contentDescription = null,
                            tint = CyberNeonPurple.copy(alpha = 0.6f),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "JOURNAL DE NUTRITION VIDE",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Scannez votre premier repas pour démarrer votre suivi de force.",
                            color = CyberTextGray,
                            fontSize = 10.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(meals, key = { it.id }) { meal ->
                        MealHistoryItem(meal)
                    }
                }
            }
        }
    }
}

@Composable
fun CyberCalorieChart(meals: List<Meal>) {
    // Process last 7 days of calories
    val calendar = Calendar.getInstance()
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

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(CyberDarkCard)
            .border(1.dp, CyberNeonCyan.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "CONSOMMATION HEBDOMADAIRE",
                    color = CyberNeonCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "Calories par jour",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Icon(
                imageVector = Icons.Default.FitnessCenter,
                contentDescription = null,
                tint = CyberNeonPink
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
                
                // Scale factor
                val barHeight = (value.toFloat() / limitCeiling) * (height - 30.dp.toPx())
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

                // Draw neon glow outline shadow if there are calories
                if (value > 0) {
                    drawRoundRect(
                        color = CyberNeonPink.copy(alpha = 0.25f),
                        topLeft = Offset(x - 2.dp.toPx(), y - 2.dp.toPx()),
                        size = Size(barWidth + 4.dp.toPx(), barHeight + 4.dp.toPx()),
                        cornerRadius = CornerRadius(8.dp.toPx(), 8.dp.toPx()),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(2.dp.toPx())
                    )
                }

                // Draw day label text below
                drawContext.canvas.nativeCanvas.drawText(
                    dayLabel,
                    x + (barWidth / 2) - 4.dp.toPx(),
                    height - 2.dp.toPx(),
                    android.graphics.Paint().apply {
                        color = android.graphics.Color.parseColor("#B0A7C4")
                        textSize = 10.dp.toPx()
                        typeface = android.graphics.Typeface.MONOSPACE
                        textAlign = android.graphics.Paint.Align.CENTER
                    }
                )

                // Draw calorie value small label on top of bar if active
                if (value > 0) {
                    drawContext.canvas.nativeCanvas.drawText(
                        "$value",
                        x + (barWidth / 2) - 1.dp.toPx(),
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
    }
}

@Composable
fun MealHistoryItem(meal: Meal) {
    val formatter = remember { SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.FRANCE) }
    val formattedDate = remember(meal.timestamp) {
        meal.timestamp?.let { formatter.format(it) } ?: "Aujourd'hui"
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(CyberDarkCard)
            .border(
                BorderStroke(
                    1.dp,
                    Brush.horizontalGradient(listOf(CyberNeonPurple.copy(alpha = 0.15f), Color.Transparent))
                ),
                RoundedCornerShape(16.dp)
            )
            .padding(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "REPAS DIÉTÉTIQUE",
                        color = CyberNeonPurple,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = formattedDate,
                        color = CyberTextGray,
                        fontSize = 11.sp
                    )
                }

                Text(
                    text = "${meal.totalCalories} kcal",
                    color = CyberNeonCyan,
                    fontWeight = FontWeight.Black,
                    fontSize = 16.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            Divider(color = Color.White.copy(alpha = 0.04f))

            // Food tags row
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                meal.foods.forEach { food ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color.Black.copy(alpha = 0.3f))
                            .border(1.dp, CyberNeonPink.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "${food.name} (${food.calories} kcal)",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

// FlowRow wrapper helper (since FlowRow is Experimental / part of other packages sometimes)
@Composable
fun FlowRow(
    modifier: Modifier = Modifier,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.Start,
    content: @Composable () -> Unit
) {
    androidx.compose.ui.layout.Layout(
        modifier = modifier,
        content = content
    ) { measurables, constraints ->
        val tempPlaceables = measurables.map { it.measure(constraints) }
        
        var rowWidth = 0
        var rowHeight = 0
        var totalHeight = 0
        
        val rows = mutableListOf<List<androidx.compose.ui.layout.Placeable>>()
        var currentRow = mutableListOf<androidx.compose.ui.layout.Placeable>()
        
        tempPlaceables.forEach { placeable ->
            if (rowWidth + placeable.width > constraints.maxWidth) {
                rows.add(currentRow)
                totalHeight += rowHeight
                currentRow = mutableListOf()
                rowWidth = 0
                rowHeight = 0
            }
            currentRow.add(placeable)
            rowWidth += placeable.width + 12
            rowHeight = maxOf(rowHeight, placeable.height)
        }
        if (currentRow.isNotEmpty()) {
            rows.add(currentRow)
            totalHeight += rowHeight
        }

        layout(constraints.maxWidth, totalHeight + 12) {
            var currentY = 0
            rows.forEach { row ->
                var currentX = 0
                var maxH = 0
                row.forEach { placeable ->
                    placeable.placeRelative(currentX, currentY)
                    currentX += placeable.width + 12
                    maxH = maxOf(maxH, placeable.height)
                }
                currentY += maxH + 12
            }
        }
    }
}
