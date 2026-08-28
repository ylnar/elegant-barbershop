package com.elegantbarber.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "bookings")
data class BookingEntity(
    @PrimaryKey val id: String,
    val bookingCode: String,
    val customerName: String,
    val customerPhone: String,
    val customerEmail: String?,
    val serviceId: String,
    val serviceName: String,
    val servicePrice: Long,
    val barberId: String,
    val barberName: String,
    val date: String,
    val timeSlot: String,
    val totalAmount: Long,
    val status: String,
    val isWalkIn: Boolean,
    val createdAt: String,
    val updatedAt: String
)
