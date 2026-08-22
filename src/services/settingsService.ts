import { SystemSettings } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setLocal(STORAGE_KEYS.SETTINGS, data);
        return data;
      }
    } catch (e) {
      console.warn('Backend offline, using local settings:', e);
    }
    return getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setLocal(STORAGE_KEYS.SETTINGS, data.settings);
        return data.settings;
      }
    } catch (e) {
      console.warn('Backend update failed, updating locally:', e);
    }
    const current = getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const updated = { ...current, ...updates };
    setLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  async toggleBookingSwitch(isOpen?: boolean): Promise<{ isBookingOpen: boolean; message: string }> {
    try {
      const res = await fetch('/api/settings/toggle-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen }),
      });
      if (res.ok) {
        const data = await res.json();
        const cur = getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
        cur.isBookingOpen = data.isBookingOpen;
        setLocal(STORAGE_KEYS.SETTINGS, cur);
        return data;
      }
    } catch (e) {
      console.warn('Toggle failed on server, toggling locally:', e);
    }
    const cur = getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    cur.isBookingOpen = typeof isOpen === 'boolean' ? isOpen : !cur.isBookingOpen;
    setLocal(STORAGE_KEYS.SETTINGS, cur);
    return {
      isBookingOpen: cur.isBookingOpen,
      message: cur.isBookingOpen ? 'Sistem Booking Online DIBUKA' : 'Sistem Booking Online DITUTUP (Walk-In Only)',
    };
  },
};
