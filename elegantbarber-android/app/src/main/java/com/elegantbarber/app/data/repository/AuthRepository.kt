package com.elegantbarber.app.data.repository

import com.elegantbarber.app.data.remote.ApiService
import com.elegantbarber.app.data.remote.TokenHolder
import com.elegantbarber.app.data.remote.TokenManager
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    suspend fun login(username: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(username, password))
            if (response.success && !response.token.isNullOrBlank()) {
                TokenHolder.token = response.token
                tokenManager.saveAuth(
                    token = response.token,
                    displayName = response.user?.displayName ?: "Owner",
                    role = response.user?.role ?: "owner"
                )
                Result.success(response)
            } else {
                Result.failure(Exception("Token tidak valid"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        TokenHolder.token = null
        tokenManager.clearAuth()
    }

    suspend fun isLoggedIn(): Boolean {
        val token = tokenManager.token.first()
        return !token.isNullOrBlank()
    }

    suspend fun getToken(): String? {
        return tokenManager.token.first()
    }

    suspend fun getDisplayName(): String {
        return tokenManager.displayName.first()
    }
}
