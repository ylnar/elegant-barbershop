import { Barber } from '../types';
import { INITIAL_BARBERS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { fetchBarbersLive } from './supabaseClient';

export const barbersService = {
  async getBarbers(): Promise<Barber[]> {
    // 1. Try direct live client Supabase SDK for instant live query
    try {
      const liveBarbers = await fetchBarbersLive();
      if (liveBarbers && liveBarbers.length > 0) {
        setLocal(STORAGE_KEYS.BARBERS, liveBarbers);
        return liveBarbers;
      }
    } catch {
      // Fall through to server API
    }

    // 2. Fetch from backend server API
    try {
      const res = await fetch('/api/barbers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLocal(STORAGE_KEYS.BARBERS, data);
          return data;
        }
      }
    } catch {
      // Fall through to local cache
    }

    return getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
  },

  async createBarber(barberData: Omit<Barber, 'id'>): Promise<Barber> {
    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barberData),
      });
      if (res.ok) {
        const data = await res.json();
        const created = data.barber;
        const list = getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
        list.push(created);
        setLocal(STORAGE_KEYS.BARBERS, list);
        return created;
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Barber gagal disimpan ke database.');
    } catch {
      throw new Error('Barber gagal disimpan ke database. Periksa koneksi server dan Supabase.');
    }
  },

  async updateBarber(id: string, updates: Partial<Barber>): Promise<Barber> {
    try {
      const res = await fetch(`/api/barbers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.barber;
        const list = getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
        const idx = list.findIndex((b) => b.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updated };
        } else {
          list.push(updated);
        }
        setLocal(STORAGE_KEYS.BARBERS, list);
        return updated;
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Perubahan barber gagal disimpan ke database.');
    } catch {
      throw new Error('Perubahan barber gagal disimpan ke database. Periksa koneksi server dan Supabase.');
    }
  },

  async deleteBarber(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/barbers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const list = getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS).filter((b) => b.id !== id);
        setLocal(STORAGE_KEYS.BARBERS, list);
        return true;
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Barber gagal dihapus dari database.');
    } catch {
      throw new Error('Barber gagal dihapus dari database. Periksa koneksi server dan Supabase.');
    }
  },
};

