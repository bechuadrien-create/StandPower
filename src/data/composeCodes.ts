/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ComposeFile {
  name: string;
  description: string;
  code: string;
}

export const composeCodes: Record<string, ComposeFile> = {
  theme: {
    name: 'Theme.kt',
    description: 'Configuration du thème athlétique sombre moderne utilisant le schéma de couleurs Material 3.',
    code: `package com.android.fitnesstracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Athletic Dark Color Scheme - high contrast neon & charcoal
private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF10B981),      // Émeraude Accent
    secondary = Color(0xFF1E293B),    // Slate Deep
    background = Color(0xFF050505),   // Noir profond
    surface = Color(0xFF1E293B),      // Arrière-plan cartes
    onPrimary = Color(0xFF000000),
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    error = Color(0xFFEF4444)
)

@Composable
fun BodybuildingTrackerTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}`
  },

  profile: {
    name: 'ProfileScreen.kt',
    description: 'Demande du poids actuel de l\'athlète en kg. Configure les bases physiologiques de l\'application.',
    code: `package com.android.fitnesstracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ProfileScreen(
    onWeightSaved: (Float) -> Unit
) {
    var weightText by remember { mutableStateOf("") }
    var showError by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF050505))
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // En-tête de Marque Athlétique
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 40.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(Color(0xFF10B981), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "KG",
                    fontWeight = FontWeight.Black,
                    fontSize = 22.sp,
                    color = Color.Black
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Bienvenue Athlète",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Définir votre poids de corps permet d'établir les calculs de base des calories selon le principe clinique MET.",
                fontSize = 14.sp,
                color = Color(0xFF94A3B8),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }

        // Carte Saisie de Poids
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF151515)),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "SAISIR LE POIDS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF10B981),
                    letterSpacing = 1.5.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = weightText,
                    onValueChange = {
                        weightText = it
                        showError = false
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    placeholder = { Text("75.0", color = Color(0xFF64748B)) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF10B981),
                        unfocusedBorderColor = Color(0xFF333333),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    suffix = { Text("kg", color = Color.White, fontWeight = FontWeight.Bold) }
                )

                if (showError) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Veuillez entrer un poids valide (> 30kg)",
                        color = Color(0xFFEF4444),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Bouton d'Action principal
        Button(
            onClick = {
                val weight = weightText.toFloatOrNull()
                if (weight != null && weight in 30.0f..300.0f) {
                    onWeightSaved(weight)
                } else {
                    showError = true
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(bottom = 16.dp)
        ) {
            Text(
                text = "CONFIGURER LE MATÉRIEL",
                color = Color.Black,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            )
        }
    }
}`
  },

  workoutInit: {
    name: 'WorkoutInitScreen.kt',
    description: 'Initialise les charges de travail cibles pour les mouvements musculaires du jour.',
    code: `package com.android.fitnesstracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun WorkoutInitScreen(
    userWeight: Float,
    onStartWorkout: (List<ExerciseTarget>) -> Unit
) {
    var benchTargetText by remember { mutableStateOf("60") }
    var rowTargetText by remember { mutableStateOf("22") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF050505))
            .padding(24.dp)
    ) {
        Text(
            text = "CONFIGURATION DE LA SÉANCE",
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF10B981),
            letterSpacing = 2.sp
        )
        Text(
            text = "Définir les Charges Cibles",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Indiquez vos objectifs pour stimuler le muscle. L'hypertrophie optimale s'obtient proche de l'échec.",
            fontSize = 13.sp,
            color = Color(0xFF94A3B8)
        )

        Spacer(modifier = Modifier.height(24.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                TargetInputFieldCard(
                    title = "Exercice 1 : Développé Couché (Barre)",
                    colorHex = 0xFF10B981,
                    value = benchTargetText,
                    onValueChange = { benchTargetText = it },
                    subtitle = "Ratio cible recommandé : \${(userWeight * 0.8).toInt()} kg"
                )
            }
            item {
                TargetInputFieldCard(
                    title = "Exercice 2 : Rowing Bûcheron (Haltère)",
                    colorHex = 0xFF3B82F6,
                    value = rowTargetText,
                    onValueChange = { rowTargetText = it },
                    subtitle = "Ratio cible recommandé : \${(userWeight * 0.3).toInt()} kg"
                )
            }
        }

        Button(
            onClick = {
                val benchVal = benchTargetText.toIntOrNull() ?: 60
                val rowVal = rowTargetText.toIntOrNull() ?: 22
                
                val targets = listOf(
                    ExerciseTarget("bench_press", benchVal, sets = 4, reps = 8),
                    ExerciseTarget("db_row_bucheron", rowVal, sets = 4, reps = 10)
                )
                onStartWorkout(targets)
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
        ) {
            Text(
                text = "COMMENCER L'ENTRAÎNEMENT LOURD",
                color = Color.Black,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }
    }
}

@Composable
fun TargetInputFieldCard(
    title: String,
    colorHex: Long,
    value: String,
    onValueChange: (String) -> Unit,
    subtitle: String
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF121212)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 16.sp
            )
            Text(
                text = subtitle,
                color = Color(0xFF64748B),
                fontSize = 12.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(colorHex),
                    unfocusedBorderColor = Color(0xFF222222),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                suffix = { Text("kg", color = Color.White) },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}`
  },

  exerciseGuides: {
    name: 'ActiveWorkoutScreen.kt',
    description: 'Affiche la séquence d\'exercices active, la validation des séries et les fiches d\'exécution technique.',
    code: `package com.android.fitnesstracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ActiveWorkoutScreen(
    currentExercise: ExerciseGuide,
    targetLoadKg: Int,
    currentSetIndex: Int,
    totalSets: Int,
    onSetCompleted: () -> Unit,
    onFinishWorkout: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF050505))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // En-tête Exercice en Cours
        item {
            Column {
                Text(
                    text = "EXERCICE EN COURS",
                    fontSize = 11.sp,
                    color = Color(0xFF10B981),
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
                )
                Text(
                    text = currentExercise.name,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }

        // Tableau des Objectifs de la Série
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF151515)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.border(1.dp, Color(0xFF222222), RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("CHARGE CIBLE", fontSize = 11.sp, color = Color(0xFF64748B))
                        Text("\$targetLoadKg kg", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                    }
                    Divider(modifier = Modifier.height(30.dp).width(1.dp), color = Color(0xFF333333))
                    Column {
                        Text("SÉRIES COMPLÉTÉES", fontSize = 11.sp, color = Color(0xFF64748B))
                        Text("\$currentSetIndex / \$totalSets Validées", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    }
                }
            }
        }

        // Bouton d'Action pour logger la série
        item {
            Button(
                onClick = onSetCompleted,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
            ) {
                Text(
                    text = "VALIDER LA SÉRIE \${currentSetIndex + 1}",
                    color = Color.Black,
                    fontWeight = FontWeight.Black
                )
            }
        }

        // Fiche d'Exécution Technique Clinique
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF111111)),
                modifier = Modifier.border(1.dp, Color(0xFF222222), RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "FICHE D'EXÉCUTION TECHNIQUE",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF94A3B8),
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Text("Muscles Ciblés :", fontWeight = FontWeight.Bold, color = Color.White)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        currentExercise.targetMuscles.forEach { muscle ->
                            SuggestionChip(
                                onClick = {},
                                label = { Text(muscle) },
                                colors = SuggestionChipDefaults.suggestionChipColors(
                                    labelColor = Color(0xFF10B981),
                                    containerColor = Color(0xFF181818)
                                )
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Consignes d'Exécution :", fontWeight = FontWeight.Bold, color = Color.White)
                    currentExercise.properForm.forEach { tip ->
                        Text("• \$tip", color = Color(0xFF94A3B8), fontSize = 13.sp, modifier = Modifier.padding(vertical = 4.dp))
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Consignes de Sécurité :", fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                    currentExercise.safetyTips.forEach { safety ->
                        Text("⚠️ \$safety", color = Color(0xFFFDA4AF), fontSize = 13.sp, modifier = Modifier.padding(vertical = 4.dp))
                    }
                }
            }
        }
    }
}`
  },

  restTimer: {
    name: 'RestTimerModal.kt',
    description: 'Affiche un compte à rebours réactif géré par coroutines avec temps de repos personnalisables.',
    code: `package com.android.fitnesstracker.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Composable
fun RestTimerModal(
    initialSeconds: Int = 90,
    onSkip: () -> Unit,
    onComplete: () -> Unit
) {
    var timeLeft by remember { mutableStateOf(initialSeconds) }
    val progress = timeLeft.toFloat() / initialSeconds

    // Lancement de la coroutine pour le décompte
    LaunchedEffect(Unit) {
        while (timeLeft > 0) {
            delay(1000L)
            timeLeft--
        }
        onComplete() // Alerte récupérée & repos terminé
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF151515)),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.padding(24.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "TEMPS DE REPOS",
                color = Color(0xFF10B981),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
            Spacer(modifier = Modifier.height(24.dp))

            // Indicateur de Repos Circulaire Animé
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(200.dp)
            ) {
                Canvas(modifier = Modifier.size(200.dp)) {
                    drawArc(
                        color = Color(0xFF222222),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(width = 10.dp.toPx())
                    )
                    drawArc(
                        color = Color(0xFF10B981),
                        startAngle = -90f,
                        sweepAngle = 360f * progress,
                        useCenter = false,
                        style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "\${timeLeft}s",
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text("RÉCUPÉRATION", fontSize = 10.sp, color = Color(0xFF64748B))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Button(
                    onClick = { timeLeft = (timeLeft + 30).coerceAtMost(300) },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF222222))
                ) {
                    Text("+30s", color = Color.White)
                }

                Button(
                    onClick = onSkip,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) {
                    Text("PASSER", color = Color.White)
                }
            }
        }
    }
}`
  },

  summary: {
    name: 'CalorieSummary.kt',
    description: 'Calcul Standard Clinique MET des dépenses énergétiques selon le profil utilisateur et les intensités.',
    code: `package com.android.fitnesstracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SummaryScreen(
    userWeight: Float,
    durationSeconds: Int,
    averageLoadKg: Float,
    onRestart: () -> Unit
) {
    val durationMinutes = durationSeconds / 60f
    val relativeRatio = averageLoadKg / userWeight
    
    // Détermination de l'intensité MET selon la charge
    val computedMet = when {
        relativeRatio < 0.25f -> 4.0f // Effort léger
        relativeRatio < 0.50f -> 6.0f // Culturisme standard
        relativeRatio < 0.80f -> 7.0f // Séance lourde haute intensité
        else -> 8.0f                 // Powerlifting lourd extrême
    }

    val caloriesBurned = (computedMet * 3.5f * userWeight * durationMinutes) / 200f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF050505))
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(
                text = "RÉSUMÉ SÉANCE SPORTIVE",
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF10B981),
                letterSpacing = 2.sp
            )
            Text(
                text = "Séance Terminée !",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Carte d'Énergie MET brûlée
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF151515)),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "ÉNERGIE TOTALE DÉPENSÉE",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "\${"%.1f".format(caloriesBurned)} kcal",
                        fontSize = 42.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF10B981)
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    Divider(color = Color(0xFF333333))

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("DURÉE", fontSize = 10.sp, color = Color(0xFF64748B))
                            Text("\${(durationSeconds/60).toInt()}m \${durationSeconds%60}s", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("MET RETENU", fontSize = 10.sp, color = Color(0xFF64748B))
                            Text("\$computedMet", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("CHARGE MOY.", fontSize = 10.sp, color = Color(0xFF64748B))
                            Text("\${averageLoadKg.toInt()} kg", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }
        }

        Button(
            onClick = onRestart,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
        ) {
            Text(
                text = "PROGRAMMER UNE NOUVELLE SÉANCE",
                color = Color.Black,
                fontWeight = FontWeight.Black
            )
        }
    }
}`
  }
};
