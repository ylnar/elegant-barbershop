package com.elegantbarber.app.ui.screens.kasir

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.BarberEntity
import com.elegantbarber.app.data.local.entity.ServiceEntity
import com.elegantbarber.app.data.repository.TransactionsRepository
import com.elegantbarber.app.data.repository.TransactionItemDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class KasirUiState(
    val services: List<ServiceEntity> = emptyList(),
    val barbers: List<BarberEntity> = emptyList(),
    val selectedServiceIds: List<String> = emptyList(),
    val selectedBarberId: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val paymentMethod: String = "cash",
    val amountPaid: String = "",
    val notes: String = "",
    val isSaving: Boolean = false,
    val successInvoice: String? = null,
    val error: String? = null
) {
    val selectedServices: List<ServiceEntity>
        get() = services.filter { it.id in selectedServiceIds }

    val subtotal: Long
        get() = selectedServices.sumOf { it.price }

    val discount: Long
        get() = 0

    val totalAmount: Long
        get() = subtotal - discount

    val changeAmount: Long
        get() = (amountPaid.toLongOrNull() ?: 0) - totalAmount

    val selectedBarberName: String
        get() = barbers.find { it.id == selectedBarberId }?.name ?: "Staff Barber"
}

@HiltViewModel
class KasirViewModel @Inject constructor(
    private val db: AppDatabase,
    private val transactionsRepository: TransactionsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(KasirUiState())
    val uiState: StateFlow<KasirUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            val services = db.serviceDao().getActive()
            val barbers = db.barberDao().getActive()
            _uiState.value = _uiState.value.copy(
                services = services,
                barbers = barbers,
                selectedBarberId = barbers.firstOrNull()?.id ?: ""
            )
        }
    }

    fun toggleService(id: String) {
        val current = _uiState.value.selectedServiceIds
        val updated = if (id in current) current - id else current + id
        _uiState.value = _uiState.value.copy(selectedServiceIds = updated, error = null)
    }

    fun selectBarber(id: String) {
        _uiState.value = _uiState.value.copy(selectedBarberId = id)
    }

    fun onCustomerNameChange(v: String) {
        _uiState.value = _uiState.value.copy(customerName = v)
    }

    fun onCustomerPhoneChange(v: String) {
        _uiState.value = _uiState.value.copy(customerPhone = v)
    }

    fun onPaymentMethodChange(method: String) {
        _uiState.value = _uiState.value.copy(paymentMethod = method)
    }

    fun onAmountPaidChange(v: String) {
        val filtered = v.filter { it.isDigit() }
        _uiState.value = _uiState.value.copy(amountPaid = filtered)
    }

    fun onNotesChange(v: String) {
        _uiState.value = _uiState.value.copy(notes = v)
    }

    fun saveTransaction() {
        val state = _uiState.value
        if (state.selectedServiceIds.isEmpty()) {
            _uiState.value = state.copy(error = "Pilih minimal 1 layanan.")
            return
        }
        val items = state.selectedServices.map {
            TransactionItemDto(it.id, it.name, it.price, 1)
        }
        _uiState.value = state.copy(isSaving = true, error = null)
        viewModelScope.launch {
            val result = transactionsRepository.createTransaction(
                customerName = state.customerName.ifBlank { "Tamu Umum (Walk-in)" },
                customerPhone = state.customerPhone.ifBlank { null },
                barberId = state.selectedBarberId.ifBlank { "barber-1" },
                barberName = state.selectedBarberName,
                items = items,
                subtotal = state.subtotal,
                discount = state.discount,
                totalAmount = state.totalAmount,
                paymentMethod = state.paymentMethod,
                amountPaid = state.amountPaid.toLongOrNull() ?: state.totalAmount,
                changeAmount = state.changeAmount.coerceAtLeast(0),
                notes = state.notes.ifBlank { null }
            )
            _uiState.value = _uiState.value.copy(isSaving = false)
            result.fold(
                onSuccess = { tx ->
                    _uiState.value = _uiState.value.copy(successInvoice = tx.invoiceNumber)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        error = e.message ?: "Gagal menyimpan transaksi. Periksa koneksi."
                    )
                }
            )
        }
    }

    fun reset() {
        _uiState.value = KasirUiState(
            services = _uiState.value.services,
            barbers = _uiState.value.barbers,
            selectedBarberId = _uiState.value.barbers.firstOrNull()?.id ?: ""
        )
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
