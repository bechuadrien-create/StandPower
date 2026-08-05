package com.tondaproject.standpower.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.pushupLevels
import com.tondaproject.standpower.ui.components.BadgeDisplay
import com.tondaproject.standpower.ui.components.CyberBackground
import com.tondaproject.standpower.ui.components.CyberDarkBg
import com.tondaproject.standpower.ui.components.CyberDarkCard
import com.tondaproject.standpower.ui.components.CyberNeonCyan
import com.tondaproject.standpower.ui.components.CyberNeonPink
import com.tondaproject.standpower.ui.components.CyberNeonPurple
import com.tondaproject.standpower.ui.components.CyberTextGray
import com.tondaproject.standpower.viewmodel.PushupViewModel

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(
    viewModel: PushupViewModel,
    userId: String,
    modifier: Modifier = Modifier
) {
    val progress by viewModel.progressState.collectAsState()
    val unlockedBadges by viewModel.unlockedBadges.collectAsState()

    // Map unlocked badges name set for easy lookup
    val unlockedBadgeNames = remember(unlockedBadges) {
        unlockedBadges.map { it.badgeName }.toSet()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = CyberNeonCyan,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = "PROFIL CYBER-ATHLÈTE",
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
                // 1. MAIN XP CIRCULAR COMPASS CARD
                Card(
                    colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, CyberNeonCyan.copy(alpha = 0.2f), RoundedCornerShape(24.dp)),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Giant Circular Custom Paint Meter for XP
                        Box(
                            modifier = Modifier.size(160.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            // Formula: standard circular sector
                            // Level caps represent 1000 XP milestones
                            val xpLevelBase = (progress.level - 1) * 1000
                            val xpInCurrentLevel = (progress.xp - xpLevelBase).coerceIn(0, 1000)
                            val progressRatio = xpInCurrentLevel.toFloat() / 1000f

                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val strokeWidthPx = 10.dp.toPx()
                                // Background circular track
                                drawCircle(
                                    color = Color.White.copy(alpha = 0.05f),
                                    style = Stroke(strokeWidthPx)
                                )

                                // Active progress indicator arc with fluorescent gradient
                                drawArc(
                                    brush = Brush.sweepGradient(
                                        colors = listOf(CyberNeonPurple, CyberNeonCyan, CyberNeonPink, CyberNeonPurple)
                                    ),
                                    startAngle = -90f,
                                    sweepAngle = progressRatio * 360f,
                                    useCenter = false,
                                    style = Stroke(strokeWidthPx)
                                )
                            }

                            // Inner label HUD
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "NIVEAU",
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = CyberNeonCyan,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${progress.level}",
                                    fontSize = 38.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Text(
                                    text = "${progress.xp} XP",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    color = CyberNeonPink
                                )
                            }
                        }

                        // Symmetrical metadata indicators below
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "TOTAL POMPES",
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = CyberTextGray
                                )
                                Text(
                                    text = "${progress.reps}",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .width(1.dp)
                                    .height(24.dp)
                                    .background(Color.White.copy(alpha = 0.1f))
                            )

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "STREAK DE CONSISTANCE",
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = CyberTextGray
                                )
                                Text(
                                    text = "${progress.streak} Jours",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color(0xFFFF5722)
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .width(1.dp)
                                    .height(24.dp)
                                    .background(Color.White.copy(alpha = 0.1f))
                            )

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "BADGES OBTENUS",
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = CyberTextGray
                                )
                                Text(
                                    text = "${unlockedBadgeNames.size}/${pushupLevels.size}",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = CyberNeonCyan
                                )
                            }
                        }
                    }
                }

                // 2. DETAILED GRID OF ACHIEVED BADGES (BENTO LAYOUT)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "GRADES DE LA DIVISION STANDPOWER",
                            color = CyberNeonCyan,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )

                        Icon(
                            imageVector = Icons.Default.WorkspacePremium,
                            contentDescription = null,
                            tint = CyberNeonCyan,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, CyberNeonPurple.copy(alpha = 0.15f), RoundedCornerShape(20.dp)),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        FlowRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceAround,
                            maxItemsInEachRow = 3
                        ) {
                            pushupLevels.forEach { level ->
                                val isUnlocked = unlockedBadgeNames.contains(level.badgeName)
                                BadgeDisplay(
                                    level = level,
                                    isUnlocked = isUnlocked,
                                    modifier = Modifier.padding(8.dp)
                                )
                            }
                        }
                    }
                }

                // 3. SECURE LOCAL ACCOUNT INFO
                Card(
                    colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, Color.White.copy(alpha = 0.04f), RoundedCornerShape(16.dp)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.ElectricBolt,
                            contentDescription = null,
                            tint = CyberNeonPink,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "SÉCURITÉ & PROPRIÉTÉ DU JOURNAL",
                                fontSize = 8.sp,
                                fontFamily = FontFamily.Monospace,
                                color = CyberNeonPink,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Journal ID : ${userId.take(12)}... [SÉCURISÉ]",
                                fontSize = 11.sp,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Conforme RGPD : vos données de calories et de force sont privées et encryptées dans Firebase Firestore.",
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
}
