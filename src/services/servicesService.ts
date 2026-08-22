import { Service } from '../types';
import { INITIAL_SERVICES } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { fetchServicesLive } from './supabaseClient';

export const servicesService = {
  async getServices(): Promise<Service[]> {
    // 1. Try direct live client Supabase SDK
    try {
      const liveServices = await fetchServicesLive();
      if (liveServices && liveServices.length > 0) {
        setLocal(STORAGE_KEYS.SERVICES, liveServices);
        return liveServices;
      }
    } catch {
      // Fall through to server API
    }

    // 2. Fetch from backend server API
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLocal(STORAGE_KEYS.SERVICES, data);
          return data;
        }
      }
    } catch {
      // Fall through to local cache
    }

    return getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  },

  async createService(serviceData: Omit<Service, 'id'>): Promise<Service> {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (res.ok) {
        const data = await res.json();
        const created = data.service;
        const list = getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
        list.push(created);
        setLocal(STORAGE_KEYS.SERVICES, list);
        return created;
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Layanan gagal disimpan ke database.');
    } catch {
      throw new Error('Layanan gagal disimpan ke database. Periksa koneksi server dan Supabase.');
    }
  },

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.service;
        const list = getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
        const idx = list.findIndex((s) => s.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updated };
        } else {
          list.push(updated);
        }
        setLocal(STORAGE_KEYS.SERVICES, list);
        return updated;
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Perubahan layanan gagal disimpan ke database.');
    } catch {
      throw new Error('Perubahan layanan gagal disimpan ke database. Periksa koneksi server dan Supabase.');
    }
  },

  async deleteService(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const list = getLocal<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES).filter((s) => s.id !== id);
        setLocal(STORAGE_KEYS.SERVICES, list);
        return true;
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Layanan gagal dihapus dari database.');
    } catch {
      throw new Error('Layanan gagal dihapus dari database. Periksa koneksi server dan Supabase.');
    }
  },
};

