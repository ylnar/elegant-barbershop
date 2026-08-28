package com.elegantbarber.app.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.elegantbarber.app.ui.components.ConnectStatusRow
import com.elegantbarber.app.ui.components.LuxuryCard
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.SurfaceDark
import com.elegantbarber.app.ui.theme.TextMuted
import com.elegantbarber.app.ui.theme.TextPrimary

@Composable
fun SettingsScreen(
    displayName: String,
    onLogout: () -> Unit,
    onServices: () -> Unit = {},
    onBarbers: () -> Unit = {},
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val isOnline by viewModel.isOnline.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
    ) {
        Text(
            text = "Pengaturan",
            style = MaterialTheme.typography.headlineLarge,
            color = TextPrimary
        )
        Text(
            text = "Pengaturan sistem toko",
            style = MaterialTheme.typography.bodyMedium,
            color = TextMuted
        )

        Spacer(modifier = Modifier.height(12.dp))

        ConnectStatusRow(isOnline = isOnline, pendingCount = 0)

        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Shop info card
            LuxuryCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Profil Toko", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                    Spacer(modifier = Modifier.height(12.dp))
                    SettingInfoRow("Nama Toko", state.shopName)
                    SettingInfoRow("Alamat", state.address)
                    SettingInfoRow("Telepon", state.phone)
                    SettingInfoRow("Jam Operasional", "${state.openTime} - ${state.closeTime}")
                }
            }

            // Booking switch card
            LuxuryCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Online Booking", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                            Text(
                                text = if (state.bookingOpen) "Booking dibuka" else "Mode Walk-in Only",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (state.bookingOpen) Color(0xFF10B981) else Color(0xFFF59E0B)
                            )
                        }
                        if (state.isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Gold, strokeWidth = 2.dp)
                        } else {
                            Switch(
                                checked = state.bookingOpen,
                                onCheckedChange = viewModel::toggleBooking,
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Gold,
                                    checkedTrackColor = Gold.copy(alpha = 0.3f)
                                )
                            )
                        }
                    }
                }
            }

            // Management links
            LuxuryCard {
                Column(modifier = Modifier.padding(8.dp)) {
                    ManagementLink("Layanan & Harga", onServices)
                    ManagementLink("Data Barber", onBarbers)
                }
            }

            // Status messages
            if (state.error != null) {
                Text(state.error ?: "", color = Color(0xFFEF4444), style = MaterialTheme.typography.bodySmall)
            }
            if (state.message != null) {
                Text(state.message ?: "", color = Color(0xFF10B981), style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Logout
            Button(
                onClick = onLogout,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFEF4444),
                    contentColor = Color.White
                )
            ) {
                Icon(Icons.Default.Logout, contentDescription = null)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Keluar ($displayName)", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SettingInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextMuted)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
    }
}

@Composable
private fun ManagementLink(label: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
        Text("›", style = MaterialTheme.typography.headlineMedium, color = Gold)
    }
}
