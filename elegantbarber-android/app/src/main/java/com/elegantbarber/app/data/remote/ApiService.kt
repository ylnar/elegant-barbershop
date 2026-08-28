package com.elegantbarber.app.data.remote

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query
import com.elegantbarber.app.data.repository.*

interface ApiService {

    // ── Auth ──
    @POST("auth/token")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    // ── Public data ──
    @GET("services")
    suspend fun getServices(): List<ServiceDto>

    @GET("barbers")
    suspend fun getBarbers(): List<BarberDto>

    @GET("bookings")
    suspend fun getBookings(
        @Query("date") date: String? = null,
        @Query("status") status: String? = null,
        @Query("search") search: String? = null
    ): List<BookingDto>

    @GET("transactions")
    suspend fun getTransactions(
        @Query("date") date: String? = null,
        @Query("paymentMethod") paymentMethod: String? = null,
        @Query("search") search: String? = null
    ): List<TransactionDto>

    @GET("settings")
    suspend fun getSettings(): SettingsDto

    // ── Mutations (require auth) ──

    @POST("transactions")
    suspend fun createTransaction(@Body payload: Map<String, Any?>): Map<String, Any?>

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: String): Map<String, Any?>

    @POST("services")
    suspend fun createService(@Body payload: Map<String, Any?>): Map<String, Any?>

    @PUT("services/{id}")
    suspend fun updateService(@Path("id") id: String, @Body payload: Map<String, Any?>): Map<String, Any?>

    @DELETE("services/{id}")
    suspend fun deleteService(@Path("id") id: String): Map<String, Any?>

    @POST("barbers")
    suspend fun createBarber(@Body payload: Map<String, Any?>): Map<String, Any?>

    @PUT("barbers/{id}")
    suspend fun updateBarber(@Path("id") id: String, @Body payload: Map<String, Any?>): Map<String, Any?>

    @DELETE("barbers/{id}")
    suspend fun deleteBarber(@Path("id") id: String): Map<String, Any?>

    @PUT("bookings/{id}")
    suspend fun updateBooking(@Path("id") id: String, @Body payload: Map<String, Any?>): Map<String, Any?>

    @DELETE("bookings/{id}")
    suspend fun deleteBooking(@Path("id") id: String): Map<String, Any?>

    @PUT("settings")
    suspend fun updateSettings(@Body payload: Map<String, Any?>): Map<String, Any?>

    @POST("settings/toggle-booking")
    suspend fun toggleBooking(@Body payload: Map<String, Any?>): Map<String, Any?>
}
