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
