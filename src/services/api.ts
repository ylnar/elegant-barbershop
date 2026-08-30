import { settingsService } from './settingsService';
import { servicesService } from './servicesService';
import { barbersService } from './barbersService';
import { bookingsService } from './bookingsService';
import { transactionsService } from './transactionsService';
import { aiService } from './aiService';
import { blueprintService } from './blueprintService';
import { lookupCustomerByPhone, upsertCustomer, fetchCustomers, updateCustomer, deleteCustomer } from './customersService';
import { STORAGE_KEYS } from './storage';

// Re-export tipe Customer agar bisa diimpor dari satu pintu (services/api).
export type { Customer } from './customersService';

// ── Trash / Soft-Delete ───────────────────────────────────────────────────

export interface TrashItem {
  type: string;
  id: string;
  name: string;
  deletedAt: string;
  detail: Record<string, unknown>;
}

export const trashService = {
  async getDeletedItems(type?: string): Promise<TrashItem[]> {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    const res = await fetch(`/api/trash${qs}`);
    if (!res.ok) return [];
    return res.json();
  },

  async restoreItem(type: string, id: string): Promise<boolean> {
    const res = await fetch(`/api/trash/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
      method: 'PUT',
    });
    return res.ok;
  },

  async permanentDelete(type: string, id: string): Promise<boolean> {
    const res = await fetch(`/api/trash/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async permanentDeleteAll(type: string): Promise<number> {
    const res = await fetch('/api/trash', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.deleted || 0;
  },
};

export {
  STORAGE_KEYS,
  settingsService,
  servicesService,
  barbersService,
  bookingsService,
  transactionsService,
  aiService,
  blueprintService,
  lookupCustomerByPhone,
  upsertCustomer,
  fetchCustomers,
  updateCustomer,
  deleteCustomer,
};

/**
 * Unified API facade for seamless backwards-compatibility
 */
export const api = {
  // Settings
  getSettings: settingsService.getSettings,
  updateSettings: settingsService.updateSettings,
  toggleBookingSwitch: settingsService.toggleBookingSwitch,

  // Services
  getServices: servicesService.getServices,
  createService: servicesService.createService,
  updateService: servicesService.updateService,
  deleteService: servicesService.deleteService,

  // Barbers
  getBarbers: barbersService.getBarbers,
  createBarber: barbersService.createBarber,
  updateBarber: barbersService.updateBarber,
  deleteBarber: barbersService.deleteBarber,

  // Bookings
  getBookings: bookingsService.getBookings,
  createBooking: bookingsService.createBooking,
  updateBooking: bookingsService.updateBooking,
  deleteBooking: bookingsService.deleteBooking,
  trackBooking: bookingsService.trackBooking,

  // Transactions (POS)
  getTransactions: transactionsService.getTransactions,
  createTransaction: transactionsService.createTransaction,
  deleteTransaction: transactionsService.deleteTransaction,

  // AI Barber Consultant
  getAIConsultation: aiService.getAIConsultation,

  // Trash (Soft-Delete)
  getDeletedItems: trashService.getDeletedItems,
  restoreItem: trashService.restoreItem,
  permanentDelete: trashService.permanentDelete,
  permanentDeleteAll: trashService.permanentDeleteAll,

  // Blueprints & Database
  getDatabaseStatus: blueprintService.getDatabaseStatus,
  getDatabaseSchema: blueprintService.getDatabaseSchema,
  getSitemap: blueprintService.getSitemap,

  // Customers
  lookupCustomerByPhone,
  upsertCustomer,
  fetchCustomers,
  updateCustomer,
  deleteCustomer,
};
