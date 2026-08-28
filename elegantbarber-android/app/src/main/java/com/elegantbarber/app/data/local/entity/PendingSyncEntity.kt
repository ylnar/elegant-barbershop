package com.elegantbarber.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Offline operation queue. Dikirim ke server saat online kembali.
 */
@Entity(tableName = "pending_sync")
data class PendingSyncEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String,           // CREATE / UPDATE / DELETE
    val endpoint: String,       // e.g. "transactions", "services/:id"
    val payloadJson: String,
    val createdAt: Long
)
