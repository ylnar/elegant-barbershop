package com.elegantbarber.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.repository.AuthRepository
import com.elegantbarber.app.data.repository.SettingsRepository
import com.elegantbarber.app.sync.NetworkMonitor
import com.elegantbarber.app.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MainUiState(
    val isLoggedIn: Boolean = false,
    val isCheckingAuth: Boolean = true,
    val displayName: String = "Owner"
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val networkMonitor: NetworkMonitor,
    private val syncManager: SyncManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    val isOnline = networkMonitor.isOnline

    init {
        viewModelScope.launch {
            val loggedIn = authRepository.isLoggedIn()
            val name = authRepository.getDisplayName()
            _uiState.value = MainUiState(
                isLoggedIn = loggedIn,
                isCheckingAuth = false,
                displayName = name
            )
            // Auto-sync saat pertama dimuat jika sudah login
            if (loggedIn) {
                syncManager.pullAll()
            }
            observeConnectivityForSync()
        }
    }

    private suspend fun observeConnectivityForSync() {
        var wasOnline = networkMonitor.isOnlineNow()
        networkMonitor.isOnline.collect { online ->
            // Sinkronkan saat koneksi pulih (false -> true)
            if (online && !wasOnline && _uiState.value.isLoggedIn) {
                syncManager.pullAll()
            }
            wasOnline = online
        }
    }

    fun onLoginSuccess() {
        viewModelScope.launch {
            val name = authRepository.getDisplayName()
            _uiState.value = MainUiState(isLoggedIn = true, isCheckingAuth = false, displayName = name)
            syncManager.pullAll()
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = MainUiState(isLoggedIn = false, isCheckingAuth = false)
        }
    }
}
