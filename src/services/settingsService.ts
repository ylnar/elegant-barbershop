import { SystemSettings } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { dbGetSettings, dbUpdateSettings } from './supabaseClient';

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    // 1. Direct Supabase client
    try {
      const liveSettings = await dbGetSettings();
      if (liveSettings) {
        setLocal(STORAGE_KEYS.SETTINGS, liveSettings);
        return liveSettings;
      }
    } catch {
      // Fall through to local cache
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
      console.warn('[Supabase Update Settings]:', e);
    }

    // Local fallback
    const current = getLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const merged = { ...current, ...updates };
    setLocal(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  },

  async toggleBookingSwitch(isOpen?: boolean): Promise<{ isBookingOpen: boolean; message: string }> {
    try {
      // First read current state
      const current = await dbGetSettings();
      const currentState = current?.isBookingOpen ?? true;
      const newState = typeof isOpen === 'boolean' ? isOpen : !currentState;

      const updated = await dbUpdateSettings({ isBookingOpen: newState });
      const isOpenFinal = updated?.isBookingOpen ?? newState;
      const message = isOpenFinal
        ? 'Sistem Booking Online DIBUKA'
        : 'Sistem Booking Online DITUTUP (Walk-In Only)';

      // Sync local
      const localSettings = getLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      localSettings.isBookingOpen = isOpenFinal;
      setLocal(STORAGE_KEYS.SETTINGS, localSettings);

      return { isBookingOpen: isOpenFinal, message };
    } catch (e) {
      console.warn('[Supabase Toggle Booking]:', e);
      // Local fallback
      const cur = getLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      cur.isBookingOpen = typeof isOpen === 'boolean' ? isOpen : !cur.isBookingOpen;
      setLocal(STORAGE_KEYS.SETTINGS, cur);
      return {
        isBookingOpen: cur.isBookingOpen,
        message: cur.isBookingOpen ? 'Sistem Booking Online DIBUKA' : 'Sistem Booking Online DITUTUP (Walk-In Only)',
      };
    }
  },
};
