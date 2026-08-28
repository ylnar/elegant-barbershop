package com.elegantbarber.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: String,
    val invoiceNumber: String,
    val bookingId: String?,
    val customerName: String,
    val customerPhone: String?,
    val barberId: String,
    val barberName: String,
    val itemsJson: String,
    val subtotal: Long,
    val discount: Long,
    val totalAmount: Long,
    val paymentMethod: String,
    val amountPaid: Long,
    val changeAmount: Long,
    val notes: String?,
    val createdAt: String
)
