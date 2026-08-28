package com.elegantbarber.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.SurfaceDark
import com.elegantbarber.app.ui.theme.SurfaceElevated
import com.elegantbarber.app.ui.theme.TextMuted

/**
 * Reusable surface card with luxury dark styling.
 */
@Composable
fun LuxuryCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        content()
    }
}

@Composable
fun StatusChip(
    status: String,
    modifier: Modifier = Modifier
) {
    val (bg, fg, label) = when (status) {
        "pending" -> Triple(Color(0x33F59E0B), Color(0xFFF59E0B), "Menunggu")
        "confirmed" -> Triple(Color(0x333B82F6), Color(0xFF3B82F6), "Terkonfirmasi")
        "in_service" -> Triple(Color(0x338B5CF6), Color(0xFF8B5CF6), "Dilayani")
        "completed" -> Triple(Color(0x3310B981), Color(0xFF10B981), "Selesai")
        "cancelled" -> Triple(Color(0x33EF4444), Color(0xFFEF4444), "Dibatalkan")
        else -> Triple(Color(0x339CA3AF), Color(0xFF9CA3AF), status)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(bg)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(text = label, color = fg, style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier
) {
    LuxuryCard(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium,
                color = TextMuted
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }
        }
    }
}

@Composable
fun LoadingOverlay(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(color = Gold, modifier = Modifier.size(32.dp))
    }
}

@Composable
fun ConnectStatusRow(
    isOnline: Boolean,
    pendingCount: Int,
    modifier: Modifier = Modifier
) {
    Row(modifier = modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(if (isOnline) Color(0xFF10B981) else Color(0xFFEF4444))
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = if (isOnline) "Terhubung" else "Offline",
            style = MaterialTheme.typography.labelMedium,
            color = if (isOnline) Color(0xFF10B981) else Color(0xFFEF4444)
        )
        if (pendingCount > 0) {
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = "$pendingCount perubahan menunggu sinkronisasi",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )
        }
    }
}
