package com.elegantbarber.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.elegantbarber.app.data.local.entity.BarberEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BarberDao {
    @Query("SELECT * FROM barbers ORDER BY name ASC")
    fun observeAll(): Flow<List<BarberEntity>>

    @Query("SELECT * FROM barbers WHERE isActive = 1 ORDER BY name ASC")
    suspend fun getActive(): List<BarberEntity>

    @Query("SELECT * FROM barbers")
    suspend fun getAll(): List<BarberEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(barbers: List<BarberEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(barber: BarberEntity)

    @Query("DELETE FROM barbers")
    suspend fun clearAll()

    @Delete
    suspend fun delete(barber: BarberEntity)
}
