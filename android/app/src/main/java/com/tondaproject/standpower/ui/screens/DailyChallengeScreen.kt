package com.tondaproject.standpower.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tondaproject.standpower.data.Clan
import com.tondaproject.standpower.data.ClanCompetition
import com.tondaproject.standpower.data.ClanMember
import com.tondaproject.standpower.data.CommunityChallenge
import com.tondaproject.standpower.ui.components.*
import com.tondaproject.standpower.viewmodel.ClanViewModel
import com.tondaproject.standpower.viewmodel.PushupViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyChallengeScreen(
    viewModel: PushupViewModel,
    clanViewModel: ClanViewModel,
    userId: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val challenges by viewModel.challenges.collectAsState()
    val isSyncingChallenges by viewModel.isSyncing.collectAsState()

    val clans by clanViewModel.clans.collectAsState()
    val activeClan by clanViewModel.activeClan.collectAsState()
    val competitions by clanViewModel.competitions.collectAsState()
    val isSyncingClans by clanViewModel.isSyncing.collectAsState()

    var selectedTab by remember { mutableStateOf(0) } // 0: DÉFIS GLOBAUX, 1: CLANS & COMBATS

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Trophy,
                            contentDescription = null,
                            tint = CyberNeonPink,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = "CENTRE DE COMBAT",
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
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // TABS
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CyberDarkCard, RoundedCornerShape(10.dp))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    TabButton(
                        text = "DÉFIS GLOBAUX",
                        isSelected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        modifier = Modifier.weight(1f)
                    )
                    TabButton(
                        text = "CLANS & COMBATS",
                        isSelected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        modifier = Modifier.weight(1f)
                    )
                }

                if (selectedTab == 0) {
                    // TAB 0: DÉFIS GLOBAUX
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, CyberNeonPink.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(CyberNeonPink.copy(alpha = 0.12f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.EmojiEvents,
                                    contentDescription = null,
                                    tint = CyberNeonPink,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "L'UNION FAIT LA FORCE",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace,
                                    color = CyberNeonPink
                                )
                                Text(
                                    text = "Rejoignez un défi global pour multiplier vos XP et tester votre ténacité.",
                                    fontSize = 11.sp,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    lineHeight = 14.sp
                                )
                            }
                        }
                    }

                    if (challenges.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "RECHERCHE DE NOUVEAUX DÉFIS...",
                                color = CyberTextGray,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(challenges, key = { it.id }) { challenge ->
                                ChallengeItem(
                                    challenge = challenge,
                                    onJoin = {
                                        viewModel.joinChallenge(challenge.id, userId)
                                        Toast.makeText(context, "Vous avez rejoint le défi '${challenge.title}' ! 🦾", Toast.LENGTH_SHORT).show()
                                    }
                                )
                            }
                        }
                    }
                } else {
                    // TAB 1: CLANS & COMBATS
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Clan Detail Panel / Join Panel
                        item {
                            if (activeClan == null) {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text(
                                        text = "REJOINDRE UNE UNITÉ DE COMBAT",
                                        color = CyberNeonCyan,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        letterSpacing = 1.sp
                                    )

                                    clans.forEach { clan ->
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(16.dp)),
                                            shape = RoundedCornerShape(16.dp)
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(14.dp),
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        Icon(
                                                            imageVector = Icons.Default.Shield,
                                                            contentDescription = null,
                                                            tint = CyberNeonPurple,
                                                            modifier = Modifier.size(20.dp)
                                                        )
                                                        Spacer(modifier = Modifier.width(8.dp))
                                                        Text(
                                                            text = clan.name.uppercase(),
                                                            color = Color.White,
                                                            fontSize = 13.sp,
                                                            fontWeight = FontWeight.Black,
                                                            fontFamily = FontFamily.Monospace
                                                        )
                                                    }
                                                    Text(
                                                        text = "[${clan.tag}]",
                                                        color = CyberNeonCyan,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Black,
                                                        fontFamily = FontFamily.Monospace
                                                    )
                                                }

                                                Text(
                                                    text = clan.description,
                                                    color = CyberTextGray,
                                                    fontSize = 11.sp,
                                                    lineHeight = 15.sp
                                                )

                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text(
                                                        text = "${clan.membersCount} membres • ${clan.totalXp} XP",
                                                        color = CyberNeonPurple,
                                                        fontSize = 10.sp,
                                                        fontFamily = FontFamily.Monospace,
                                                        fontWeight = FontWeight.Bold
                                                    )

                                                    GlowButton(
                                                        onClick = {
                                                            clanViewModel.joinClan(clan.id, userId, "CyberAthlète")
                                                            Toast.makeText(context, "Vous avez rejoint ${clan.name} !", Toast.LENGTH_SHORT).show()
                                                        },
                                                        containerColor = CyberNeonCyan,
                                                        contentColor = Color.Black,
                                                        height = 32.dp
                                                    ) {
                                                        Text("S'ENRÔLER", fontSize = 9.sp, fontWeight = FontWeight.Black)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                // Display active clan dashboard
                                val myClan = activeClan!!
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(1.dp, CyberNeonPurple.copy(alpha = 0.3f), RoundedCornerShape(20.dp)),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(
                                                    text = "VOTRE CLAN ACTIF",
                                                    color = CyberNeonPurple,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Black,
                                                    fontFamily = FontFamily.Monospace,
                                                    letterSpacing = 1.sp
                                                )
                                                Text(
                                                    text = myClan.name.uppercase(),
                                                    color = Color.White,
                                                    fontSize = 16.sp,
                                                    fontWeight = FontWeight.Black,
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }

                                            Box(
                                                modifier = Modifier
                                                    .background(CyberNeonPurple.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                                    .border(1.dp, CyberNeonPurple, RoundedCornerShape(6.dp))
                                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = "[${myClan.tag}]",
                                                    color = CyberNeonPurple,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Black,
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }
                                        }

                                        Divider(color = Color.White.copy(alpha = 0.08f))

                                        Text(
                                            text = myClan.description,
                                            color = CyberTextGray,
                                            fontSize = 11.sp,
                                            lineHeight = 15.sp
                                        )

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "SCORE GLOBAL : ${myClan.totalXp} XP (Rang #${myClan.rank})",
                                                color = CyberNeonCyan,
                                                fontSize = 10.sp,
                                                fontFamily = FontFamily.Monospace,
                                                fontWeight = FontWeight.Bold
                                            )

                                            Text(
                                                text = "QUITTER LE CLAN",
                                                color = CyberNeonPink,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Black,
                                                fontFamily = FontFamily.Monospace,
                                                modifier = Modifier
                                                    .clickable {
                                                        clanViewModel.leaveClan(userId)
                                                        Toast.makeText(context, "Vous avez quitté le clan.", Toast.LENGTH_SHORT).show()
                                                    }
                                                    .padding(6.dp)
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "MEMBRES DE L'UNITÉ :",
                                            color = Color.White,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Black,
                                            fontFamily = FontFamily.Monospace
                                        )

                                        myClan.members.forEach { member ->
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                                    .padding(10.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = Icons.Default.Person,
                                                        contentDescription = null,
                                                        tint = CyberNeonCyan,
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(8.dp))
                                                    Text(
                                                        text = member.username,
                                                        color = Color.White,
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = "(${member.role})",
                                                        color = CyberTextGray,
                                                        fontSize = 10.sp
                                                    )
                                                }

                                                Text(
                                                    text = "+${member.contributedXp} XP",
                                                    color = CyberNeonCyan,
                                                    fontSize = 11.sp,
                                                    fontFamily = FontFamily.Monospace,
                                                    fontWeight = FontWeight.Black
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Team Competitions Section
                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text(
                                    text = "BATAILLES D'ÉQUIPES ACTIVES",
                                    color = CyberNeonPink,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace,
                                    letterSpacing = 1.sp
                                )

                                if (competitions.isEmpty()) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(24.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "AUCUN COMBAT EN COURS...",
                                            color = CyberTextGray,
                                            fontSize = 11.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                } else {
                                    competitions.forEach { comp ->
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .border(1.dp, CyberNeonPink.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
                                            shape = RoundedCornerShape(16.dp)
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(14.dp),
                                                verticalArrangement = Arrangement.spacedBy(10.dp)
                                            ) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Column {
                                                        Text(
                                                            text = comp.timeLeft.uppercase(),
                                                            color = CyberNeonPink,
                                                            fontSize = 8.5.sp,
                                                            fontWeight = FontWeight.Black,
                                                            fontFamily = FontFamily.Monospace
                                                        )
                                                        Text(
                                                            text = comp.title,
                                                            color = Color.White,
                                                            fontSize = 13.sp,
                                                            fontWeight = FontWeight.Black
                                                        )
                                                    }

                                                    Icon(
                                                        imageVector = Icons.Default.FlashOn,
                                                        contentDescription = null,
                                                        tint = CyberNeonPink,
                                                        modifier = Modifier.size(20.dp)
                                                    )
                                                }

                                                Text(
                                                    text = "RECOMPENSE : ${comp.rewardDescription}",
                                                    color = CyberTextGray,
                                                    fontSize = 10.5.sp,
                                                    lineHeight = 14.sp
                                                )

                                                // Dual-progress Cyber battle bar
                                                val total = (comp.xpClanA + comp.xpClanB).toFloat()
                                                val percentA = if (total > 0) comp.xpClanA / total else 0.5f

                                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                    Row(
                                                        modifier = Modifier.fillMaxWidth(),
                                                        horizontalArrangement = Arrangement.SpaceBetween
                                                    ) {
                                                        Text(
                                                            text = "TEAM RED: ${comp.xpClanA} XP",
                                                            color = CyberNeonPurple,
                                                            fontSize = 9.sp,
                                                            fontFamily = FontFamily.Monospace,
                                                            fontWeight = FontWeight.Bold
                                                        )
                                                        Text(
                                                            text = "TEAM BLUE: ${comp.xpClanB} XP",
                                                            color = CyberNeonCyan,
                                                            fontSize = 9.sp,
                                                            fontFamily = FontFamily.Monospace,
                                                            fontWeight = FontWeight.Bold
                                                        )
                                                    }

                                                    // Visual layout bar
                                                    Box(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .height(10.dp)
                                                            .clip(RoundedCornerShape(5.dp))
                                                            .background(Color.White.copy(alpha = 0.08f))
                                                    ) {
                                                        Row(modifier = Modifier.fillMaxSize()) {
                                                            Box(
                                                                modifier = Modifier
                                                                    .fillMaxHeight()
                                                                    .weight(percentA.coerceIn(0.05f, 0.95f))
                                                                    .background(CyberNeonPurple)
                                                            )
                                                            Box(
                                                                modifier = Modifier
                                                                    .fillMaxHeight()
                                                                    .weight((1f - percentA).coerceIn(0.05f, 0.95f))
                                                                    .background(CyberNeonCyan)
                                                            )
                                                        }
                                                    }
                                                }

                                                if (activeClan != null) {
                                                    GlowButton(
                                                        onClick = {
                                                            clanViewModel.contributeXpToCompetition(comp.id, 100, userId)
                                                            Toast.makeText(context, "Vous avez contribué +100 XP à l'effort de guerre !", Toast.LENGTH_SHORT).show()
                                                        },
                                                        containerColor = CyberNeonPink,
                                                        contentColor = Color.White,
                                                        modifier = Modifier.fillMaxWidth(),
                                                        height = 36.dp
                                                    ) {
                                                        Text("CONTRIBUER +100 XP AU COMBAT", fontSize = 10.sp, fontWeight = FontWeight.Black)
                                                    }
                                                } else {
                                                    Text(
                                                        text = "REJOIGNEZ UN CLAN POUR PARTICIPER AU COMBAT",
                                                        color = CyberTextGray,
                                                        fontSize = 9.sp,
                                                        fontFamily = FontFamily.Monospace,
                                                        textAlign = TextAlign.Center,
                                                        modifier = Modifier.fillMaxWidth()
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TabButton(
    text: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) CyberNeonPurple.copy(alpha = 0.2f) else Color.Transparent)
            .border(
                1.dp,
                if (isSelected) CyberNeonPurple else Color.Transparent,
                RoundedCornerShape(8.dp)
            )
            .clickable { onClick() }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isSelected) Color.White else CyberTextGray,
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun ChallengeItem(
    challenge: CommunityChallenge,
    onJoin: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CyberDarkCard),
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                brush = Brush.horizontalGradient(
                    listOf(CyberNeonPurple.copy(alpha = 0.2f), Color.Transparent)
                ),
                shape = RoundedCornerShape(20.dp)
            ),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "DÉFI DE ${challenge.durationDays} JOURS",
                        color = CyberNeonPurple,
                        fontSize = 8.5.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = challenge.title,
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Row(
                    modifier = Modifier
                        .background(CyberNeonCyan.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = CyberNeonCyan,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "+${challenge.xpReward} XP",
                        color = CyberNeonCyan,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Text(
                text = challenge.description,
                color = CyberTextGray,
                fontSize = 11.sp,
                lineHeight = 15.sp
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Groups,
                        contentDescription = null,
                        tint = CyberNeonCyan.copy(alpha = 0.7f),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${challenge.participantCount} cyber-athlètes",
                        color = CyberNeonCyan.copy(alpha = 0.7f),
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (challenge.isJoined) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(CyberNeonPurple.copy(alpha = 0.15f))
                            .border(1.dp, CyberNeonPurple, RoundedCornerShape(10.dp))
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = "REJOINT ✔",
                            color = CyberNeonPurple,
                            fontWeight = FontWeight.Black,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                } else {
                    GlowButton(
                        onClick = onJoin,
                        containerColor = CyberNeonPink,
                        contentColor = Color.White,
                        height = 36.dp
                    ) {
                        Text(
                            text = "PARTICIPER",
                            fontWeight = FontWeight.Black,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}
