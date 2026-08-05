package com.tondaproject.standpower.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.Mood

@Composable
fun MoodSelector(
    selectedMood: Mood,
    onMoodSelected: (Mood) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Mood.entries.forEach { mood ->
            MoodCard(
                mood = mood,
                isSelected = mood == selectedMood,
                onClick = { onMoodSelected(mood) },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun MoodCard(
    mood: Mood,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scaleFactor by animateFloatAsState(targetValue = if (isSelected) 1.03f else 1.0f, label = "card_scale")
    val cardColor = if (isSelected) mood.color.copy(alpha = 0.12f) else CyberDarkCard
    val borderColor = if (isSelected) mood.color else Color.White.copy(alpha = 0.05f)

    Card(
        colors = CardDefaults.cardColors(
            containerColor = cardColor
        ),
        modifier = modifier
            .scale(scaleFactor)
            .clip(RoundedCornerShape(16.dp))
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                brush = Brush.linearGradient(
                    colors = listOf(borderColor, if (isSelected) Color.White else Color.Transparent)
                ),
                shape = RoundedCornerShape(16.dp)
            )
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = getIconForMood(mood.iconName),
                contentDescription = mood.titleFr,
                tint = if (isSelected) mood.color else Color.White.copy(alpha = 0.6f),
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = mood.titleFr,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = if (isSelected) mood.color else Color.White
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = mood.descFr,
                fontSize = 8.sp,
                color = CyberTextGray,
                textAlign = TextAlign.Center,
                lineHeight = 10.sp,
                maxLines = 3
            )
        }
    }
}

private fun getIconForMood(iconName: String): ImageVector {
    return when (iconName) {
        "Flame" -> Icons.Default.LocalFireDepartment
        "DirectionsRun" -> Icons.Default.DirectionsRun
        "FitnessCenter" -> Icons.Default.FitnessCenter
        else -> Icons.Default.FitnessCenter
    }
}
