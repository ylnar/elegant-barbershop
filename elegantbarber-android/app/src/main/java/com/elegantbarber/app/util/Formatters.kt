package com.elegantbarber.app.util

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object Formatters {

    private val idrFormat: NumberFormat = NumberFormat.getNumberInstance(Locale("id", "ID"))

    fun formatRupiah(amount: Long): String {
        return "Rp${idrFormat.format(amount)}"
    }

    fun formatRupiah(amount: Double): String {
        return formatRupiah(amount.toLong())
    }

    fun formatDate(isoString: String): String {
        return try {
            val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US)
            val date = input.parse(isoString) ?: return isoString
            val output = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("id", "ID"))
            output.format(date)
        } catch (e: Exception) {
            isoString
        }
    }

    fun formatDateOnly(isoString: String): String {
        return try {
            val input = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val date = input.parse(isoString) ?: return isoString
            val output = SimpleDateFormat("EEE, dd MMM yyyy", Locale("id", "ID"))
            output.format(date)
        } catch (e: Exception) {
            isoString
        }
    }

    fun formatTime(timeSlot: String): String {
        return timeSlot.take(5)
    }

    fun currentDate(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return sdf.format(Date())
    }

    fun currentDateDisplay(): String {
        val sdf = SimpleDateFormat("EEEE, dd MMMM yyyy", Locale("id", "ID"))
        return sdf.format(Date())
    }
}

object StatusLabels {
    fun bookingStatus(status: String): String {
        return when (status) {
            "pending" -> "Menunggu"
            "confirmed" -> "Terkonfirmasi"
            "in_service" -> "Dilayani"
            "completed" -> "Selesai"
            "cancelled" -> "Dibatalkan"
            else -> status
        }
    }

    fun paymentMethod(method: String): String {
        return when (method) {
            "cash" -> "Tunai"
            "qris" -> "QRIS"
            "transfer" -> "Transfer"
            else -> method
        }
    }
}
