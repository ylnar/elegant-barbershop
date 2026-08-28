package com.elegantbarber.app.ui.screens.barbers

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import com.elegantbarber.app.data.local.entity.BarberEntity
import com.elegantbarber.app.ui.components.LuxuryCard
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.InputDark
import com.elegantbarber.app.ui.theme.SurfaceDark
import com.elegantbarber.app.ui.theme.TextMuted
import com.elegantbarber.app.ui.theme.TextPrimary

@Composable
fun BarbersScreen(
    viewModel: BarbersViewModel = hiltViewModel()
) {
    val barbers by viewModel.barbers.collectAsState()
    val showForm by viewModel.showForm.collectAsState()

    if (showForm) {
        BarberFormScreen(viewModel = viewModel)
        return
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
                    text = "Data Barber",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TextPrimary
                )
                Text(
                    text = "${barbers.size} barber terdaftar",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )
            }
            Button(
                onClick = viewModel::showAddForm,
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = BackgroundDark),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.size(4.dp))
                Text("Tambah", fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            items(barbers, key = { it.id }) { barber ->
                BarberRow(
                    barber = barber,
                    onEdit = { viewModel.showEditForm(barber) },
                    onToggleActive = { viewModel.toggleActive(barber) },
                    onDelete = { viewModel.delete(barber) }
                )
            }
        }
    }
}

@Composable
private fun BarberRow(
    barber: BarberEntity,
    onEdit: () -> Unit,
    onToggleActive: () -> Unit,
    onDelete: () -> Unit
) {
    LuxuryCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        tint = Gold,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.size(8.dp))
                    Text(
                        text = barber.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                    if (!barber.isActive) {
                        Text(
                            text = " Nonaktif",
                            color = Color(0xFFEF4444),
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
                if (barber.phone != null) {
                    Text(
                        text = barber.phone,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                } else {
                    Text(
                        text = "No. HP tidak diisi",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                }
            }
            Switch(
                checked = barber.isActive,
                onCheckedChange = { onToggleActive() },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Gold,
                    checkedTrackColor = Gold.copy(alpha = 0.3f)
                )
            )
            IconButton(onClick = { onEdit() }) {
                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextMuted, modifier = Modifier.size(18.dp))
            }
            IconButton(onClick = { onDelete() }) {
                Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun BarberFormScreen(viewModel: BarbersViewModel) {
    val form by viewModel.form.collectAsState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
    ) {
        Text(
            text = if (form.isEditing) "Edit Barber" else "Tambah Barber",
            style = MaterialTheme.typography.headlineLarge,
            color = TextPrimary
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = form.name,
            onValueChange = viewModel::onNameChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Nama Barber") },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors()
        )
        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = form.phone,
            onValueChange = viewModel::onPhoneChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("No. HP (WhatsApp)") },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors()
        )

        if (form.error != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(form.error ?: "", color = Color(0xFFEF4444), style = MaterialTheme.typography.bodySmall)
        }

        Spacer(modifier = Modifier.height(20.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(
                onClick = viewModel::hideForm,
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark, contentColor = TextPrimary)
            ) {
                Text("Batal")
            }
            Button(
                onClick = viewModel::saveForm,
                modifier = Modifier.weight(2f).height(50.dp),
                enabled = !form.isSaving,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = BackgroundDark)
            ) {
                Text(if (form.isSaving) "Menyimpan..." else "Simpan", fontWeight = FontWeight.Bold)
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
