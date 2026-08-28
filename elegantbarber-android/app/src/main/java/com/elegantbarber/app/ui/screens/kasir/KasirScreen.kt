package com.elegantbarber.app.ui.screens.kasir

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.elegantbarber.app.ui.components.LuxuryCard
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.InputDark
import com.elegantbarber.app.ui.theme.SurfaceDark
import com.elegantbarber.app.ui.theme.TextMuted
import com.elegantbarber.app.ui.theme.TextPrimary
import com.elegantbarber.app.util.Formatters
import com.elegantbarber.app.util.StatusLabels

@Composable
fun KasirScreen(
    viewModel: KasirViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
    ) {
        Text(
            text = "Kasir",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )
        Text(
            text = "Buat transaksi baru",
            style = MaterialTheme.typography.bodyMedium,
            color = TextMuted
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (state.successInvoice != null) {
            SuccessBanner(
                invoice = state.successInvoice ?: "",
                onDismiss = viewModel::reset
            )
            return
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Services selection
            item {
                Text("Pilih Layanan", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Spacer(modifier = Modifier.height(8.dp))
                state.services.forEach { service ->
                    ServiceSelectCard(
                        name = service.name,
                        price = service.price,
                        selected = service.id in state.selectedServiceIds,
                        onToggle = { viewModel.toggleService(service.id) }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }

            // Barber selection
            item {
                Text("Pilih Barber", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    state.barbers.forEach { barber ->
                        FilterChip(
                            selected = barber.id == state.selectedBarberId,
                            onClick = { viewModel.selectBarber(barber.id) },
                            label = { Text(barber.name) },
                            colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Gold.copy(alpha = 0.2f),
                                selectedLabelColor = Gold
                            ),
                            border = androidx.compose.material3.FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = barber.id == state.selectedBarberId,
                                borderColor = Gold.copy(alpha = 0.4f),
                                selectedBorderColor = Gold,
                                borderWidth = 1.dp
                            )
                        )
                    }
                }
            }

            // Customer info
            item {
                Text("Data Pelanggan (opsional)", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = state.customerName,
                    onValueChange = viewModel::onCustomerNameChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Nama Pelanggan") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = fieldColors()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = state.customerPhone,
                    onValueChange = viewModel::onCustomerPhoneChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("No. HP") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = fieldColors()
                )
            }

            // Payment
            item {
                Text("Pembayaran", style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("cash", "qris", "transfer").forEach { method ->
                        FilterChip(
                            selected = method == state.paymentMethod,
                            onClick = { viewModel.onPaymentMethodChange(method) },
                            label = { Text(StatusLabels.paymentMethod(method)) },
                            colors = androidx.compose.material3.FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Gold.copy(alpha = 0.2f),
                                selectedLabelColor = Gold
                            ),
                            border = androidx.compose.material3.FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = method == state.paymentMethod,
                                borderColor = Gold.copy(alpha = 0.4f),
                                selectedBorderColor = Gold,
                                borderWidth = 1.dp
                            )
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = state.amountPaid,
                    onValueChange = viewModel::onAmountPaidChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Uang Diterima (Rp)") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = fieldColors()
                )
            }

            // Error
            if (state.error != null) {
                item {
                    Text(
                        text = state.error ?: "",
                        color = Color(0xFFEF4444),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            // Summary
            item {
                LuxuryCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SummaryRow("Subtotal", Formatters.formatRupiah(state.subtotal))
                        SummaryRow("Diskon", "-${Formatters.formatRupiah(state.discount)}")
                        HorizontalDivider()
                        SummaryRow("Total", Formatters.formatRupiah(state.totalAmount), bold = true)
                        Spacer(modifier = Modifier.height(4.dp))
                        if (state.amountPaid.isNotBlank()) {
                            SummaryRow("Kembalian", Formatters.formatRupiah(state.changeAmount.coerceAtLeast(0)))
                        }
                    }
                }
            }

            // Save button
            item {
                Button(
                    onClick = viewModel::saveTransaction,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    enabled = !state.isSaving,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Gold,
                        contentColor = BackgroundDark
                    )
                ) {
                    if (state.isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = BackgroundDark, strokeWidth = 2.dp)
                    } else {
                        Text("Simpan Transaksi", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun ServiceSelectCard(
    name: String,
    price: Long,
    selected: Boolean,
    onToggle: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .then(
                if (selected) {
                    Modifier.border(1.5.dp, Gold, RoundedCornerShape(12.dp))
                } else {
                    Modifier.border(1.dp, Color(0xFF28283C), RoundedCornerShape(12.dp))
                }
            ),
        shape = RoundedCornerShape(12.dp),
        color = if (selected) Gold.copy(alpha = 0.1f) else SurfaceDark,
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(name, color = TextPrimary, style = MaterialTheme.typography.titleMedium)
                Text(
                    Formatters.formatRupiah(price),
                    color = if (selected) Gold else TextMuted,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            if (selected) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    tint = Gold,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String, bold: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = if (bold) MaterialTheme.typography.titleMedium else MaterialTheme.typography.bodyMedium,
            color = if (bold) TextPrimary else TextMuted,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal
        )
        Text(
            text = value,
            style = if (bold) MaterialTheme.typography.titleMedium else MaterialTheme.typography.bodyMedium,
            color = if (bold) Gold else TextPrimary,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal
        )
    }
}

@Composable
private fun HorizontalDivider() {
    Spacer(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(Color(0xFF28283C))
            .padding(vertical = 4.dp)
    )
}

@Composable
private fun SuccessBanner(invoice: String, onDismiss: () -> Unit) {
    LuxuryCard {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "✓",
                color = Color(0xFF10B981),
                fontSize = 48.sp
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text("Transaksi Berhasil", style = MaterialTheme.typography.headlineMedium, color = TextPrimary, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Invoice: $invoice", style = MaterialTheme.typography.bodyLarge, color = Gold)
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = BackgroundDark),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Transaksi Baru", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun fieldColors() = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Gold,
    unfocusedBorderColor = Color(0xFF28283C),
    focusedLabelColor = Gold,
    cursorColor = Gold,
    focusedContainerColor = InputDark,
    unfocusedContainerColor = InputDark
)
