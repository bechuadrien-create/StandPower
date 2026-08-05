package com.tondaproject.standpower.ui

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.tondaproject.standpower.data.FoodItem
import com.tondaproject.standpower.viewmodel.MealViewModel
import com.tondaproject.standpower.viewmodel.ScanState
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

// Cyan, Violet & Pink Neon Color Palette
val CyberNeonCyan = Color(0xFF00FFFF)
val CyberNeonPurple = Color(0xFF9C27B0)
val CyberNeonPink = Color(0xFFE91E63)
val CyberDarkBg = Color(0xFF0A0516)
val CyberDarkCard = Color(0xFF140D2B)
val CyberTextGray = Color(0xFFB0A7C4)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MealScannerScreen(
    viewModel: MealViewModel,
    userId: String,
    onNavigateToHistory: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // States
    val scanState by viewModel.scanState.collectAsState()
    val saveStatus by viewModel.saveStatus.collectAsState()

    var capturedBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    var showCameraPreview by remember { mutableStateOf(false) }
    var isAnalyzing by remember { mutableStateOf(false) }

    // CameraX instance helpers
    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }
    val imageCapture: ImageCapture = remember { ImageCapture.Builder().build() }

    // Request permissions launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
        if (isGranted) {
            showCameraPreview = true
        } else {
            Toast.makeText(context, "Permission caméra refusée. Mode simulation activé.", Toast.LENGTH_LONG).show()
        }
    }

    // Monitor Firebase save status to show toasts
    LaunchedEffect(saveStatus) {
        saveStatus?.let { result ->
            if (result.isSuccess) {
                Toast.makeText(context, "Repas sauvegardé avec succès dans StandPower ! 🦾", Toast.LENGTH_SHORT).show()
                capturedBitmap = null // reset picture
            } else {
                Toast.makeText(context, "Erreur de sauvegarde : ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Fastfood,
                            contentDescription = null,
                            tint = CyberNeonCyan,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = "STANDPOWER DIET SCAN",
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
        containerColor = CyberDarkBg
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Cyberpunk Intro Banner
            CyberBanner()

            // 1. SCANNING STAGE OR CAMERA VIEWPORT
            if (showCameraPreview && hasCameraPermission) {
                // CAMERA VIEWER CONTAINER
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(340.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .border(2.dp, CyberNeonCyan, RoundedCornerShape(24.dp))
                ) {
                    CameraPreviewView(
                        imageCapture = imageCapture,
                        executor = cameraExecutor,
                        onImageCaptured = { bitmap ->
                            capturedBitmap = bitmap
                            showCameraPreview = false
                        },
                        onError = { error ->
                            Toast.makeText(context, "Erreur Camera: $error", Toast.LENGTH_SHORT).show()
                        }
                    )

                    // Overlay HUD guidelines
                    CyberHudLines()

                    // Pulse Red Recording indicator
                    Box(
                        modifier = Modifier
                            .padding(16.dp)
                            .size(12.dp)
                            .align(Alignment.TopEnd)
                            .background(Color.Red, CircleShape)
                    )
                }

                // Button Row for Camera controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = {
                            takePhoto(
                                context = context,
                                imageCapture = imageCapture,
                                executor = cameraExecutor,
                                onImageCaptured = { bitmap ->
                                    capturedBitmap = bitmap
                                    showCameraPreview = false
                                }
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CyberNeonPink),
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("DÉCLENCHER LE CAPTEUR", fontWeight = FontWeight.Bold, color = Color.White)
                    }

                    OutlinedButton(
                        onClick = { showCameraPreview = false },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = CyberNeonCyan),
                        border = BorderStroke(1.dp, CyberNeonCyan),
                        modifier = Modifier.height(50.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("ANNULER", fontWeight = FontWeight.Bold)
                    }
                }

            } else {
                // PHOTO PREVIEW / SELECTION CONTAINER
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(CyberDarkCard)
                        .border(
                            width = 2.dp,
                            brush = Brush.horizontalGradient(
                                listOf(CyberNeonPurple, CyberNeonPink)
                            ),
                            shape = RoundedCornerShape(24.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (capturedBitmap != null) {
                        Image(
                            bitmap = capturedBitmap!!.asImageBitmap(),
                            contentDescription = "Repas capturé",
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(RoundedCornerShape(24.dp)),
                            contentScale = ContentScale.Crop
                        )

                        // Scan Animation overlay while analyzing
                        if (scanState is ScanState.Loading) {
                            LaserScanAnimation()
                        }
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.padding(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Camera,
                                contentDescription = null,
                                tint = CyberNeonPurple,
                                modifier = Modifier
                                    .size(54.dp)
                                    .padding(bottom = 12.dp)
                            )
                            Text(
                                text = "CYBER DETECTEUR D'ALIMENTS",
                                color = Color.White,
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "Capturez votre assiette pour une estimation calorique instantanée.",
                                color = CyberTextGray,
                                fontSize = 11.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }
                    }
                }

                // Action controls for Photo taking & simulation
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            if (hasCameraPermission) {
                                showCameraPreview = true
                            } else {
                                permissionLauncher.launch(Manifest.permission.CAMERA)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CyberNeonCyan),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .drawBehind {
                                // Subtle neon glow shadow
                                drawRoundRect(
                                    color = CyberNeonCyan,
                                    alpha = 0.3f,
                                    cornerRadius = CornerRadius(12.dp.toPx(), 12.dp.toPx())
                                )
                            },
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.PhotoCamera, contentDescription = null, tint = Color.Black)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("PRENDRE UNE PHOTO", fontWeight = FontWeight.Black, color = Color.Black)
                    }

                    // Simulated trigger for emulators or testing
                    OutlinedButton(
                        onClick = {
                            // Generate mock food bitmap to test labeling logic locally
                            capturedBitmap = generateMockFoodBitmap(context)
                            Toast.makeText(context, "Image de test (Burger + Frites) générée !", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = CyberNeonPurple),
                        border = BorderStroke(1.dp, CyberNeonPurple),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Fastfood, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("SIMULER IMAGE (EMULATEUR)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // 2. RUN AI ANALYSIS
            if (capturedBitmap != null && !showCameraPreview) {
                Button(
                    onClick = {
                        viewModel.analyzeMeal(capturedBitmap!!, context)
                    },
                    enabled = scanState !is ScanState.Loading,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = CyberNeonPink,
                        disabledContainerColor = CyberNeonPink.copy(alpha = 0.5f)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (scanState is ScanState.Loading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Icon(Icons.Default.Analytics, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("🔥 ANALYSER LES CALORIES IA", fontWeight = FontWeight.Black, color = Color.White)
                    }
                }
            }

            // 3. SCANNING RESULTS HUD
            AnimatedVisibility(
                visible = scanState !is ScanState.Idle,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(CyberDarkCard)
                        .border(1.dp, CyberNeonPurple.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    when (val state = scanState) {
                        is ScanState.Loading -> {
                            Text(
                                text = "ANALYSE COGNITIVE EN COURS...",
                                color = CyberNeonCyan,
                                fontWeight = FontWeight.Black,
                                fontSize = 12.sp,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Center
                            )
                        }
                        is ScanState.Success -> {
                            // Header Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Companion.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "ALIMENTS DÉTECTÉS",
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = "${state.totalCalories} kcal",
                                    color = CyberNeonCyan,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 18.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }

                            Divider(color = CyberNeonPurple.copy(alpha = 0.2f))

                            // Foods list
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                state.foods.forEach { food ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.Companion.SpaceBetween
                                    ) {
                                        Text(
                                            text = food.name,
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                        Text(
                                            text = "${food.calories} kcal",
                                            color = CyberNeonPink,
                                            fontWeight = FontWeight.Black,
                                            fontSize = 13.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            // SAVE BUTTON
                            Button(
                                onClick = { viewModel.saveMealToFirebase(userId) },
                                colors = ButtonDefaults.buttonColors(containerColor = CyberNeonCyan),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Save, contentDescription = null, tint = Color.Black)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("💾 ENREGISTRER DANS FIREBASE", fontWeight = FontWeight.Black, color = Color.Black)
                            }
                        }
                        is ScanState.Error -> {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Red.copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                                    .border(1.dp, Color.Red.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Error, contentDescription = null, tint = Color.Red)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = state.message,
                                    color = Color.Red,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        else -> {}
                    }
                }
            }

            // 4. HISTORIC ROUTING
            Button(
                onClick = onNavigateToHistory,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                border = BorderStroke(1.dp, CyberNeonCyan),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.History, contentDescription = null, tint = CyberNeonCyan)
                Spacer(modifier = Modifier.width(8.dp))
                Text("📊 VOIR L'HISTORIQUE DE NUTRITION", color = CyberNeonCyan, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun CyberBanner() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(CyberDarkCard, RoundedCornerShape(16.dp))
            .border(1.dp, CyberNeonCyan.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(CyberNeonCyan, CircleShape)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "SCAN DE REPAS RGPD CONFORME : AUCUNE PHOTO N'EST CONSERVÉE.",
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = CyberNeonCyan,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun CameraPreviewView(
    imageCapture: ImageCapture,
    executor: ExecutorService,
    onImageCaptured: (Bitmap) -> Unit,
    onError: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }

    LaunchedEffect(Unit) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture
                )
            } catch (e: Exception) {
                onError(e.localizedMessage ?: "Inconnu")
            }
        }, ContextCompat.getMainExecutor(context))
    }

    AndroidView(
        factory = { previewView },
        modifier = Modifier.fillMaxSize()
    )
}

fun takePhoto(
    context: Context,
    imageCapture: ImageCapture,
    executor: ExecutorService,
    onImageCaptured: (Bitmap) -> Unit
) {
    val photoFile = File(
        context.cacheDir,
        SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.US).format(System.currentTimeMillis()) + ".jpg"
    )

    val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

    imageCapture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                val savedUri = outputFileResults.savedUri ?: Uri.fromFile(photoFile)
                val bitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
                
                // Remove temporary file as we only keep the values (RGPD Compliant)
                if (photoFile.exists()) {
                    photoFile.delete()
                }

                if (bitmap != null) {
                    onImageCaptured(bitmap)
                }
            }

            override fun onError(exception: ImageCaptureException) {
                Log.e("CameraX", "Échec de la capture", exception)
            }
        }
    )
}

