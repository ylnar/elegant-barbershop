/**
 * Safe local storage utility with JSON serialization and memory fallback
 */
export const STORAGE_KEYS = {
  SETTINGS: 'elegant_barber_settings_v2',
  SERVICES: 'elegant_barber_services_v2',
  BARBERS: 'elegant_barber_barbers_v2',
  BOOKINGS: 'elegant_barber_bookings_v2',
  TRANSACTIONS: 'elegant_barber_transactions_v2',
} as const;

const CACHE_VERSION_KEY = 'elegant_barber_cache_version';
const CURRENT_CACHE_VERSION = '2'; // Naikkan versi untuk force-clear cache lama

/**
 * Clear stale localStorage on version bump.
 * Called once per app load to prevent phantom data.
 */
export function clearStaleCacheIfNeeded(): void {
  try {
    const stored = localStorage.getItem(CACHE_VERSION_KEY);
    if (stored !== CURRENT_CACHE_VERSION) {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }
  } catch {
    // Ignore — localStorage might be unavailable
  }
}

export function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage write failed:', err);
  }
}

/**
 * Clear all cached data (manual reset)
 */
export function clearAllCache(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore
  }
}
