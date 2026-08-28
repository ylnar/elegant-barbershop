package com.elegantbarber.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import com.elegantbarber.app.data.local.entity.PendingSyncEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PendingSyncDao {
    @Query("SELECT * FROM pending_sync ORDER BY id ASC")
    fun observeAll(): Flow<List<PendingSyncEntity>>

    @Query("SELECT * FROM pending_sync ORDER BY id ASC")
    suspend fun getAll(): List<PendingSyncEntity>

    @Query("SELECT COUNT(*) FROM pending_sync")
    fun observeCount(): Flow<Int>

    @Insert
    suspend fun insert(item: PendingSyncEntity): Long

    @Delete
    suspend fun delete(item: PendingSyncEntity)

    @Query("DELETE FROM pending_sync")
    suspend fun clearAll()
}