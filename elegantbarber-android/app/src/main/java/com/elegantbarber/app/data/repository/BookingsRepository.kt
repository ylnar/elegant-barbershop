package com.elegantbarber.app.data.repository

import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.BookingEntity
import com.elegantbarber.app.data.remote.ApiService
import com.elegantbarber.app.sync.NetworkMonitor
import com.elegantbarber.app.sync.OfflineQueue
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingsRepository @Inject constructor(
    private val apiService: ApiService,
    private val db: AppDatabase,
    private val networkMonitor: NetworkMonitor,
    private val offlineQueue: OfflineQueue
) {
    private val dao = db.bookingDao()

    fun observeAll(): Flow<List<BookingEntity>> = dao.observeAll()

    suspend fun getByDate(date: String): List<BookingEntity> = dao.getByDate(date)

    suspend fun pullFromServer() {
        try {
            val remote = apiService.getBookings()
            val localIds = dao.getAll().map { it.id }.toSet()
            val toUpsert = remote.map { it.toEntity() }.filter { it.id !in localIds }
            dao.upsertAll(toUpsert)
        } catch (e: Exception) {
            // Offline
        }
    }

    suspend fun updateStatus(id: String, status: String): Result<Unit> {
        if (!networkMonitor.isOnlineNow()) {
            val current = dao.getAll().find { it.id == id }
            if (current != null) {
                dao.upsert(current.copy(status = status))
            }
            offlineQueue.enqueue("UPDATE", "bookings/$id", mapOf("status" to status))
            return Result.success(Unit)
        }
        return try {
            apiService.updateBooking(id, mapOf("status" to status))
            // Update local
            val current = dao.getAll().find { it.id == id }
            if (current != null) {
                dao.upsert(current.copy(status = status))
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun refreshFromServer() {
        pullFromServer()
    }
}

fun BookingDto.toEntity(): BookingEntity = BookingEntity(
    id = id,
    bookingCode = bookingCode,
    customerName = customerName,
    customerPhone = customerPhone,
    customerEmail = customerEmail,
    serviceId = serviceId,
    serviceName = serviceName,
    servicePrice = servicePrice,
    barberId = barberId,
    barberName = barberName,
    date = date,
    timeSlot = timeSlot,
    totalAmount = totalAmount,
    status = status,
    isWalkIn = isWalkIn,
    createdAt = createdAt,
    updatedAt = updatedAt
)
