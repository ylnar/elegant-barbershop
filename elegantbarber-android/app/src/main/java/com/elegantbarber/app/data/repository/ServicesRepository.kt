package com.elegantbarber.app.data.repository

import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.ServiceEntity
import com.elegantbarber.app.data.remote.ApiService
import com.elegantbarber.app.sync.NetworkMonitor
import com.elegantbarber.app.sync.OfflineQueue
import java.util.UUID
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ServicesRepository @Inject constructor(
    private val apiService: ApiService,
    private val db: AppDatabase,
    private val networkMonitor: NetworkMonitor,
    private val offlineQueue: OfflineQueue
) {
    private val dao = db.serviceDao()

    fun observeAll(): Flow<List<ServiceEntity>> = dao.observeAll()

    suspend fun getActive(): List<ServiceEntity> = dao.getActive()

    suspend fun pullFromServer() {
        try {
            val remote = apiService.getServices()
            val localIds = dao.getAll().map { it.id }.toSet()
            val toUpsert = remote.map { it.toEntity() }.filter { it.id !in localIds }
            dao.upsertAll(toUpsert)
        } catch (e: Exception) {
            // Offline - keep cached data
        }
    }

    suspend fun createService(name: String, category: String, price: Long, durationMinutes: Int, description: String): Result<ServiceEntity> {
        val payload = mapOf(
            "name" to name,
            "category" to category,
            "price" to price,
            "durationMinutes" to durationMinutes,
            "description" to description,
            "isActive" to true
        )

        if (!networkMonitor.isOnlineNow()) {
            val entity = ServiceEntity(
                id = "offline-${UUID.randomUUID()}",
                name = name,
                category = category,
                price = price,
                durationMinutes = durationMinutes,
                description = description,
                badge = null,
                isActive = true
            )
            dao.upsert(entity)
            offlineQueue.enqueue("CREATE", "services", payload)
            return Result.success(entity)
        }

        return try {
            val response = apiService.createService(payload)
            val entity = ServiceEntity(
                id = (response["service"] as? Map<*, *>)?.get("id") as? String ?: error("ID missing"),
                name = name,
                category = category,
                price = price,
                durationMinutes = durationMinutes,
                description = description,
                badge = null,
                isActive = true
            )
            dao.upsert(entity)
            Result.success(entity)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateService(entity: ServiceEntity): Result<Unit> {
        if (!networkMonitor.isOnlineNow()) {
            dao.upsert(entity)
            offlineQueue.enqueue("UPDATE", "services/${entity.id}", mapOf(
                "name" to entity.name,
                "category" to entity.category,
                "price" to entity.price,
                "durationMinutes" to entity.durationMinutes,
                "description" to entity.description,
                "isActive" to entity.isActive
            ))
            return Result.success(Unit)
        }
        return try {
            apiService.updateService(entity.id, mapOf(
                "name" to entity.name,
                "category" to entity.category,
                "price" to entity.price,
                "durationMinutes" to entity.durationMinutes,
                "description" to entity.description,
                "isActive" to entity.isActive
            ))
            dao.upsert(entity)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteService(entity: ServiceEntity): Result<Unit> {
        if (!networkMonitor.isOnlineNow()) {
            offlineQueue.enqueue("DELETE", "services/${entity.id}", emptyMap<String, Any>())
            dao.delete(entity)
            return Result.success(Unit)
        }
        return try {
            apiService.deleteService(entity.id)
            dao.delete(entity)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

fun ServiceDto.toEntity(): ServiceEntity = ServiceEntity(
    id = id,
    name = name,
    category = category,
    price = price,
    durationMinutes = durationMinutes,
    description = description,
    badge = badge,
    isActive = isActive
)
