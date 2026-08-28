package com.elegantbarber.app.ui.screens.reports

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.elegantbarber.app.ui.components.LuxuryCard
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.TextMuted
import com.elegantbarber.app.ui.theme.TextPrimary
import com.elegantbarber.app.util.Formatters

@Composable
fun ReportsScreen(
    viewModel: ReportsViewModel = hiltViewModel()
) {
    val daily by viewModel.daily.collectAsState()
    val weekly by viewModel.weekly.collectAsState()
    val monthly by viewModel.monthly.collectAsState()

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
                    text = "Laporan Keuangan",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TextPrimary
                )
                Text(
                    text = "Ringkasan pendapatan",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )
            }
            IconButton(onClick = viewModel::refresh) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Gold)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            ReportPeriodCard(
                title = "Hari Ini",
                summary = daily
            )
            ReportPeriodCard(
                title = "7 Hari Terakhir",
                summary = weekly
            )
            ReportPeriodCard(
                title = "30 Hari Terakhir",
                summary = monthly
            )
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun ReportPeriodCard(
    title: String,
    summary: ReportSummary
) {
    LuxuryCard {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = Formatters.formatRupiah(summary.revenue),
                style = MaterialTheme.typography.headlineMedium,
                color = Gold,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${summary.transactionCount} transaksi",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )

            Spacer(modifier = Modifier.height(16.dp))

            PaymentBreakdownRow("Tunai", summary.cashAmount)
            PaymentBreakdownRow("QRIS", summary.qrisAmount)
            PaymentBreakdownRow("Transfer", summary.transferAmount)
        }
    }
}

@Composable
private fun PaymentBreakdownRow(label: String, amount: Long) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextMuted)
        Text(Formatters.formatRupiah(amount), style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
    }
}