@Composable
fun CyberHudLines() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height
        val cornerSize = 30.dp.toPx()
        val strokeWidth = 3.dp.toPx()

        // Draw camera frame target brackets
        // Top-Left Corner
        drawPath(
            path = androidx.compose.ui.graphics.Path().apply {
                moveTo(cornerSize, strokeWidth)
                lineTo(strokeWidth, strokeWidth)
                lineTo(strokeWidth, cornerSize)
            },
            color = CyberNeonCyan,
            style = Stroke(strokeWidth)
        )

        // Top-Right Corner
        drawPath(
            path = androidx.compose.ui.graphics.Path().apply {
                moveTo(width - cornerSize, strokeWidth)
                lineTo(width - strokeWidth, strokeWidth)
                lineTo(width - strokeWidth, cornerSize)
            },
            color = CyberNeonCyan,
            style = Stroke(strokeWidth)
        )

        // Bottom-Left Corner
        drawPath(
            path = androidx.compose.ui.graphics.Path().apply {
                moveTo(cornerSize, height - strokeWidth)
                lineTo(strokeWidth, height - strokeWidth)
                lineTo(strokeWidth, height - cornerSize)
            },
            color = CyberNeonCyan,
            style = Stroke(strokeWidth)
        )

        // Bottom-Right Corner
        drawPath(
            path = androidx.compose.ui.graphics.Path().apply {
                moveTo(width - cornerSize, height - strokeWidth)
                lineTo(width - strokeWidth, height - strokeWidth)
                lineTo(width - strokeWidth, height - cornerSize)
            },
            color = CyberNeonCyan,
            style = Stroke(strokeWidth)
        )
    }
}

