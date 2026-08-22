import { Barber } from '../types';
import { INITIAL_BARBERS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { fetchBarbersLive, dbCreateBarber, dbUpdateBarber, dbDeleteBarber, getSupabaseClient } from './supabaseClient';

export const barbersService = {
  async getBarbers(): Promise<Barber[]> {
    // 1. Direct Supabase client
    try {
      const liveBarbers = await fetchBarbersLive();
      if (liveBarbers !== null) {
        setLocal(STORAGE_KEYS.BARBERS, liveBarbers);
        return liveBarbers;
      }
    } catch {
      // Fall through to local cache
    }

    if (getSupabaseClient()) throw new Error('Gagal membaca barber dari Supabase.');
    return getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
  },

  async createBarber(barberData: Omit<Barber, 'id'>): Promise<Barber> {
    const created = await dbCreateBarber({
      name: barberData.name,
      phone: barberData.phone,
      isActive: barberData.isActive,
      workingDays: barberData.workingDays,
    });

    const list = getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
    list.push(created);
    setLocal(STORAGE_KEYS.BARBERS, list);
    return created;
  },

  async updateBarber(id: string, updates: Partial<Barber>): Promise<Barber> {
    const updated = await dbUpdateBarber(id, updates);

    const list = getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
    const idx = list.findIndex((b) => b.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updated };
    } else {
      list.push(updated);
    }
    setLocal(STORAGE_KEYS.BARBERS, list);
    return updated;
  },

  async deleteBarber(id: string): Promise<boolean> {
    await dbDeleteBarber(id);

    const list = getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS).filter((b) => b.id !== id);
    setLocal(STORAGE_KEYS.BARBERS, list);
    return true;
  },
};
