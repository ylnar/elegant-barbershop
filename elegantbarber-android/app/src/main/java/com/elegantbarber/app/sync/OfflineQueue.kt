package com.elegantbarber.app.sync

import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.PendingSyncEntity
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Offline-first mutation queue.
 *
 * Ketika aplikasi offline, operasi mutasi (create/update/delete) disimpan
 * ke tabel `pending_sync` dan juga dipersist ke Room lokal. Saat online,
 * [SyncManager.runPendingSync] memutuskannya satu per satu ke server.
 */
@Singleton
class OfflineQueue @Inject constructor(
    private val db: AppDatabase
) {
    private val dao = db.pendingSyncDao()
    private val gson = Gson()

    /** Simpan operasi yang menunggu sinkronisasi. */
    suspend fun enqueue(type: String, endpoint: String, payload: Any) {
        dao.insert(
            PendingSyncEntity(
                type = type,
                endpoint = endpoint,
                payloadJson = gson.toJson(payload),
                createdAt = System.currentTimeMillis()
            )
        )
    }

    fun count(): Flow<Int> = dao.observeCount()

    suspend fun all(): List<PendingSyncEntity> = dao.getAll()

    suspend fun remove(item: PendingSyncEntity) = dao.delete(item)
}
