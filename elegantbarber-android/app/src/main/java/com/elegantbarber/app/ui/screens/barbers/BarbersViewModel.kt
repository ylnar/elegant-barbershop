package com.elegantbarber.app.ui.screens.barbers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elegantbarber.app.data.local.AppDatabase
import com.elegantbarber.app.data.local.entity.BarberEntity
import com.elegantbarber.app.data.repository.BarbersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BarberFormState(
    val isEditing: Boolean = false,
    val barber: BarberEntity? = null,
    val name: String = "",
    val phone: String = "",
    val isSaving: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class BarbersViewModel @Inject constructor(
    private val db: AppDatabase,
    private val barbersRepository: BarbersRepository
) : ViewModel() {

    private val _barbers = MutableStateFlow<List<BarberEntity>>(emptyList())
    val barbers: StateFlow<List<BarberEntity>> = _barbers.asStateFlow()

    private val _showForm = MutableStateFlow(false)
    val showForm: StateFlow<Boolean> = _showForm.asStateFlow()

    private val _form = MutableStateFlow(BarberFormState())
    val form: StateFlow<BarberFormState> = _form.asStateFlow()

    init {
        viewModelScope.launch {
            barbersRepository.pullFromServer()
            db.barberDao().observeAll().collect { _barbers.value = it }
        }
    }

    fun showAddForm() {
        _showForm.value = true
        _form.value = BarberFormState(isEditing = false)
    }

    fun showEditForm(barber: BarberEntity) {
        _showForm.value = true
        _form.value = BarberFormState(
            isEditing = true,
            barber = barber,
            name = barber.name,
            phone = barber.phone ?: ""
        )
    }

    fun hideForm() {
        _showForm.value = false
    }

    fun onNameChange(v: String) { _form.value = _form.value.copy(name = v, error = null) }
    fun onPhoneChange(v: String) { _form.value = _form.value.copy(phone = v) }

    fun saveForm() {
        val formState = _form.value
        if (formState.name.isBlank()) {
            _form.value = formState.copy(error = "Nama barber wajib diisi.")
            return
        }
        _form.value = formState.copy(isSaving = true, error = null)
        viewModelScope.launch {
            if (formState.isEditing && formState.barber != null) {
                val updated = formState.barber.copy(
                    name = formState.name,
                    phone = formState.phone.ifBlank { null }
                )
                barbersRepository.updateBarber(updated)
            } else {
                barbersRepository.createBarber(formState.name, formState.phone.ifBlank { null })
            }
            _form.value = _form.value.copy(isSaving = false)
            hideForm()
        }
    }

    fun toggleActive(barber: BarberEntity) {
        viewModelScope.launch {
            barbersRepository.updateBarber(barber.copy(isActive = !barber.isActive))
        }
    }

    fun delete(barber: BarberEntity) {
        viewModelScope.launch {
            barbersRepository.deleteBarber(barber)
        }
    }
}
