package com.elegantbarber.app.data.repository

import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.SettingsEntity
import com.elegantbarber.app.data.remote.ApiService
import com.google.gson.Gson
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val apiService: ApiService,
    private val db: AppDatabase
) {
    private val dao = db.settingsDao()
    private val gson = Gson()
    private val key = "default_settings"

    suspend fun getSettingsCached(): SettingsDto? {
        val entity = dao.get(key) ?: return null
        return try {
            gson.fromJson(entity.json, SettingsDto::class.java)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun pullFromServer(): SettingsDto? {
        return try {
            val remote = apiService.getSettings()
            val json = gson.toJson(remote)
            dao.upsert(SettingsEntity(key, json))
            remote
        } catch (e: Exception) {
            null
        }
    }

    suspend fun get(): SettingsDto? {
        return pullFromServer() ?: getSettingsCached()
    }

    suspend fun toggleBooking(isOpen: Boolean): Result<Unit> {
        return try {
            apiService.toggleBooking(mapOf("isOpen" to isOpen))
            pullFromServer()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
