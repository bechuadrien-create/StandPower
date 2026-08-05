package com.tondaproject.standpower.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun GlowButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = CyberNeonCyan,
    contentColor: Color = Color.Black,
    glowColor: Color = CyberNeonCyan,
    height: Dp = 50.dp,
    border: BorderStroke? = null,
    content: @Composable RowScope.() -> Unit
) {
    var isPressed by remember { mutableStateOf(false) }
    
    // Animate glow size based on pressed state
    val glowRadiusMultiplier by animateFloatAsState(
        targetValue = if (isPressed) 1.4f else 1.0f,
        animationSpec = tween(durationMillis = 150),
        label = "glow_scale"
    )

    Button(
        onClick = onClick,
        modifier = modifier
            .height(height)
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPressed = true
                        tryAwaitRelease()
                        isPressed = false
                    }
                )
            }
            .drawBehind {
                val sizePx = size
                val cornerRadiusPx = 14.dp.toPx()
                
                // Draw soft fluorescent glow shadow in background
                val alpha = if (isPressed) 0.45f else 0.25f
                drawRoundRect(
                    color = glowColor.copy(alpha = alpha),
                    cornerRadius = CornerRadius(cornerRadiusPx, cornerRadiusPx),
                    size = sizePx
                )

                // Additional outer glowing edge
                drawRoundRect(
                    brush = Brush.linearGradient(
                        colors = listOf(glowColor.copy(alpha = alpha), Color.Transparent)
                    ),
                    cornerRadius = CornerRadius(cornerRadiusPx, cornerRadiusPx),
                    size = sizePx
                )
            },
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = contentColor
        ),
        shape = RoundedCornerShape(14.dp),
        border = border,
        content = content
    )
}

@Composable
fun CyberTextButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = CyberNeonPink,
    contentColor: Color = Color.White
) {
    GlowButton(
        onClick = onClick,
        modifier = modifier,
        containerColor = containerColor,
        contentColor = contentColor,
        glowColor = containerColor
    ) {
        Text(
            text = text.uppercase(),
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.5.sp
        )
    }
}
