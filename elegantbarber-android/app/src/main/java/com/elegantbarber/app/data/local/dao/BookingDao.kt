package com.elegantbarber.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.elegantbarber.app.data.local.entity.BookingEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BookingDao {
    @Query("SELECT * FROM bookings ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<BookingEntity>>

    @Query("SELECT * FROM bookings WHERE date = :date ORDER BY timeSlot ASC")
    suspend fun getByDate(date: String): List<BookingEntity>

    @Query("SELECT * FROM bookings WHERE status = :status ORDER BY createdAt DESC")
    suspend fun getByStatus(status: String): List<BookingEntity>

    @Query("SELECT * FROM bookings")
    suspend fun getAll(): List<BookingEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(bookings: List<BookingEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(booking: BookingEntity)

    @Query("DELETE FROM bookings WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM bookings")
    suspend fun clearAll()

    @Query("SELECT COUNT(*) FROM bookings WHERE date = :date AND status IN ('pending','confirmed','in_service')")
    fun observeActiveCountByDate(date: String): Flow<Int>
}
