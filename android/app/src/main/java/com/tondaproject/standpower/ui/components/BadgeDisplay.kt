package com.tondaproject.standpower.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.PushupLevel

@Composable
fun BadgeDisplay(
    level: PushupLevel,
    isUnlocked: Boolean,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "badge_glow")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    val badgeColor = if (isUnlocked) level.badgeColor else Color.Gray.copy(alpha = 0.4f)
    val finalScale = if (isUnlocked) pulseScale else 1.0f

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(76.dp)
                .scale(finalScale)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            badgeColor.copy(alpha = 0.35f),
                            badgeColor.copy(alpha = 0.05f)
                        ),
                        radius = 120f
                    ),
                    CircleShape
                )
                .border(
                    width = 2.dp,
                    brush = Brush.radialGradient(
                        colors = listOf(badgeColor, Color.White.copy(alpha = 0.8f))
                    ),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(CircleShape)
                    .background(if (isUnlocked) CyberDarkCard else Color.Black.copy(alpha = 0.6f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = getVectorForName(level.iconName),
                    contentDescription = level.badgeName,
                    tint = if (isUnlocked) badgeColor else Color.Gray,
                    modifier = Modifier.size(32.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = level.badgeName.uppercase(),
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            color = if (isUnlocked) Color.White else Color.Gray
        )
        Text(
            text = "Niveau ${level.level}",
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.SansSerif,
            color = badgeColor
        )
    }
}

// Utility to translate symbolic string to an available Compose material vector
fun getVectorForName(name: String): ImageVector {
    return when (name) {
        "Trophy" -> Icons.Default.WorkspacePremium
        "Shield" -> Icons.Default.Shield
        "Bolt" -> Icons.Default.Bolt
        "Flame" -> Icons.Default.LocalFireDepartment
        "Star" -> Icons.Default.Star
        "Crown" -> Icons.Default.MilitaryTech
        else -> Icons.Default.WorkspacePremium
    }
}
