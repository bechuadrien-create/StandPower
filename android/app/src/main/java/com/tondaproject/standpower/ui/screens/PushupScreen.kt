package com.tondaproject.standpower.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MonitorWeight
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.pushupLevels
import com.tondaproject.standpower.ui.components.CyberBackground
import com.tondaproject.standpower.ui.components.CyberDarkBg
import com.tondaproject.standpower.ui.components.CyberDarkCard
import com.tondaproject.standpower.ui.components.CyberNeonCyan
import com.tondaproject.standpower.ui.components.CyberNeonPink
import com.tondaproject.standpower.ui.components.CyberNeonPurple
import com.tondaproject.standpower.ui.components.CyberTextGray
import com.tondaproject.standpower.ui.components.CyberTextButton
import com.tondaproject.standpower.ui.components.GlowButton
import com.tondaproject.standpower.ui.components.getVectorForName
import com.tondaproject.standpower.viewmodel.LevelUpEvent
import com.tondaproject.standpower.viewmodel.PushupViewModel
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PushupScreen(
    viewModel: PushupViewModel,
    userId: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val progress by viewModel.progressState.collectAsState()
    
    // Performance sub-tabs state: 0 = Pushups, 1 = Weight & Records
    var subTabSelected by remember { mutableIntStateOf(0) }

    // Level up animation state
    var showLevelUpPopup by remember { mutableStateOf(false) }
    var levelUpData by remember { mutableStateOf<LevelUpEvent?>(null) }

    // Weight logging local states
    var loggedWeightText by remember { mutableStateOf("") }
    var weightsHistoryList by remember { mutableStateOf(listOf(78.5f, 78.2f, 77.9f, 77.4f)) }
    
    // 1RM records local states
    var bench1RM by remember { mutableIntStateOf(105) }
    var squat1RM by remember { mutableIntStateOf(140) }
    var deadlift1RM by remember { mutableIntStateOf(185) }

    var editing1RMType by remember { mutableStateOf<String?>(null) }
    var editing1RMVal by remember { mutableStateOf("") }

    // Collect level up event
    LaunchedEffect(Unit) {
        viewModel.levelUpEvent.collect { event ->
            levelUpData = event
            showLevelUpPopup = true
            delay(4000)
            showLevelUpPopup = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.TrendingUp,
                            contentDescription = null,
                            tint = CyberNeonCyan,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = "PERFORMANCE ATHLÉTIQUE",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.SansSerif,
                            color = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CyberDarkBg,
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Color.Transparent,
        modifier = modifier
    ) { paddingValues ->
        CyberBackground {
            Box(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Sub-tab selectors (Horizontal slide layout)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CyberDarkCard, RoundedCornerShape(12.dp))
                            .border(1.dp, CyberNeonPurple.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                            .padding(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (subTabSelected == 0) CyberNeonPurple else Color.Transparent)
                                .clickable { subTabSelected = 0 }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "POMPES MILITAIRES",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = if (subTabSelected == 0) Color.White else CyberTextGray
                            )
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (subTabSelected == 1) CyberNeonCyan else Color.Transparent)
                                .clickable { subTabSelected = 1 }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "POIDS & RECORDS 1RM",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = if (subTabSelected == 1) Color.Black else CyberTextGray
                            )
                        }
                    }

                    // Content screens
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        if (subTabSelected == 0) {
                            // TAB 1: PUSHUPS & LEVELS
                            // Active level HUD card
                            Card(
                                colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(
                                        1.dp,
                                        CyberNeonPurple.copy(alpha = 0.3f),
                                        RoundedCornerShape(20.dp)
                                    ),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(18.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Badge icon procedurally drawn
                                    val currentLevelIndex = (progress.level - 1).coerceIn(pushupLevels.indices)
                                    val currentLevel = pushupLevels[currentLevelIndex]

                                    Box(
                                        modifier = Modifier
                                            .size(70.dp)
                                            .background(
                                                Brush.radialGradient(
                                                    colors = listOf(
                                                        currentLevel.badgeColor.copy(alpha = 0.25f),
                                                        Color.Transparent
                                                    )
                                                ),
                                                CircleShape
                                            )
                                            .border(1.5.dp, currentLevel.badgeColor, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = getVectorForName(currentLevel.iconName),
                                            contentDescription = null,
                                            tint = currentLevel.badgeColor,
                                            modifier = Modifier.size(34.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(16.dp))

                                    Column {
                                        Text(
                                            text = "GRADÉ DU COMBAT",
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Black,
                                            fontFamily = FontFamily.Monospace,
                                            color = CyberNeonCyan
                                        )
                                        Text(
                                            text = currentLevel.badgeName.uppercase(),
                                            fontSize = 18.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White
                                        )
                                        Text(
                                            text = "Niveau ${progress.level} | Total: ${progress.reps} pompes",
                                            fontSize = 12.sp,
                                            color = CyberTextGray
                                        )
                                    }
                                }
                            }

                            // Dynamic progress bar to next level
                            val currentLevelIdx = (progress.level - 1).coerceIn(pushupLevels.indices)
                            val currentTier = pushupLevels[currentLevelIdx]
                            val nextTier = pushupLevels.getOrNull(currentLevelIdx + 1)

                            if (nextTier != null) {
                                val repsInTier = progress.reps - currentTier.minReps
                                val maxRepsInTier = nextTier.minReps - currentTier.minReps
                                val ratio = (repsInTier.toFloat() / maxRepsInTier.toFloat()).coerceIn(0f, 1f)

                                Card(
                                    colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(
                                            1.dp,
                                            CyberNeonPink.copy(alpha = 0.15f),
                                            RoundedCornerShape(16.dp)
                                        ),
                                    shape = RoundedCornerShape(16.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = "PROGRESSION DE FORCE",
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace,
                                                color = CyberNeonPink
                                            )
                                            Text(
                                                text = "${progress.reps}/${nextTier.minReps} reps",
                                                fontSize = 10.sp,
                                                fontFamily = FontFamily.Monospace,
                                                color = Color.White
                                            )
                                        }

                                        LinearProgressIndicator(
                                            progress = { ratio },
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(8.dp)
                                                .clip(RoundedCornerShape(4.dp)),
                                            color = CyberNeonPink,
                                            trackColor = Color.White.copy(alpha = 0.08f)
                                        )

                                        Text(
                                            text = "Encore ${nextTier.minReps - progress.reps} pompes pour débloquer le grade '${nextTier.badgeName}' (+${nextTier.rewardXP} XP) !",
                                            fontSize = 9.5.sp,
                                            color = CyberTextGray,
                                            lineHeight = 12.sp
                                        )
                                    }
                                }
                            }

                            // Streak metrics
                            Card(
                                colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(
                                        1.dp,
                                        Color(0xFFFF5722).copy(alpha = 0.15f),
                                        RoundedCornerShape(16.dp)
                                    ),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocalFireDepartment,
                                        contentDescription = null,
                                        tint = Color(0xFFFF5722),
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "SÉRIE DE CONSISTANCE CYBER",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Black,
                                            fontFamily = FontFamily.Monospace,
                                            color = Color(0xFFFF5722)
                                        )
                                        Text(
                                            text = "${progress.streak} JOURS CONSÉCUTIFS ⚡",
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White
                                        )
                                        Text(
                                            text = "Pratiquez de l'exercice chaque jour pour multiplier vos XP !",
                                            fontSize = 10.sp,
                                            color = CyberTextGray
                                        )
                                    }
                                }
                            }

                            // Interactive logger card
                            Card(
                                colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(
                                        1.dp,
                                        CyberNeonCyan.copy(alpha = 0.15f),
                                        RoundedCornerShape(20.dp)
                                    ),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "AJOUTER DES POMPES AU COMPTEUR",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        color = CyberNeonCyan
                                    )

                                    // Quick logging buttons
                                    val quickValues = listOf(5, 10, 25, 50)
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        quickValues.forEach { value ->
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .clip(RoundedCornerShape(10.dp))
                                                    .background(Color.Black.copy(alpha = 0.3f))
                                                    .border(
                                                        1.dp,
                                                        CyberNeonCyan.copy(alpha = 0.3f),
                                                        RoundedCornerShape(10.dp)
                                                    )
                                                    .clickable {
                                                        viewModel.addPushups(value, userId)
                                                        Toast
                                                            .makeText(
                                                                context,
                                                                "+$value pompes enregistrées !",
                                                                Toast.LENGTH_SHORT
                                                            )
                                                            .show()
                                                    }
                                                    .padding(vertical = 12.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = "+$value",
                                                    fontWeight = FontWeight.Black,
                                                    fontSize = 12.sp,
                                                    color = CyberNeonCyan,
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(4.dp))

                                    // Custom input logger
                                    var customRepsInput by remember { mutableStateOf("") }
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        OutlinedTextField(
                                            value = customRepsInput,
                                            onValueChange = { customRepsInput = it },
                                            label = { Text("Nombre personnalisé", fontSize = 11.sp) },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                unfocusedContainerColor = Color.Transparent,
                                                focusedContainerColor = Color.Transparent,
                                                focusedBorderColor = CyberNeonCyan,
                                                unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                                                focusedLabelColor = CyberNeonCyan,
                                                unfocusedLabelColor = CyberTextGray,
                                                focusedTextColor = Color.White,
                                                unfocusedTextColor = Color.White
                                            ),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.weight(1f)
                                        )

                                        Spacer(modifier = Modifier.width(10.dp))

                                        GlowButton(
                                            onClick = {
                                                val count = customRepsInput.toIntOrNull() ?: 0
                                                if (count > 0) {
                                                    viewModel.addPushups(count, userId)
                                                    Toast.makeText(context, "+$count pompes enregistrées !", Toast.LENGTH_SHORT).show()
                                                    customRepsInput = ""
                                                }
                                            },
                                            containerColor = CyberNeonCyan,
                                            contentColor = Color.Black,
                                            height = 48.dp
                                        ) {
                                            Icon(imageVector = Icons.Default.Add, contentDescription = null)
                                        }
                                    }
                                }
                            }

                        } else {
                            // TAB 2: WEIGHTS & POWERLIFTING RECORDS
                            // Weight logger input
                            Card(
                                colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(
                                        1.dp,
                                        CyberNeonCyan.copy(alpha = 0.15f),
                                        RoundedCornerShape(20.dp)
                                    ),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Text(
                                        text = "ENREGISTRER VOTRE POIDS",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        color = CyberNeonCyan
                                    )

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        OutlinedTextField(
                                            value = loggedWeightText,
                                            onValueChange = { loggedWeightText = it },
                                            label = { Text("Poids en kg (ex: 78.5)") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = CyberNeonCyan,
                                                unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                                                focusedLabelColor = CyberNeonCyan,
                                                unfocusedLabelColor = CyberTextGray,
                                                focusedTextColor = Color.White,
                                                unfocusedTextColor = Color.White
                                            ),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.weight(1f)
                                        )
                                        Spacer(modifier = Modifier.width(10.dp))
                                        CyberTextButton(
                                            text = "LOG",
                                            containerColor = CyberNeonCyan,
                                            contentColor = Color.Black,
                                            onClick = {
                                                val value = loggedWeightText.toFloatOrNull()
                                                if (value != null && value > 30f) {
                                                    weightsHistoryList = (listOf(value) + weightsHistoryList).take(5)
                                                    loggedWeightText = ""
                                                    Toast.makeText(context, "Poids enregistré !", Toast.LENGTH_SHORT).show()
                                                } else {
                                                    Toast.makeText(context, "Saisie invalide", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        )
                                    }

                                    // Display list of weights
                                    Text(
                                        text = "HISTORIQUE DU POIDS RECENT",
                                        fontSize = 8.5.sp,
                                        fontFamily = FontFamily.Monospace,
                                        color = CyberTextGray,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        weightsHistoryList.forEachIndexed { idx, valKg ->
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .background(Color.Black.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                                                    .border(1.dp, CyberNeonCyan.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                                                    .padding(8.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                    Icon(
                                                        imageVector = Icons.Default.MonitorWeight,
                                                        contentDescription = null,
                                                        tint = CyberNeonCyan.copy(alpha = 0.5f),
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Text(
                                                        text = "$valKg kg",
                                                        fontSize = 11.sp,
                                                        fontFamily = FontFamily.Monospace,
                                                        fontWeight = FontWeight.Black,
                                                        color = Color.White
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // 1RM Powerlifting Records
                            Card(
                                colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(
                                        1.dp,
                                        CyberNeonPink.copy(alpha = 0.15f),
                                        RoundedCornerShape(20.dp)
                                    ),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Text(
                                        text = "RECORDS DE FORCE MAXIMALE (1-REP MAX)",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        color = CyberNeonPink
                                    )

                                    val records = listOf(
                                        Triple("DÉVELOPPÉ COUCHÉ", bench1RM, "BENCH"),
                                        Triple("SQUAT", squat1RM, "SQUAT"),
                                        Triple("SOULEVÉ DE TERRE", deadlift1RM, "DEADLIFT")
                                    )

                                    records.forEach { (title, valKg, key) ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                                .border(1.dp, CyberNeonPurple.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                                .clickable {
                                                    editing1RMType = key
                                                    editing1RMVal = valKg.toString()
                                                }
                                                .padding(12.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                    imageVector = Icons.Default.FitnessCenter,
                                                    contentDescription = null,
                                                    tint = CyberNeonPurple,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                                Spacer(modifier = Modifier.width(10.dp))
                                                Text(
                                                    text = title,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Black,
                                                    color = Color.White
                                                )
                                            }

                                            Text(
                                                text = "$valKg KG",
                                                color = CyberNeonCyan,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }
                                    }

                                    // Dynamic inline editing panel for records
                                    if (editing1RMType != null) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                                .padding(12.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Text(
                                                text = "MODIFIER RECORD : ${editing1RMType}",
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace,
                                                color = CyberNeonCyan
                                            )
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                OutlinedTextField(
                                                    value = editing1RMVal,
                                                    onValueChange = { editing1RMVal = it },
                                                    label = { Text("Poids Max (kg)", fontSize = 11.sp) },
                                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                    colors = OutlinedTextFieldDefaults.colors(
                                                        focusedBorderColor = CyberNeonCyan,
                                                        unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                                                        focusedTextColor = Color.White,
                                                        unfocusedTextColor = Color.White
                                                    ),
                                                    shape = RoundedCornerShape(10.dp),
                                                    modifier = Modifier.weight(1f)
                                                )
                                                Spacer(modifier = Modifier.width(8.dp))
                                                CyberTextButton(
                                                    text = "SAUVER",
                                                    onClick = {
                                                        val finalVal = editing1RMVal.toIntOrNull() ?: 0
                                                        if (finalVal > 0) {
                                                            when (editing1RMType) {
                                                                "BENCH" -> bench1RM = finalVal
                                                                "SQUAT" -> squat1RM = finalVal
                                                                "DEADLIFT" -> deadlift1RM = finalVal
                                                            }
                                                            editing1RMType = null
                                                            Toast.makeText(context, "Record mis à jour !", Toast.LENGTH_SHORT).show()
                                                        }
                                                    }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 3. LEVEL UP ANIMATED MODAL POPUP (Triggered via Flow Event)
                AnimatedVisibility(
                    visible = showLevelUpPopup,
                    enter = fadeIn(tween(400)) + scaleIn(tween(500)),
                    exit = fadeOut(tween(400)) + scaleOut(tween(500)),
                    modifier = Modifier.align(Alignment.Center)
                ) {
                    levelUpData?.let { event ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                            shape = RoundedCornerShape(24.dp),
                            modifier = Modifier
                                .width(300.dp)
                                .border(
                                    3.dp,
                                    Brush.verticalGradient(
                                        listOf(CyberNeonCyan, CyberNeonPurple, CyberNeonPink)
                                    ),
                                    RoundedCornerShape(24.dp)
                                )
                                .padding(4.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ElectricBolt,
                                    contentDescription = null,
                                    tint = CyberNeonCyan,
                                    modifier = Modifier.size(54.dp)
                                )

                                Text(
                                    text = "LEVEL UP !",
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace,
                                    color = CyberNeonPink,
                                    textAlign = TextAlign.Center
                                )

                                Text(
                                    text = "Nouveau grade débloqué avec succès. Vous devenez plus fort !",
                                    fontSize = 11.sp,
                                    color = CyberTextGray,
                                    textAlign = TextAlign.Center
                                )

                                // Giant Badge Icon
                                Box(
                                    modifier = Modifier
                                        .size(100.dp)
                                        .background(
                                            Brush.radialGradient(
                                                colors = listOf(
                                                    event.newLevel.badgeColor.copy(alpha = 0.3f),
                                                    Color.Transparent
                                                )
                                            ),
                                            CircleShape
                                        )
                                        .border(2.dp, event.newLevel.badgeColor, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = getVectorForName(event.newLevel.iconName),
                                        contentDescription = null,
                                        tint = event.newLevel.badgeColor,
                                        modifier = Modifier.size(50.dp)
                                    )
                                }

                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = event.newLevel.badgeName.uppercase(),
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "Grade Niveau ${event.newLevel.level}",
                                        fontSize = 12.sp,
                                        color = event.newLevel.badgeColor,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Row(
                                    modifier = Modifier
                                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                        .padding(horizontal = 14.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Star,
                                        contentDescription = null,
                                        tint = CyberNeonCyan,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "+${event.rewardXP} REPLAY XP",
                                        color = CyberNeonCyan,
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
