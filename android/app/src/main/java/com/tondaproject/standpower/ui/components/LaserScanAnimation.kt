package com.tondaproject.standpower.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp

@Composable
fun LaserScanAnimation(
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "laser_sweep")
    val yPos by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "y_position"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height
        val currentY = yPos * height

        // Draw fluorescent cyan scanning bar
        drawLine(
            brush = Brush.horizontalGradient(
                listOf(
                    CyberNeonCyan.copy(alpha = 0f),
                    CyberNeonCyan,
                    CyberNeonCyan.copy(alpha = 0f)
                )
            ),
            start = Offset(0f, currentY),
            end = Offset(width, currentY),
            strokeWidth = 4.dp.toPx()
        )

        // Soft laser glow overlay expanding outwards
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(
                    CyberNeonCyan.copy(alpha = 0f),
                    CyberNeonCyan.copy(alpha = 0.15f),
                    CyberNeonCyan.copy(alpha = 0f)
                ),
                startY = currentY - 25.dp.toPx(),
                endY = currentY + 25.dp.toPx()
            ),
            topLeft = Offset(0f, currentY - 25.dp.toPx()),
            size = Size(width, 50.dp.toPx())
        )
    }
}
