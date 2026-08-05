package com.tondaproject.standpower.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Trophy
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

sealed class BottomBarScreen(
    val index: Int,
    val title: String,
    val icon: ImageVector
) {
    object Performance : BottomBarScreen(0, "Stats", Icons.Default.TrendingUp)
    object Challenges : BottomBarScreen(1, "Défis", Icons.Default.Trophy)
    object AthleticAI : BottomBarScreen(2, "AI Hub", Icons.Default.Psychology)
    object Profile : BottomBarScreen(3, "Profil", Icons.Default.Person)
}

@Composable
fun StandPowerBottomBar(
    selectedIndex: Int,
    onTabSelected: (Int) -> Unit,
    onCameraClicked: () -> Unit,
    modifier: Modifier = Modifier
) {
    val screens = listOf(
        BottomBarScreen.Performance,
        BottomBarScreen.Challenges,
        null, // Spacer placeholder for central Camera FAB
        BottomBarScreen.AthleticAI,
        BottomBarScreen.Profile
    )

    val infiniteTransition = rememberInfiniteTransition(label = "fab_pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.Transparent)
            .navigationBarsPadding(),
        contentAlignment = Alignment.BottomCenter
    ) {
        // Main bar backing
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp)
                .height(64.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(CyberDarkCard.copy(alpha = 0.94f))
                .drawBehind {
                    // Symmetrical glowing neon cyber line across the top edge
                    drawLine(
                        brush = Brush.horizontalGradient(
                            colors = listOf(
                                Color.Transparent,
                                CyberNeonCyan,
                                CyberNeonPurple,
                                Color.Transparent
                            )
                        ),
                        start = androidx.compose.ui.geometry.Offset(0f, 0f),
                        end = androidx.compose.ui.geometry.Offset(size.width, 0f),
                        strokeWidth = 2.dp.toPx()
                    )
                }
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            screens.forEach { screen ->
                if (screen == null) {
                    // Central spacing for the camera floating action button
                    Spacer(modifier = Modifier.width(56.dp))
                } else {
                    val isSelected = selectedIndex == screen.index
                    val activeColor = if (screen.index < 2) CyberNeonCyan else CyberNeonPurple
                    
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onTabSelected(screen.index) }
                            .padding(vertical = 4.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = screen.icon,
                            contentDescription = screen.title,
                            tint = if (isSelected) activeColor else CyberTextGray.copy(alpha = 0.6f),
                            modifier = Modifier
                                .size(24.dp)
                                .scale(if (isSelected) 1.1f else 1.0f)
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = screen.title.uppercase(),
                            fontSize = 8.5.sp,
                            fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = if (isSelected) Color.White else CyberTextGray.copy(alpha = 0.6f),
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
        }

        // Central floating camera button (FAB) offset upwards
        Box(
            modifier = Modifier
                .offset(y = (-18).dp)
                .size(56.dp)
                .scale(pulseScale)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(CyberNeonPink, CyberNeonPurple)
                    )
                )
                .drawBehind {
                    // Floating outer glow ring
                    drawCircle(
                        color = CyberNeonPink.copy(alpha = 0.45f),
                        radius = size.minDimension * 0.7f,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(4.dp.toPx())
                    )
                }
                .clickable { onCameraClicked() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.CameraAlt,
                contentDescription = "Scan de repas",
                tint = Color.White,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}
