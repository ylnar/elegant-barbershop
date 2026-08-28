package com.elegantbarber.app.ui.screens.bookings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.BookingEntity
import com.elegantbarber.app.data.repository.BookingsRepository
import com.elegantbarber.app.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BookingsUiState(
    val bookings: List<BookingEntity> = emptyList(),
    val filter: String = "all",
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class BookingsViewModel @Inject constructor(
    private val db: AppDatabase,
    private val bookingsRepository: BookingsRepository,
    private val syncManager: SyncManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookingsUiState())
    val uiState: StateFlow<BookingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            syncManager.pullAll()
            db.bookingDao().observeAll().collect { all ->
                _uiState.value = _uiState.value.copy(bookings = all)
            }
        }
    }

    fun setFilter(filter: String) {
        _uiState.value = _uiState.value.copy(filter = filter)
    }

    fun updateStatus(booking: BookingEntity, status: String) {
        viewModelScope.launch {
            bookingsRepository.updateStatus(booking.id, status)
        }
    }

    fun refresh() {
        viewModelScope.launch {
            bookingsRepository.pullFromServer()
        }
    }
}
