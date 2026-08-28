package com.elegantbarber.app.sync

import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.PendingSyncEntity
import com.elegantbarber.app.data.remote.ApiService
import com.elegantbarber.app.data.repository.BarbersRepository
import com.elegantbarber.app.data.repository.BookingsRepository
import com.elegantbarber.app.data.repository.ServicesRepository
import com.elegantbarber.app.data.repository.SettingsRepository
import com.elegantbarber.app.data.repository.TransactionsRepository
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    private val db: AppDatabase,
    private val apiService: ApiService,
    private val servicesRepository: ServicesRepository,
    private val barbersRepository: BarbersRepository,
    private val bookingsRepository: BookingsRepository,
    private val transactionsRepository: TransactionsRepository,
    private val settingsRepository: SettingsRepository,
    private val networkMonitor: NetworkMonitor
) {
    private val pendingSyncDao = db.pendingSyncDao()
    private val gson = Gson()

    fun pendingCount(): Flow<Int> = pendingSyncDao.observeCount()

    fun isOnline(): StateFlow<Boolean> = networkMonitor.isOnline

    /**
     * Pull fresh data from server and refresh the local cache.
     */
    suspend fun pullAll() {
        servicesRepository.pullFromServer()
        barbersRepository.pullFromServer()
        bookingsRepository.pullFromServer()
        transactionsRepository.pullFromServer()
        settingsRepository.get()
        pushPending()
    }

    @Suppress("UNCHECKED_CAST")
    suspend fun pushPending() {
        if (!networkMonitor.isOnlineNow()) return
        val pending: List<PendingSyncEntity> = pendingSyncDao.getAll()
        for (item in pending) {
            try {
                val payload: Map<String, Any?> = try {
                    gson.fromJson(item.payloadJson, Map::class.java) as? Map<String, Any?>
                        ?: emptyMap()
                } catch (e: Exception) {
                    emptyMap()
                }
                when {
                    item.type == "CREATE" && item.endpoint == "transactions" ->
                        apiService.createTransaction(payload)
                    item.type == "DELETE" && item.endpoint.startsWith("transactions/") ->
                        apiService.deleteTransaction(item.endpoint.removePrefix("transactions/"))
                    item.type == "CREATE" && item.endpoint == "services" ->
                        apiService.createService(payload)
                    item.type == "UPDATE" && item.endpoint.startsWith("services/") ->
                        apiService.updateService(item.endpoint.removePrefix("services/"), payload)
                    item.type == "DELETE" && item.endpoint.startsWith("services/") ->
                        apiService.deleteService(item.endpoint.removePrefix("services/"))
                    item.type == "CREATE" && item.endpoint == "barbers" ->
                        apiService.createBarber(payload)
                    item.type == "UPDATE" && item.endpoint.startsWith("barbers/") ->
                        apiService.updateBarber(item.endpoint.removePrefix("barbers/"), payload)
                    item.type == "DELETE" && item.endpoint.startsWith("barbers/") ->
                        apiService.deleteBarber(item.endpoint.removePrefix("barbers/"))
                    item.type == "UPDATE" && item.endpoint.startsWith("bookings/") ->
                        apiService.updateBooking(item.endpoint.removePrefix("bookings/"), payload)
                    item.type == "DELETE" && item.endpoint.startsWith("bookings/") ->
                        apiService.deleteBooking(item.endpoint.removePrefix("bookings/"))
                    item.type == "UPDATE" && item.endpoint == "settings" ->
                        apiService.updateSettings(payload)
                    else -> continue
                }
                pendingSyncDao.delete(item)
            } catch (e: Exception) {
                // Leave in queue to retry later
                break
            }
        }
    }
}
