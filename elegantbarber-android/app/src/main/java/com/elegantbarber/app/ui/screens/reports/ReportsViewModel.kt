package com.elegantbarber.app.ui.screens.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.TransactionEntity
import com.elegantbarber.app.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import com.elegantbarber.app.util.Formatters

data class ReportSummary(
    val revenue: Long = 0,
    val transactionCount: Int = 0,
    val cashAmount: Long = 0,
    val qrisAmount: Long = 0,
    val transferAmount: Long = 0
)

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val db: AppDatabase,
    private val syncManager: SyncManager
) : ViewModel() {

    private val _daily = MutableStateFlow(ReportSummary())
    val daily: StateFlow<ReportSummary> = _daily.asStateFlow()

    private val _weekly = MutableStateFlow(ReportSummary())
    val weekly: StateFlow<ReportSummary> = _weekly.asStateFlow()

    private val _monthly = MutableStateFlow(ReportSummary())
    val monthly: StateFlow<ReportSummary> = _monthly.asStateFlow()

    init {
        viewModelScope.launch {
            syncManager.pullAll()
            val all = db.transactionDao().getAll()
            _daily.value = computeSummary(all, days = 1)
            _weekly.value = computeSummary(all, days = 7)
            _monthly.value = computeSummary(all, days = 30)
        }
    }

    private fun computeSummary(all: List<TransactionEntity>, days: Int): ReportSummary {
        val cutoff = System.currentTimeMillis() - days * 24 * 60 * 60 * 1000L
        val cutoffIso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(Date(cutoff))
        val filtered = all.filter { it.createdAt >= cutoffIso }
        return ReportSummary(
            revenue = filtered.sumOf { it.totalAmount },
            transactionCount = filtered.size,
            cashAmount = filtered.filter { it.paymentMethod == "cash" }.sumOf { it.totalAmount },
            qrisAmount = filtered.filter { it.paymentMethod == "qris" }.sumOf { it.totalAmount },
            transferAmount = filtered.filter { it.paymentMethod == "transfer" }.sumOf { it.totalAmount }
        )
    }

    fun refresh() {
        viewModelScope.launch {
            syncManager.pullAll()
            val all = db.transactionDao().getAll()
            _daily.value = computeSummary(all, days = 1)
            _weekly.value = computeSummary(all, days = 7)
            _monthly.value = computeSummary(all, days = 30)
        }
    }
}
