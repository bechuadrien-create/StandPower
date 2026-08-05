package com.tondaproject.standpower.ui.screens

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.SportType
import com.tondaproject.standpower.ui.components.*
import com.tondaproject.standpower.utils.WearableSyncService
import com.tondaproject.standpower.viewmodel.PushupViewModel
import com.tondaproject.standpower.viewmodel.WorkoutViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AthleticAIHubScreen(
    workoutViewModel: WorkoutViewModel,
    pushupViewModel: PushupViewModel,
    userId: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val selectedMood by workoutViewModel.selectedMood.collectAsState()
    val selectedSport by workoutViewModel.selectedSport.collectAsState()
    val exercises by workoutViewModel.generatedExercises.collectAsState()
    val completedIndices by workoutViewModel.completedIndices.collectAsState()
    val isFinished by workoutViewModel.workoutFinished.collectAsState()
    val xpEarned by workoutViewModel.xpEarned.collectAsState()
    val customWorkouts by workoutViewModel.customWorkouts.collectAsState()

    var saveTitleInput by remember { mutableStateOf("") }

    // Resolve Wearable Service
    val wearableService = remember { WearableSyncService.getInstance(context) }
    val liveHeartRate by wearableService.liveHeartRate.collectAsState()
    val liveSteps by wearableService.liveSteps.collectAsState()
    val liveCalories by wearableService.liveCalories.collectAsState()
    val isConnected by wearableService.isConnected.collectAsState()
    val isAuthorized by wearableService.isAuthorized.collectAsState()
    val isMockMode by wearableService.isMockMode.collectAsState()

    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions.values.all { it }
        if (granted) {
            wearableService.checkPermissions()
            wearableService.connectDevice()
            Toast.makeText(context, "Permissions accordées ! Appairage réussi.", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(context, "Permissions refusées, utilisation de la simulation IA.", Toast.LENGTH_SHORT).show()
            wearableService.connectDevice() // Fallbacks to mock mode safely
        }
    }

    // Capture and save summary stats when workout ends
    LaunchedEffect(isFinished) {
        if (isFinished) {
            val stats = wearableService.getSessionSummary()
            workoutViewModel.saveWorkoutSessionToCloud(
                userId = userId,
                averageHr = stats.averageHeartRate,
                maxHr = stats.maxHeartRate,
                steps = stats.stepsCount,
                calories = stats.caloriesBurned
            )
            wearableService.disconnectDevice()
        }
    }

    LaunchedEffect(userId) {
        if (userId.isNotEmpty()) {
            workoutViewModel.loadCloudCustomWorkouts(userId)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Psychology,
                            contentDescription = null,
                            tint = CyberNeonPurple,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = "ATHLETIC AI HUB",
                            fontSize = 18.sp,
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
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. INTENSITY MOOD SELECTOR
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "1. CHOIX DE L'INTENSITÉ NUTRITION/ENTRAÎNEMENT",
                        color = CyberNeonCyan,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    MoodSelector(
                        selectedMood = selectedMood,
                        onMoodSelected = { workoutViewModel.selectMood(it, userId) }
                    )
                }

                // 2. DISCIPLINE SELECTOR
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "2. SÉLECTION DE VOTRE DISCIPLINE ATHLÉTIQUE",
                        color = CyberNeonCyan,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SportType.entries.forEach { sport ->
                            val isSelected = sport == selectedSport
                            val accentColor = if (isSelected) CyberNeonPink else Color.Transparent
                            val borderCol = if (isSelected) CyberNeonPink else Color.White.copy(alpha = 0.08f)

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isSelected) CyberNeonPink.copy(alpha = 0.1f) else CyberDarkCard)
                                    .border(1.dp, borderCol, RoundedCornerShape(12.dp))
                                    .clickable { workoutViewModel.selectSport(sport, userId) }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.SportsKabaddi,
                                        contentDescription = null,
                                        tint = if (isSelected) CyberNeonPink else CyberTextGray,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = sport.titleFr,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (isSelected) Color.White else CyberTextGray
                                    )
                                }
                            }
                        }
                    }
                }

                // WEARABLE & BIOMETRIC SYNC HUB
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "SYNCHRONISATION BIOMÉTRIQUE LIVE",
                        color = CyberNeonCyan,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )

                    Card(
                        colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, CyberNeonCyan.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Watch,
                                        contentDescription = null,
                                        tint = CyberNeonCyan,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "CAPTEUR CYBER-WEARABLE",
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(
                                                if (isConnected) CyberNeonCyan else Color.Red,
                                                CircleShape
                                            )
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (isConnected) "CONNECTÉ" else "DECONNECTÉ",
                                        color = if (isConnected) CyberNeonCyan else Color.Red,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }

                            if (!isConnected) {
                                Text(
                                    text = "Connectez votre montre ou bracelet sportif pour enregistrer votre rythme cardiaque et optimiser vos dépenses énergétiques.",
                                    color = CyberTextGray,
                                    fontSize = 11.sp,
                                    lineHeight = 14.sp
                                )

                                GlowButton(
                                    onClick = {
                                        if (wearableService.checkPermissions()) {
                                            wearableService.connectDevice()
                                        } else {
                                            permissionLauncher.launch(
                                                arrayOf(
                                                    "android.permission.BODY_SENSORS",
                                                    "android.permission.ACTIVITY_RECOGNITION"
                                                )
                                            )
                                        }
                                    },
                                    containerColor = CyberNeonCyan,
                                    contentColor = Color.Black,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("SYNCHRONISER MON BRACELET", fontWeight = FontWeight.Black, fontSize = 11.sp)
                                }
                            } else {
                                // Live telemetry layout
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    // Heart Rate Pulse Column
                                    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                                    val heartScale by infiniteTransition.animateFloat(
                                        initialValue = 0.9f,
                                        targetValue = 1.25f,
                                        animationSpec = infiniteRepeatable(
                                            animation = tween(650, easing = LinearEasing),
                                            repeatMode = RepeatMode.Reverse
                                        ),
                                        label = "heartScale"
                                    )

                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                            .padding(12.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Icon(
                                                imageVector = Icons.Default.Favorite,
                                                contentDescription = null,
                                                tint = CyberNeonPink,
                                                modifier = Modifier
                                                    .size(24.dp)
                                                    .graphicsLayer(scaleX = heartScale, scaleY = heartScale)
                                            )
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = if (liveHeartRate > 0) "$liveHeartRate BPM" else "--- BPM",
                                                color = Color.White,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = "FRÉQUENCE CARDIAQUE",
                                                color = CyberTextGray,
                                                fontSize = 8.sp,
                                                textAlign = TextAlign.Center
                                            )
                                        }
                                    }

                                    // Calories Column
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                            .padding(12.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Icon(
                                                imageVector = Icons.Default.LocalFireDepartment,
                                                contentDescription = null,
                                                tint = CyberNeonCyan,
                                                modifier = Modifier.size(24.dp)
                                            )
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = "${liveCalories.toInt()} KCAL",
                                                color = Color.White,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = "CALORIES BRÛLÉES",
                                                color = CyberTextGray,
                                                fontSize = 8.sp,
                                                textAlign = TextAlign.Center
                                            )
                                        }
                                    }

                                    // Steps Column
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                            .padding(12.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Icon(
                                                imageVector = Icons.Default.DirectionsRun,
                                                contentDescription = null,
                                                tint = CyberNeonPurple,
                                                modifier = Modifier.size(24.dp)
                                            )
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = "$liveSteps PAS",
                                                color = Color.White,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = "PODOMÈTRE ACTIVE",
                                                color = CyberTextGray,
                                                fontSize = 8.sp,
                                                textAlign = TextAlign.Center
                                            )
                                        }
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (isMockMode) "MOCK INTELLIGENT ACTIF 💻" else "BIOMÉTRIE DIRECTE 🦾",
                                        color = if (isMockMode) CyberNeonPurple else CyberNeonCyan,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )

                                    Text(
                                        text = "DECONNECTER",
                                        color = CyberNeonPink,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier
                                            .clickable {
                                                wearableService.disconnectDevice()
                                                Toast.makeText(context, "Wearable déconnecté.", Toast.LENGTH_SHORT).show()
                                            }
                                            .padding(4.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // 3. GENERATED TACTICAL WORKOUT LIST
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "3. DRILLS SÉLECTIONNÉS PAR L'IA",
                            color = CyberNeonCyan,
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )

                        Text(
                            text = "${exercises.size} exercices",
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = CyberTextGray
                        )
                    }

                    // Exercises list container
                    exercises.forEachIndexed { index, exercise ->
                        val isCompleted = completedIndices.contains(index)
                        val cardColor = if (isCompleted) CyberNeonCyan.copy(alpha = 0.05f) else CyberDarkCard
                        val borderBrush = if (isCompleted) {
                            Brush.linearGradient(listOf(CyberNeonCyan, Color.Transparent))
                        } else {
                            Brush.linearGradient(listOf(Color.White.copy(alpha = 0.04f), Color.Transparent))
                        }

                        Card(
                            colors = CardDefaults.cardColors(containerColor = cardColor),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(
                                    1.dp,
                                    if (isCompleted) CyberNeonCyan.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.04f),
                                    RoundedCornerShape(14.dp)
                                )
                                .clickable { workoutViewModel.toggleExercise(index) },
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .background(
                                                if (isCompleted) CyberNeonCyan.copy(alpha = 0.12f) else Color.White.copy(
                                                    alpha = 0.02f
                                                ),
                                                CircleShape
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                            contentDescription = null,
                                            tint = if (isCompleted) CyberNeonCyan else CyberTextGray,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column {
                                        Text(
                                            text = exercise.name,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                        Text(
                                            text = "${exercise.sets} séries • " + if (exercise.isDurationBased) "${exercise.repsOrDurationSec} sec" else "${exercise.repsOrDurationSec} reps",
                                            fontSize = 10.sp,
                                            color = CyberTextGray
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 4. SAUVEGARDER L'ENTRAÎNEMENT ACTUEL
                    if (exercises.isNotEmpty()) {
                        Column(
                            modifier = Modifier.padding(top = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "ENREGISTRER LA SÉANCE IA",
                                color = CyberNeonCyan,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 1.sp
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = saveTitleInput,
                                    onValueChange = { saveTitleInput = it },
                                    label = { Text("Nom de la séance", fontSize = 11.sp) },
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

                                GlowButton(
                                    onClick = {
                                        if (saveTitleInput.isNotBlank()) {
                                            workoutViewModel.createCustomWorkout(saveTitleInput, exercises, userId)
                                            saveTitleInput = ""
                                            Toast.makeText(context, "Séance enregistrée !", Toast.LENGTH_SHORT).show()
                                        } else {
                                            Toast.makeText(context, "Veuillez entrer un nom", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    containerColor = CyberNeonCyan,
                                    contentColor = Color.Black,
                                    modifier = Modifier.height(56.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Save,
                                        contentDescription = null,
                                        tint = Color.Black,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // 5. VOS SÉANCES PERSONNALISÉES
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "4. VOS SÉANCES PERSONNALISÉES",
                        color = CyberNeonCyan,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )

                    if (customWorkouts.isEmpty()) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, Color.White.copy(alpha = 0.04f), RoundedCornerShape(16.dp)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Aucune séance personnalisée enregistrée.\nSauvegardez l'entraînement IA ci-dessus pour la retrouver ici !",
                                    fontSize = 11.sp,
                                    color = CyberTextGray,
                                    textAlign = TextAlign.Center,
                                    lineHeight = 15.sp
                                )
                            }
                        }
                    } else {
                        customWorkouts.forEach { workout ->
                            val numExercises = workout.exercisesSerialized.split(";;;").filter { it.isNotEmpty() }.size
                            Card(
                                colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, CyberNeonPurple.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.FitnessCenter,
                                            contentDescription = null,
                                            tint = CyberNeonPurple,
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.width(14.dp))
                                        Column {
                                            Text(
                                                text = workout.title.uppercase(),
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Black,
                                                color = Color.White,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = "$numExercises exercices",
                                                fontSize = 10.sp,
                                                color = CyberTextGray
                                            )
                                        }
                                    }

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        GlowButton(
                                            onClick = {
                                                workoutViewModel.startCustomWorkout(workout)
                                                Toast.makeText(context, "Séance démarrée !", Toast.LENGTH_SHORT).show()
                                            },
                                            containerColor = CyberNeonCyan,
                                            contentColor = Color.Black,
                                            modifier = Modifier.height(36.dp)
                                        ) {
                                            Text("DÉMARRER", fontSize = 10.sp, fontWeight = FontWeight.Black)
                                        }

                                        Icon(
                                            imageVector = Icons.Default.Delete,
                                            contentDescription = "Supprimer",
                                            tint = CyberNeonPink,
                                            modifier = Modifier
                                                .size(24.dp)
                                                .clickable {
                                                    workoutViewModel.deleteCustomWorkout(workout.id, userId)
                                                    Toast.makeText(context, "Séance supprimée !", Toast.LENGTH_SHORT).show()
                                                }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // 5. SUCCESS WORKOUT COMPLETED FEEDBACK
                AnimatedVisibility(
                    visible = isFinished,
                    enter = fadeIn(tween(400)) + scaleIn(tween(500)),
                    exit = fadeOut(tween(400)) + scaleOut(tween(500))
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(2.dp, CyberNeonPink, RoundedCornerShape(20.dp)),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.EmojiEvents,
                                contentDescription = null,
                                tint = CyberNeonPink,
                                modifier = Modifier.size(44.dp)
                            )

                            Text(
                                text = "ENTRAÎNEMENT CYBER ACCOMPLI ! 🦾",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                color = Color.White,
                                textAlign = TextAlign.Center
                            )

                            Text(
                                text = "Vous avez accompli l'ensemble des drills prescrits. Vos indicateurs de force s'améliorent.",
                                fontSize = 11.sp,
                                color = CyberTextGray,
                                textAlign = TextAlign.Center
                            )

                            // Wearable summary statistics
                            val finalStats = wearableService.getSessionSummary()
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                    .padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "STATS SÉANCE CONNECTÉE :",
                                    color = CyberNeonCyan,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = TextAlign.Center
                                )

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceAround
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${finalStats.averageHeartRate} BPM", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                        Text("FC Moyenne", color = CyberTextGray, fontSize = 9.sp)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${finalStats.maxHeartRate} BPM", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                        Text("FC Max", color = CyberTextGray, fontSize = 9.sp)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${finalStats.caloriesBurned} KCAL", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                        Text("Énergie", color = CyberTextGray, fontSize = 9.sp)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${finalStats.stepsCount}", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                        Text("Pas", color = CyberTextGray, fontSize = 9.sp)
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                    .padding(horizontal = 14.dp, vertical = 6.dp),
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
                                    text = "+$xpEarned XP ENREGISTRÉS",
                                    color = CyberNeonCyan,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Black
                                )
                            }

                            GlowButton(
                                onClick = {
                                    pushupViewModel.addPushups(0, userId) // Triggers Profile Sync
                                    pushupViewModel.addPushups(xpEarned / 10, userId)
                                    workoutViewModel.resetProgress()
                                    Toast.makeText(context, "XP sauvegardé avec succès !", Toast.LENGTH_SHORT).show()
                                },
                                containerColor = CyberNeonPink,
                                contentColor = Color.White,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("RECLAMER LES RECOMPENSES", fontWeight = FontWeight.Black, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
