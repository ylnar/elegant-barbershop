package com.elegantbarber.app.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.repository.SettingsRepository
import com.elegantbarber.app.sync.NetworkMonitor
import com.elegantbarber.app.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val shopName: String = "Elegant Barbershop",
    val address: String = "",
    val phone: String = "",
    val openTime: String = "--:--",
    val closeTime: String = "--:--",
    val bookingOpen: Boolean = true,
    val isLoading: Boolean = false,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val syncManager: SyncManager,
    private val networkMonitor: NetworkMonitor
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    val isOnline = networkMonitor.isOnline

    init {
        load()
    }

    private fun load() {
        viewModelScope.launch {
            val settings = settingsRepository.get()
            if (settings != null) {
                _uiState.value = _uiState.value.copy(
                    shopName = settings.shopName ?: "Elegant Barbershop",
                    address = settings.address ?: "",
                    phone = settings.phone ?: "",
                    openTime = settings.openTime ?: "--:--",
                    closeTime = settings.closeTime ?: "--:--",
                    bookingOpen = settings.isBookingOpen
                )
            }
        }
    }

    fun toggleBooking(isOpen: Boolean) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            val result = settingsRepository.toggleBooking(isOpen)
            _uiState.value = _uiState.value.copy(isLoading = false)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        bookingOpen = isOpen,
                        message = if (isOpen) "Online booking dibuka" else "Mode Walk-in Only"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        bookingOpen = !isOpen,
                        error = "Gagal mengubah status. Periksa koneksi."
                    )
                }
            )
        }
    }

    fun refresh() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        load()
        viewModelScope.launch {
            syncManager.pullAll()
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
}
