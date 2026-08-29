import { SystemSettings } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { dbGetSettings, dbUpdateSettings } from './dbClient';

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    // 1. Ambil dari server (MongoDB via API routes)
    try {
      const liveSettings = await dbGetSettings();
      if (liveSettings) {
        setLocal(STORAGE_KEYS.SETTINGS, liveSettings);
        return liveSettings;
      }
    } catch {
      // Aksi lanjut ke cache lokal
    }

    return getLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const updated = await dbUpdateSettings(updates);
      if (updated) {
        setLocal(STORAGE_KEYS.SETTINGS, updated);
        return updated;
      }
    } catch (e) {
      console.error('[DB Update Settings]:', e);
      throw e;
    }

    // Local fallback
    const current = getLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const merged = { ...current, ...updates };
    setLocal(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  },

  async toggleBookingSwitch(isOpen?: boolean): Promise<{ isBookingOpen: boolean; message: string }> {
    // Pakai endpoint dedicated agar perubahan disimpan (awaited) ke MongoDB
    // dan kegagalan persist tampil sebagai error — bukan hasil sukses palsu.
    const res = await fetch('/api/settings/toggle-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: isOpen ?? null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      const msg: string =
        data?.error || (data?.message as string) || `Gagal mengubah status booking (HTTP ${res.status})`;
      throw new Error(msg);
    }

    const isOpenFinal: boolean = data.isBookingOpen;
    const message: string = data.message;

    // Sync local
    const localSettings = getLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    localSettings.isBookingOpen = isOpenFinal;
    setLocal(STORAGE_KEYS.SETTINGS, localSettings);

    return { isBookingOpen: isOpenFinal, message };
  },
};