@Composable
fun LaserScanAnimation() {
    val infiniteTransition = rememberInfiniteTransition()
    val yPos by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Canvas(modifier = Modifier.fillMaxSize()) {
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

        // Soft laser glow overlay
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(
                    CyberNeonCyan.copy(alpha = 0f),
                    CyberNeonCyan.copy(alpha = 0.12f),
                    CyberNeonCyan.copy(alpha = 0f)
                ),
                startY = currentY - 30.dp.toPx(),
                endY = currentY + 30.dp.toPx()
            ),
            topLeft = Offset(0f, currentY - 30.dp.toPx()),
            size = Size(width, 60.dp.toPx())
        )
    }
}

// Generates a mock image containing text or outlines of burger & fries for emulator testing
fun generateMockFoodBitmap(context: Context): Bitmap {
    val bitmap = Bitmap.createBitmap(400, 300, Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    val paint = android.graphics.Paint().apply {
        color = android.graphics.Color.parseColor("#140D2B")
    }
    // BG
    canvas.drawRect(0f, 0f, 400f, 300f, paint)

    // Burger outline (Orange-red)
    paint.color = android.graphics.Color.parseColor("#E91E63")
    paint.strokeWidth = 8f
    paint.style = android.graphics.Paint.Style.STROKE
    canvas.drawCircle(150f, 150f, 60f, paint) // burger body

    // Fries lines (Yellow)
    paint.color = android.graphics.Color.parseColor("#00FFFF")
    canvas.drawRect(260f, 100f, 320f, 220f, paint) // fries bag

    return bitmap
}
