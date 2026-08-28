package com.elegantbarber.app.data.repository

import com.google.gson.annotations.SerializedName

// ── DTO models matching web API responses ──

data class LoginRequest(
    val username: String,
    val password: String
)

data class AuthResponse(
    val success: Boolean,
    val token: String,
    val user: UserDto?
)

data class UserDto(
    val id: String,
    val username: String,
    val displayName: String,
    val role: String
)

data class ServiceDto(
    val id: String,
    val name: String,
    val category: String,
    val price: Long,
    @SerializedName("durationMinutes") val durationMinutes: Int,
    val description: String,
    val badge: String?,
    @SerializedName("isActive") val isActive: Boolean
)

data class BarberDto(
    val id: String,
    val name: String,
    val phone: String?,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("workingDays") val workingDays: List<Int>
)

data class BookingDto(
    val id: String,
    @SerializedName("bookingCode") val bookingCode: String,
    @SerializedName("customerName") val customerName: String,
    @SerializedName("customerPhone") val customerPhone: String,
    @SerializedName("customerEmail") val customerEmail: String?,
    @SerializedName("serviceId") val serviceId: String,
    @SerializedName("serviceName") val serviceName: String,
    @SerializedName("servicePrice") val servicePrice: Long,
    @SerializedName("barberId") val barberId: String,
    @SerializedName("barberName") val barberName: String,
    val date: String,
    @SerializedName("timeSlot") val timeSlot: String,
    @SerializedName("totalAmount") val totalAmount: Long,
    val status: String,
    @SerializedName("isWalkIn") val isWalkIn: Boolean,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String
)

data class TransactionItemDto(
    @SerializedName("serviceId") val serviceId: String,
    @SerializedName("serviceName") val serviceName: String,
    val price: Long,
    val qty: Int
)

data class TransactionDto(
    val id: String,
    @SerializedName("invoiceNumber") val invoiceNumber: String,
    @SerializedName("bookingId") val bookingId: String?,
    @SerializedName("customerName") val customerName: String,
    @SerializedName("customerPhone") val customerPhone: String?,
    @SerializedName("barberId") val barberId: String,
    @SerializedName("barberName") val barberName: String,
    val items: List<TransactionItemDto>,
    val subtotal: Long,
    val discount: Long,
    @SerializedName("totalAmount") val totalAmount: Long,
    @SerializedName("paymentMethod") val paymentMethod: String,
    @SerializedName("amountPaid") val amountPaid: Long,
    @SerializedName("changeAmount") val changeAmount: Long,
    val notes: String?,
    @SerializedName("createdAt") val createdAt: String
)

data class SettingsDto(
    @SerializedName("isBookingOpen") val isBookingOpen: Boolean,
    @SerializedName("walkInOnlyMessage") val walkInOnlyMessage: String?,
    @SerializedName("maintenanceMessage") val maintenanceMessage: String?,
    @SerializedName("currentWalkInQueue") val currentWalkInQueue: Int,
    @SerializedName("estimatedWalkInWaitMinutes") val estimatedWalkInWaitMinutes: Int,
    @SerializedName("shopName") val shopName: String?,
    val tagline: String?,
    val address: String?,
    @SerializedName("googleMapsUrl") val googleMapsUrl: String?,
    val phone: String?,
    @SerializedName("whatsappNumber") val whatsappNumber: String?,
    val email: String?,
    @SerializedName("instagramHandle") val instagramHandle: String?,
    @SerializedName("openTime") val openTime: String?,
    @SerializedName("closeTime") val closeTime: String?,
    @SerializedName("slotIntervalMinutes") val slotIntervalMinutes: Int,
    @SerializedName("maxSimultaneousBookingsPerSlot") val maxSimultaneousBookingsPerSlot: Int,
    val currency: String?
)

data class ApiErrorResponse(
    val error: String
)
