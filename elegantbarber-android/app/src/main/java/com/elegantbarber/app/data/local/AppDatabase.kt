package com.elegantbarber.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.elegantbarber.app.data.local.dao.BarberDao
import com.elegantbarber.app.data.local.dao.BookingDao
import com.elegantbarber.app.data.local.dao.PendingSyncDao
import com.elegantbarber.app.data.local.dao.ServiceDao
import com.elegantbarber.app.data.local.dao.SettingsDao
import com.elegantbarber.app.data.local.dao.TransactionDao
import com.elegantbarber.app.data.local.entity.BarberEntity
import com.elegantbarber.app.data.local.entity.BookingEntity
import com.elegantbarber.app.data.local.entity.PendingSyncEntity
import com.elegantbarber.app.data.local.entity.ServiceEntity
import com.elegantbarber.app.data.local.entity.SettingsEntity
import com.elegantbarber.app.data.local.entity.TransactionEntity

@Database(
    entities = [
        ServiceEntity::class,
        BarberEntity::class,
        BookingEntity::class,
        TransactionEntity::class,
        SettingsEntity::class,
        PendingSyncEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun serviceDao(): ServiceDao
    abstract fun barberDao(): BarberDao
    abstract fun bookingDao(): BookingDao
    abstract fun transactionDao(): TransactionDao
    abstract fun settingsDao(): SettingsDao
    abstract fun pendingSyncDao(): PendingSyncDao

    companion object {
        const val DB_NAME = "elegant_barber.db"

        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DB_NAME
                ).build().also { INSTANCE = it }
            }
        }
    }
}
