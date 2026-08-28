package com.elegantbarber.app.ui.screens.services

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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.elegantbarber.app.data.local.entity.ServiceEntity
import com.elegantbarber.app.ui.components.LuxuryCard
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.InputDark
import com.elegantbarber.app.ui.theme.SurfaceDark
import com.elegantbarber.app.ui.theme.TextMuted
import com.elegantbarber.app.ui.theme.TextPrimary
import com.elegantbarber.app.util.Formatters

@Composable
fun ServicesScreen(
    viewModel: ServicesViewModel = hiltViewModel()
) {
    val services by viewModel.services.collectAsState()
    val showForm by viewModel.showForm.collectAsState()

    if (showForm) {
        ServiceFormScreen(viewModel = viewModel)
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
                    text = "Layanan & Harga",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TextPrimary
                )
                Text(
                    text = "${services.size} layanan terdaftar",
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
            items(services, key = { it.id }) { service ->
                ServiceRow(
                    service = service,
                    onEdit = { viewModel.showEditForm(service) },
                    onToggleActive = { viewModel.toggleActive(service) },
                    onDelete = { viewModel.delete(service) }
                )
            }
        }
    }
}

@Composable
private fun ServiceRow(
    service: ServiceEntity,
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
                    Text(
                        text = service.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                    if (!service.isActive) {
                        Text(
                            text = " Nonaktif",
                            color = Color(0xFFEF4444),
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
                Text(
                    text = service.category.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
                Text(
                    text = Formatters.formatRupiah(service.price),
                    style = MaterialTheme.typography.titleLarge,
                    color = Gold,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${service.durationMinutes} menit",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }
            Switch(
                checked = service.isActive,
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
private fun ServiceFormScreen(viewModel: ServicesViewModel) {
    val form by viewModel.form.collectAsState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(16.dp)
    ) {
        Text(
            text = if (form.isEditing) "Edit Layanan" else "Tambah Layanan",
            style = MaterialTheme.typography.headlineLarge,
            color = TextPrimary
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = form.name,
            onValueChange = viewModel::onNameChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Nama Layanan") },
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors()
        )
        Spacer(modifier = Modifier.height(10.dp))

        CategoryDropdown(
            selected = form.category,
            onSelect = viewModel::onCategoryChange
        )
        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = form.price,
            onValueChange = viewModel::onPriceChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Harga (Rp)") },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors()
        )
        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = form.duration,
            onValueChange = viewModel::onDurationChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Durasi (menit)") },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors()
        )
        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = form.description,
            onValueChange = viewModel::onDescriptionChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Deskripsi") },
            minLines = 2,
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CategoryDropdown(
    selected: String,
    onSelect: (String) -> Unit
) {
    val categories = listOf("haircut", "shave", "treatment", "beard", "package")
    val labels = mapOf(
        "haircut" to "Potong Rambut",
        "shave" to "Cukur",
        "treatment" to "Perawatan",
        "beard" to "Jenggot",
        "package" to "Paket"
    )
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            value = labels[selected] ?: selected,
            onValueChange = {},
            readOnly = true,
            label = { Text("Kategori") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = fieldColors(),
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor(),
            shape = RoundedCornerShape(12.dp)
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            containerColor = SurfaceDark
        ) {
            categories.forEach { cat ->
                DropdownMenuItem(
                    text = { Text(labels[cat] ?: cat) },
                    onClick = {
                        onSelect(cat)
                        expanded = false
                    }
                )
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
