package com.tondaproject.standpower

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.google.firebase.auth.FirebaseAuth
import com.tondaproject.standpower.ui.MealHistoryScreen
import com.tondaproject.standpower.ui.MealScannerScreen
import com.tondaproject.standpower.ui.components.StandPowerBottomBar
import com.tondaproject.standpower.ui.screens.AthleticAIHubScreen
import com.tondaproject.standpower.ui.screens.DailyChallengeScreen
import com.tondaproject.standpower.ui.screens.ProfileScreen
import com.tondaproject.standpower.ui.screens.PushupScreen
import com.tondaproject.standpower.viewmodel.MealViewModel
import com.tondaproject.standpower.viewmodel.PushupViewModel
import com.tondaproject.standpower.viewmodel.WorkoutViewModel
import com.tondaproject.standpower.viewmodel.ClanViewModel
import kotlinx.coroutines.launch

enum class ScreenOverlay {
    NONE,
    CAMERA_SCANNER,
    MEAL_HISTORY
}

class MainActivity : ComponentActivity() {

    private val mealViewModel: MealViewModel by viewModels {
        MealViewModel.Factory((application as StandPowerApplication).repository)
    }
    
    private val pushupViewModel: PushupViewModel by viewModels()
    private val workoutViewModel: WorkoutViewModel by viewModels()
    private val clanViewModel: ClanViewModel by viewModels()

    @OptIn(ExperimentalFoundationApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val auth = FirebaseAuth.getInstance()
            var userId by remember { mutableStateOf(auth.currentUser?.uid ?: "") }

            // Trigger anonymous registration to generate an authenticated Firebase UID if missing
            LaunchedEffect(Unit) {
                if (auth.currentUser == null) {
                    auth.signInAnonymously()
                        .addOnSuccessListener { result ->
                            val uid = result.user?.uid ?: "anonymous_user"
                            userId = uid
                            mealViewModel.loadMealHistory(uid)
                            pushupViewModel.loadCloudProgress(uid)
                        }
                        .addOnFailureListener {
                            userId = "offline_user"
                            mealViewModel.loadMealHistory("offline_user")
                            pushupViewModel.loadLocalProgress()
                        }
                } else {
                    val uid = auth.currentUser!!.uid
                    userId = uid
                    mealViewModel.loadMealHistory(uid)
                    pushupViewModel.loadCloudProgress(uid)
                }
            }

            // Navigation overlay state (None, Camera Scanner active, or Nutrition History active)
            var activeOverlay by remember { mutableStateOf(ScreenOverlay.NONE) }

            // Core Page Swipe Navigation state (Stats, Challenges, AI Hub, Profile)
            val pagerState = rememberPagerState(pageCount = { 4 })
            val coroutineScope = rememberCoroutineScope()

            Scaffold(
                containerColor = Color.Black,
                bottomBar = {
                    if (activeOverlay == ScreenOverlay.NONE) {
                        StandPowerBottomBar(
                            selectedIndex = pagerState.currentPage,
                            onTabSelected = { index ->
                                coroutineScope.launch {
                                    pagerState.animateScrollToPage(index)
                                }
                            },
                            onCameraClicked = {
                                activeOverlay = ScreenOverlay.CAMERA_SCANNER
                            }
                        )
                    }
                }
            ) { paddingValues ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = if (activeOverlay == ScreenOverlay.NONE) paddingValues.calculateBottomPadding() else Color.Transparent.value.dp)
                ) {
                    // Page Viewer
                    HorizontalPager(
                        state = pagerState,
                        modifier = Modifier.fillMaxSize()
                    ) { page ->
                        when (page) {
                            0 -> PushupScreen(
                                viewModel = pushupViewModel,
                                userId = userId,
                                modifier = Modifier.fillMaxSize()
                            )
                            1 -> DailyChallengeScreen(
                                viewModel = pushupViewModel,
                                clanViewModel = clanViewModel,
                                userId = userId,
                                modifier = Modifier.fillMaxSize()
                            )
                            2 -> AthleticAIHubScreen(
                                workoutViewModel = workoutViewModel,
                                pushupViewModel = pushupViewModel,
                                userId = userId,
                                modifier = Modifier.fillMaxSize()
                            )
                            3 -> ProfileScreen(
                                viewModel = pushupViewModel,
                                userId = userId,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }

                    // Slide overlay: Camera Scanner Screen
                    AnimatedVisibility(
                        visible = activeOverlay == ScreenOverlay.CAMERA_SCANNER,
                        enter = slideInVertically(initialOffsetY = { it }, animationSpec = tween(350)),
                        exit = slideOutVertically(targetOffsetY = { it }, animationSpec = tween(300))
                    ) {
                        Box(modifier = Modifier.fillMaxSize()) {
                            MealScannerScreen(
                                viewModel = mealViewModel,
                                userId = userId,
                                onNavigateToHistory = {
                                    activeOverlay = ScreenOverlay.MEAL_HISTORY
                                }
                            )
                        }
                    }

                    // Slide overlay: Meal History Screen
                    AnimatedVisibility(
                        visible = activeOverlay == ScreenOverlay.MEAL_HISTORY,
                        enter = slideInVertically(initialOffsetY = { it }, animationSpec = tween(350)),
                        exit = slideOutVertically(targetOffsetY = { it }, animationSpec = tween(300))
                    ) {
                        Box(modifier = Modifier.fillMaxSize()) {
                            MealHistoryScreen(
                                viewModel = mealViewModel,
                                userId = userId,
                                onNavigateBack = {
                                    activeOverlay = ScreenOverlay.CAMERA_SCANNER
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
