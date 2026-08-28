package com.elegantbarber.app.ui.screens.bookings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.elegantbarber.app.data.local.entity.BookingEntity
import com.elegantbarber.app.ui.components.LuxuryCard
import com.elegantbarber.app.ui.components.StatusChip
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.TextMuted
import com.elegantbarber.app.ui.theme.TextPrimary

private val filters = listOf(
    "all" to "Semua",
    "pending" to "Menunggu",
    "confirmed" to "Konfirmasi",
    "in_service" to "Dilayani",
    "completed" to "Selesai",
    "cancelled" to "Batal"
)

@Composable
fun BookingsScreen(
    viewModel: BookingsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val filtered = if (state.filter == "all") {
        state.bookings
    } else {
        state.bookings.filter { it.status == state.filter }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Reservasi Booking",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TextPrimary
                )
                Text(
                    text = "${state.bookings.size} total booking",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )
            }
            IconButton(onClick = viewModel::refresh) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Gold)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(filters) { (value, label) ->
                FilterChip(
                    selected = value == state.filter,
                    onClick = { viewModel.setFilter(value) },
                    label = { Text(label) },
                    colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Gold.copy(alpha = 0.2f),
                        selectedLabelColor = Gold
                    ),
                    border = androidx.compose.material3.FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = value == state.filter,
                        borderColor = Gold.copy(alpha = 0.4f),
                        selectedBorderColor = Gold,
                        borderWidth = 1.dp
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (filtered.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Tidak ada booking", color = TextMuted, style = MaterialTheme.typography.bodyLarge)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                items(filtered, key = { it.id }) { booking ->
                    BookingCard(
                        booking = booking,
                        onStatusChange = { status -> viewModel.updateStatus(booking, status) }
                    )
                }
            }
        }
    }
}

@Composable
private fun BookingCard(
    booking: BookingEntity,
    hasFilter: Boolean = true,
    onStatusChange: (String) -> Unit
) {
    LuxuryCard {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = booking.customerName,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                    Text(
                        text = booking.bookingCode,
                        style = MaterialTheme.typography.labelMedium,
                        color = Gold
                    )
                }
                StatusChip(status = booking.status)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                BookingInfoItem("Layanan", booking.serviceName)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                BookingInfoItem("Barber", booking.barberName)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                BookingInfoItem("Tanggal", booking.date)
                BookingInfoItem("Jam", booking.timeSlot)
            }

            // Status action buttons (if not completed/cancelled)
            val actionable = booking.status == "pending" || booking.status == "confirmed" || booking.status == "in_service"
            if (actionable) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    when (booking.status) {
                        "pending" -> {
                            StatusActionButton("Konfirmasi", Gold) { onStatusChange("confirmed") }
                            StatusActionButton("Batal", Color(0xFFEF4444)) { onStatusChange("cancelled") }
                        }
                        "confirmed" -> {
                            StatusActionButton("Mulai", Color(0xFF8B5CF6)) { onStatusChange("in_service") }
                        }
                        "in_service" -> {
                            StatusActionButton("Selesai", Color(0xFF10B981)) { onStatusChange("completed") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BookingInfoItem(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = TextMuted)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
    }
}

@Composable
private fun StatusActionButton(
    label: String,
    color: Color,
    onClick: () -> Unit
) {
    Text(
        text = label,
        color = color,
        style = MaterialTheme.typography.labelLarge,
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp)
    )
}
