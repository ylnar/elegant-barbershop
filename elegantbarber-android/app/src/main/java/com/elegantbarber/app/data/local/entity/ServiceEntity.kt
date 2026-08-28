package com.elegantbarber.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "services")
data class ServiceEntity(
    @PrimaryKey val id: String,
    val name: String,
    val category: String,
    val price: Long,
    val durationMinutes: Int,
    val description: String,
    val badge: String?,
    val isActive: Boolean
)
