package com.elegantbarber.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "barbers")
data class BarberEntity(
    @PrimaryKey val id: String,
    val name: String,
    val phone: String?,
    val isActive: Boolean,
    val workingDays: String
)
