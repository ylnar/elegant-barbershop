package com.elegantbarber.app.data.repository

import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.TransactionEntity
import com.elegantbarber.app.data.remote.ApiService
import com.elegantbarber.app.sync.NetworkMonitor
import com.elegantbarber.app.sync.OfflineQueue
import com.google.gson.Gson
import java.util.UUID
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransactionsRepository @Inject constructor(
    private val apiService: ApiService,
    private val db: AppDatabase,
    private val networkMonitor: NetworkMonitor,
    private val offlineQueue: OfflineQueue
) {
    private val dao = db.transactionDao()
    private val gson = Gson()

    fun observeAll(): Flow<List<TransactionEntity>> = dao.observeAll()

    suspend fun pullFromServer(date: String? = null) {
        try {
            val remote = apiService.getTransactions(date = date)
            // Merge - keep local that we may have created offline
            val local = dao.getAll().map { it.id }.toSet()
            val toUpsert = remote.filter { it.id !in local }.map { it.toEntity() }
            if (toUpsert.isNotEmpty()) {
                dao.upsertAll(toUpsert)
            }
        } catch (e: Exception) {
            // Offline
        }
    }

    suspend fun createTransaction(
        customerName: String,
        customerPhone: String?,
        barberId: String,
        barberName: String,
        items: List<TransactionItemDto>,
        subtotal: Long,
        discount: Long,
        totalAmount: Long,
        paymentMethod: String,
        amountPaid: Long,
        changeAmount: Long,
        notes: String?
    ): Result<TransactionEntity> {
        val payload = mapOf(
            "customerName" to customerName,
            "customerPhone" to customerPhone,
            "barberId" to barberId,
            "barberName" to barberName,
            "items" to items.map { mapOf(
                "serviceId" to it.serviceId,
                "serviceName" to it.serviceName,
                "price" to it.price,
                "qty" to it.qty
            ) },
            "subtotal" to subtotal,
            "discount" to discount,
            "totalAmount" to totalAmount,
            "paymentMethod" to paymentMethod,
            "amountPaid" to amountPaid,
            "changeAmount" to changeAmount,
            "notes" to notes
        )

        if (!networkMonitor.isOnlineNow()) {
            // Offline: persist locally with temporary id and enqueue for sync.
            val offlineId = "offline-${UUID.randomUUID()}"
            val entity = TransactionEntity(
                id = offlineId,
                invoiceNumber = "OFFLINE",
                bookingId = null,
                customerName = customerName,
                customerPhone = customerPhone,
                barberId = barberId,
                barberName = barberName,
                itemsJson = gson.toJson(items),
                subtotal = subtotal,
                discount = discount,
                totalAmount = totalAmount,
                paymentMethod = paymentMethod,
                amountPaid = amountPaid,
                changeAmount = changeAmount,
                notes = notes,
                createdAt = System.currentTimeMillis().toString()
            )
            dao.upsert(entity)
            offlineQueue.enqueue("CREATE", "transactions", payload)
            return Result.success(entity)
        }

        return try {
            val response = apiService.createTransaction(payload)
            val created = response["transaction"] as? Map<*, *>
            val entity = TransactionEntity(
                id = created?.get("id") as? String ?: error("Transaction ID missing"),
                invoiceNumber = created?.get("invoiceNumber") as? String ?: "",
                bookingId = created?.get("bookingId") as? String,
                customerName = customerName,
                customerPhone = customerPhone,
                barberId = barberId,
                barberName = barberName,
                itemsJson = gson.toJson(items),
                subtotal = subtotal,
                discount = discount,
                totalAmount = totalAmount,
                paymentMethod = paymentMethod,
                amountPaid = amountPaid,
                changeAmount = changeAmount,
                notes = notes,
                createdAt = created?.get("createdAt") as? String ?: System.currentTimeMillis().toString()
            )
            dao.upsert(entity)
            Result.success(entity)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteTransaction(entity: TransactionEntity): Result<Unit> {
        if (!networkMonitor.isOnlineNow()) {
            offlineQueue.enqueue("DELETE", "transactions/${entity.id}", emptyMap<String, Any>())
            dao.deleteById(entity.id)
            return Result.success(Unit)
        }
        return try {
            apiService.deleteTransaction(entity.id)
            dao.deleteById(entity.id)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

fun TransactionDto.toEntity(): TransactionEntity = TransactionEntity(
    id = id,
    invoiceNumber = invoiceNumber,
    bookingId = bookingId,
    customerName = customerName,
    customerPhone = customerPhone,
    barberId = barberId,
    barberName = barberName,
    itemsJson = Gson().toJson(items),
    subtotal = subtotal,
    discount = discount,
    totalAmount = totalAmount,
    paymentMethod = paymentMethod,
    amountPaid = amountPaid,
    changeAmount = changeAmount,
    notes = notes,
    createdAt = createdAt
)
