package com.elegantbarber.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable
import androidx.hilt.navigation.compose.hiltViewModel
import com.elegantbarber.app.ui.components.ConnectStatusRow
import com.elegantbarber.app.ui.components.LuxuryCard
import com.elegantbarber.app.ui.components.MetricCard
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.SurfaceDark
import com.elegantbarber.app.ui.theme.SurfaceElevated
import com.elegantbarber.app.ui.theme.TextMuted
import com.elegantbarber.app.ui.theme.TextPrimary
import com.elegantbarber.app.util.Formatters

@Composable
fun DashboardScreen(
    onNavigateKasir: () -> Unit,
    onNavigateBookings: () -> Unit,
    onNavigateReports: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val isOnline by viewModel.isOnline.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Dashboard",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = viewModel.currentDateDisplay,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )
            }
        }

        item {
            ConnectStatusRow(isOnline = isOnline, pendingCount = 0)
        }

        if (state.isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Gold)
                }
            }
        }

        // Store status card
        item {
            LuxuryCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateBookings() }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = state.shopName,
                            style = MaterialTheme.typography.titleLarge,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (state.bookingOpen) "Booking sedang dibuka" else "Mode hanya Walk-in",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (state.bookingOpen) Color(0xFF10B981) else Color(0xFFF59E0B)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Antrean walk-in: ${state.walkInQueue} orang",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMuted
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(SurfaceElevated, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✂",
                            fontSize = 22.sp
                        )
                    }
                }
            }
        }

        // Metric cards
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard(
                    title = "Pendapatan Hari Ini",
                    value = Formatters.formatRupiah(state.todayRevenue),
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Transaksi",
                    value = "${state.todayTransactionCount}",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard(
                    title = "Booking Aktif",
                    value = "${state.activeBookings}",
                    subtitle = "Menunggu/konfirmasi",
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Antrean",
                    value = "${state.walkInQueue}",
                    subtitle = "Walk-in",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Quick actions
        item {
            Text(
                text = "Aksi Cepat",
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        item {
            QuickActionRow(
                onKasir = onNavigateKasir,
                onBookings = onNavigateBookings,
                onReports = onNavigateReports
            )
        }
    }
}

@Composable
private fun QuickActionRow(
    onKasir: () -> Unit,
    onBookings: () -> Unit,
    onReports: () -> Unit
) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        QuickActionButton(
            icon = { Icon(Icons.Default.PointOfSale, contentDescription = null, tint = Gold) },
            label = "Kasir",
            onClick = onKasir,
            modifier = Modifier.weight(1f)
        )
        QuickActionButton(
            icon = { Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = Gold) },
            label = "Booking",
            onClick = onBookings,
            modifier = Modifier.weight(1f)
        )
        QuickActionButton(
            icon = { Icon(Icons.Default.ReceiptLong, contentDescription = null, tint = Gold) },
            label = "Laporan",
            onClick = onReports,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun QuickActionButton(
    icon: @Composable () -> Unit,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(SurfaceDark, RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Gold.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            icon()
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = TextPrimary
        )
    }
}
