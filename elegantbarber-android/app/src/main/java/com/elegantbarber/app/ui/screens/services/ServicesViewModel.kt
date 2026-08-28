package com.elegantbarber.app.ui.screens.services

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.ServiceEntity
import com.elegantbarber.app.data.repository.ServicesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ServiceFormState(
    val isEditing: Boolean = false,
    val service: ServiceEntity? = null,
    val name: String = "",
    val category: String = "haircut",
    val price: String = "",
    val duration: String = "",
    val description: String = "",
    val isSaving: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ServicesViewModel @Inject constructor(
    private val db: AppDatabase,
    private val servicesRepository: ServicesRepository
) : ViewModel() {

    private val _services = MutableStateFlow<List<ServiceEntity>>(emptyList())
    val services: StateFlow<List<ServiceEntity>> = _services.asStateFlow()

    private val _showForm = MutableStateFlow(false)
    val showForm: StateFlow<Boolean> = _showForm.asStateFlow()

    private val _form = MutableStateFlow(ServiceFormState())
    val form: StateFlow<ServiceFormState> = _form.asStateFlow()

    init {
        viewModelScope.launch {
            servicesRepository.pullFromServer()
            db.serviceDao().observeAll().collect { _services.value = it }
        }
    }

    fun showAddForm() {
        _showForm.value = true
        _form.value = ServiceFormState(isEditing = false)
    }

    fun showEditForm(service: ServiceEntity) {
        _showForm.value = true
        _form.value = ServiceFormState(
            isEditing = true,
            service = service,
            name = service.name,
            category = service.category,
            price = service.price.toString(),
            duration = service.durationMinutes.toString(),
            description = service.description
        )
    }

    fun hideForm() {
        _showForm.value = false
    }

    fun onNameChange(v: String) { _form.value = _form.value.copy(name = v, error = null) }
    fun onCategoryChange(v: String) { _form.value = _form.value.copy(category = v) }
    fun onPriceChange(v: String) { _form.value = _form.value.copy(price = v.filter { it.isDigit() }, error = null) }
    fun onDurationChange(v: String) { _form.value = _form.value.copy(duration = v.filter { it.isDigit() }, error = null) }
    fun onDescriptionChange(v: String) { _form.value = _form.value.copy(description = v) }

    fun saveForm() {
        val formState = _form.value
        val price = formState.price.toLongOrNull()
        val duration = formState.duration.toIntOrNull() ?: 30
        if (formState.name.isBlank()) {
            _form.value = formState.copy(error = "Nama layanan wajib diisi.")
            return
        }
        if (price == null || price <= 0) {
            _form.value = formState.copy(error = "Harga harus angka valid.")
            return
        }
        _form.value = formState.copy(isSaving = true, error = null)
        viewModelScope.launch {
            if (formState.isEditing && formState.service != null) {
                val updated = formState.service.copy(
                    name = formState.name,
                    category = formState.category,
                    price = price,
                    durationMinutes = duration,
                    description = formState.description
                )
                servicesRepository.updateService(updated)
            } else {
                servicesRepository.createService(
                    name = formState.name,
                    category = formState.category,
                    price = price,
                    durationMinutes = duration,
                    description = formState.description
                )
            }
            _form.value = _form.value.copy(isSaving = false)
            hideForm()
        }
    }

    fun toggleActive(service: ServiceEntity) {
        viewModelScope.launch {
            servicesRepository.updateService(service.copy(isActive = !service.isActive))
        }
    }

    fun delete(service: ServiceEntity) {
        viewModelScope.launch {
            servicesRepository.deleteService(service)
        }
    }
}
