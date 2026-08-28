package com.elegantbarber.app.data.repository

import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.BarberEntity
import com.elegantbarber.app.data.remote.ApiService
import com.elegantbarber.app.sync.NetworkMonitor
import com.elegantbarber.app.sync.OfflineQueue
import java.util.UUID
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BarbersRepository @Inject constructor(
    private val apiService: ApiService,
    private val db: AppDatabase,
    private val networkMonitor: NetworkMonitor,
    private val offlineQueue: OfflineQueue
) {
    private val dao = db.barberDao()

    fun observeAll(): Flow<List<BarberEntity>> = dao.observeAll()

    suspend fun getActive(): List<BarberEntity> = dao.getActive()

    suspend fun pullFromServer() {
        try {
            val remote = apiService.getBarbers()
            val localIds = dao.getAll().map { it.id }.toSet()
            val toUpsert = remote.map { it.toEntity() }.filter { it.id !in localIds }
            dao.upsertAll(toUpsert)
        } catch (e: Exception) {
            // Offline - keep cached data
        }
    }

    suspend fun createBarber(name: String, phone: String?): Result<BarberEntity> {
        val payload = mapOf("name" to name, "phone" to phone, "isActive" to true)

        if (!networkMonitor.isOnlineNow()) {
            val entity = BarberEntity(
                id = "offline-${UUID.randomUUID()}",
                name = name,
                phone = phone,
                isActive = true,
                workingDays = "[0,1,2,3,4,5,6]"
            )
            dao.upsert(entity)
            offlineQueue.enqueue("CREATE", "barbers", payload)
            return Result.success(entity)
        }

        return try {
            val response = apiService.createBarber(payload)
            val entity = BarberEntity(
                id = (response["barber"] as? Map<*, *>)?.get("id") as? String ?: error("ID missing"),
                name = name,
                phone = phone,
                isActive = true,
                workingDays = "[0,1,2,3,4,5,6]"
            )
            dao.upsert(entity)
            Result.success(entity)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateBarber(entity: BarberEntity): Result<Unit> {
        if (!networkMonitor.isOnlineNow()) {
            dao.upsert(entity)
            offlineQueue.enqueue("UPDATE", "barbers/${entity.id}", mapOf(
                "name" to entity.name,
                "phone" to entity.phone,
                "isActive" to entity.isActive
            ))
            return Result.success(Unit)
        }
        return try {
            apiService.updateBarber(entity.id, mapOf(
                "name" to entity.name,
                "phone" to entity.phone,
                "isActive" to entity.isActive
            ))
            dao.upsert(entity)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteBarber(entity: BarberEntity): Result<Unit> {
        if (!networkMonitor.isOnlineNow()) {
            offlineQueue.enqueue("DELETE", "barbers/${entity.id}", emptyMap<String, Any>())
            dao.delete(entity)
            return Result.success(Unit)
        }
        return try {
            apiService.deleteBarber(entity.id)
            dao.delete(entity)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

fun BarberDto.toEntity(): BarberEntity = BarberEntity(
    id = id,
    name = name,
    phone = phone,
    isActive = isActive,
    workingDays = workingDays.joinToString(",")
)
