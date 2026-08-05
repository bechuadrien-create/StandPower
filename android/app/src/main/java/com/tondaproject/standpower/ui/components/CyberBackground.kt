package com.tondaproject.standpower.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Color palette constants for convenience
val CyberDarkBg = Color(0xFF0A0516)
val CyberNeonCyan = Color(0xFF00FFFF)
val CyberNeonPurple = Color(0xFF9C27B0)
val CyberNeonPink = Color(0xFFE91E63)
val CyberDarkCard = Color(0xFF140D2B)
val CyberTextGray = Color(0xFFB0A7C4)

@Composable
fun CyberBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "cyber_grid")
    val gridOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 60f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "grid_offset"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(CyberDarkBg)
    ) {
        // Procedural scrolling grid
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            // Background glow gradient
            drawRect(
                brush = Brush.radialGradient(
                    colors = listOf(CyberNeonPurple.copy(alpha = 0.15f), Color.Transparent),
                    center = Offset(width / 2, height / 3),
                    radius = width
                )
            )

            val cellSize = 60f
            val startY = gridOffset

            // Vertical line scrolling effect
            var x = 0f
            while (x < width) {
                // Skew vertical lines towards bottom center for 3D perspective
                val lineAlpha = 0.08f
                drawLine(
                    color = CyberNeonCyan.copy(alpha = lineAlpha),
                    start = Offset(x, 0f),
                    end = Offset((x - width / 2) * 1.5f + width / 2, height),
                    strokeWidth = 1.5f
                )
                x += cellSize
            }

            // Horizontal lines moving downwards
            var y = startY
            while (y < height) {
                val alphaFactor = (y / height).coerceIn(0f, 1f)
                val lineAlpha = 0.04f + (0.08f * alphaFactor)
                drawLine(
                    color = CyberNeonPurple.copy(alpha = lineAlpha),
                    start = Offset(0f, y),
                    end = Offset(width, y),
                    strokeWidth = 1f + (1.5f * alphaFactor)
                )
                y += cellSize
            }
        }

        // Render the children views on top
        content()
    }
}
