package com.elegantbarber.app.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.repository.SettingsRepository
import com.elegantbarber.app.sync.SyncManager
import com.elegantbarber.app.util.Formatters
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = true,
    val todayRevenue: Long = 0,
    val todayTransactionCount: Int = 0,
    val activeBookings: Int = 0,
    val bookingOpen: Boolean = true,
    val walkInQueue: Int = 0,
    val shopName: String = "Elegant Barbershop",
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val db: AppDatabase,
    private val settingsRepository: SettingsRepository,
    private val syncManager: SyncManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    val currentDateDisplay: String = Formatters.currentDateDisplay()

    val isOnline = syncManager.isOnline()

    init {
        observeTransactions()
        observeActiveBookings()
        observeSettings()
        viewModelScope.launch {
            syncManager.pullAll()
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }

    private fun observeTransactions() {
        val today = Formatters.currentDate()
        viewModelScope.launch {
            db.transactionDao().observeAll().collect { all ->
                val todayPrefix = "${today}T"
                val todayTx = all.filter {
                    it.createdAt.startsWith(todayPrefix) ||
                        it.createdAt.take(10) == today
                }
                val revenue = todayTx.sumOf { it.totalAmount }
                _uiState.value = _uiState.value.copy(
                    todayRevenue = revenue,
                    todayTransactionCount = todayTx.size
                )
            }
        }
    }

    private fun observeActiveBookings() {
        viewModelScope.launch {
            db.bookingDao().observeAll().collect { bookings ->
                val active = bookings.count {
                    it.status == "pending" || it.status == "confirmed"
                }
                _uiState.value = _uiState.value.copy(activeBookings = active)
            }
        }
    }

    private fun observeSettings() {
        viewModelScope.launch {
            val settings = settingsRepository.getSettingsCached()
            if (settings != null) {
                _uiState.value = _uiState.value.copy(
                    bookingOpen = settings.isBookingOpen,
                    walkInQueue = settings.currentWalkInQueue,
                    shopName = settings.shopName ?: "Elegant Barbershop"
                )
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            syncManager.pullAll()
        }
    }
}
