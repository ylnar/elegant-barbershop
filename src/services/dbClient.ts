import { Barber, Booking, Service, ServiceCategory, SystemSettings, Transaction } from '../types';

/**
 * dbClient — lapisan akses database sisi klien (MongoDB via API routes).
 *
 * MongoDB tidak bisa diakses langsung dari browser, sehingga semua operasi
 * dilewatkan ke endpoint API Next.js (server) yang terhubung ke MongoDB.
 * Jika server tidak dapat dijangkau/database mati, fungsi mengembalikan null
 * sehingga service layer memakai fallback localStorage.
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error body
    }
    const err: any = new Error(message);
    // Simpan status HTTP agar service layer bisa membedakan 404 ("sudah tidak
    // ada") dari kegagalan lain.
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ========================================================================
// CONNECTION STATUS
// ========================================================================

export interface DatabaseStatusInfo {
  isConfigured: boolean;
  isConnected: boolean;
  uriMasked: string | null;
  dbName: string | null;
  mode: 'mongodb_live' | 'in_memory_fallback';
  collections: {
    services: boolean;
    barbers: boolean;
    bookings: boolean;
    transactions: boolean;
    settings: boolean;
    customers: boolean;
  };
  counts: Record<string, number>;
  message: string;
}

export const isDbConfigured = (): boolean => true;

export const checkDbConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    const status = await request<DatabaseStatusInfo>('/api/database/status');
    return {
      connected: status.mode === 'mongodb_live',
      message: status.message,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Server database tidak dapat dijangkau: ${err?.message || 'terjadi kesalahan'}`,
    };
  }
};

// ========================================================================
// SETTINGS
// ========================================================================

export const dbGetSettings = async (): Promise<SystemSettings | null> => {
  try {
    return await request<SystemSettings>('/api/settings');
  } catch {
    return null;
  }
};

export const dbUpdateSettings = async (updates: Partial<SystemSettings>): Promise<SystemSettings | null> => {
  try {
    const res = await request<{ success: boolean; settings: SystemSettings }>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.settings ?? null;
  } catch (err: any) {
    console.warn('[DB Update Settings]:', err?.message || err);
    throw err;
  }
};

// ========================================================================
// SERVICES
// ========================================================================

export const fetchServicesLive = async (): Promise<Service[] | null> => {
  try {
    return await request<Service[]>('/api/services');
  } catch {
    return null;
  }
};

export const dbCreateService = async (serviceData: {
  name: string;
  category: ServiceCategory;
  price: number;
  durationMinutes: number;
  description?: string;
  badge?: string;
  isActive?: boolean;
}): Promise<Service> => {
  const res = await request<{ success: boolean; service: Service }>('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serviceData),
  });
  return res.service;
};

export const dbUpdateService = async (id: string, updates: Partial<Service>): Promise<Service> => {
  const res = await request<{ success: boolean; service: Service }>(`/api/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.service;
};

export const dbDeleteService = async (id: string): Promise<boolean> => {
  await request<{ success: boolean }>(`/api/services/${id}`, { method: 'DELETE' });
  return true;
};

// ========================================================================
// BARBERS
// ========================================================================

export const fetchBarbersLive = async (): Promise<Barber[] | null> => {
  try {
    return await request<Barber[]>('/api/barbers');
  } catch {
    return null;
  }
};

export const dbCreateBarber = async (barberData: {
  name: string;
  phone?: string;
  isActive?: boolean;
  workingDays?: number[];
}): Promise<Barber> => {
  const res = await request<{ success: boolean; barber: Barber }>('/api/barbers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(barberData),
  });
  return res.barber;
};

export const dbUpdateBarber = async (id: string, updates: Partial<Barber>): Promise<Barber> => {
  const res = await request<{ success: boolean; barber: Barber }>(`/api/barbers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.barber;
};

export const dbDeleteBarber = async (id: string): Promise<boolean> => {
  await request<{ success: boolean }>(`/api/barbers/${id}`, { method: 'DELETE' });
  return true;
};

// ========================================================================
// BOOKINGS
// ========================================================================

export const fetchBookingsLive = async (filters?: { date?: string; status?: string; search?: string; code?: string }): Promise<Booking[] | null> => {
  try {
    const sp = new URLSearchParams();
    if (filters?.code) sp.set('code', filters.code);
    if (filters?.date) sp.set('date', filters.date);
    if (filters?.status && filters.status !== 'all') sp.set('status', filters.status);
    if (filters?.search) sp.set('search', filters.search);
    const qs = sp.toString();
    return await request<Booking[]>(`/api/bookings${qs ? `?${qs}` : ''}`);
  } catch {
    return null;
  }
};

export const dbCreateBooking = async (bookingData: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  barberId: string;
  barberName: string;
  date: string;
  timeSlot: string;
  totalAmount: number;
  isWalkIn?: boolean;
  isAdminEntry?: boolean;
  status?: string;
}): Promise<Booking> => {
  // Check duplicate slot (same barber, date, time, not cancelled) via server API
  if (!bookingData.isWalkIn && bookingData.barberId && bookingData.barberId !== 'any') {
    try {
      const existing = await request<Booking[]>(`/api/bookings?date=${encodeURIComponent(bookingData.date)}&status=active`);
      const clash = existing.find(
        (b) =>
          b.barberId === bookingData.barberId &&
          b.timeSlot === bookingData.timeSlot &&
          b.status !== 'cancelled',
      );
      if (clash) {
        throw new Error('Slot waktu ini sudah dipesan untuk barber tersebut.');
      }
    } catch (err: any) {
      if (err?.message === 'Slot waktu ini sudah dipesan untuk barber tersebut.') throw err;
      // If fetch fails, proceed (server will do its own checks)
    }
  }

  const res = await request<{ success: boolean; booking: Booking }>('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  return res.booking;
};

export const dbUpdateBooking = async (id: string, updates: Partial<Booking>): Promise<Booking> => {
  const res = await request<{ success: boolean; booking: Booking }>(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.booking;
};

export const dbDeleteBooking = async (id: string): Promise<boolean> => {
  await request<{ success: boolean }>(`/api/bookings/${id}`, { method: 'DELETE' });
  return true;
};

export const trackBooking = async (query: string): Promise<Booking[]> => {
  try {
    return await request<Booking[]>(`/api/bookings/track/${encodeURIComponent(query)}`);
  } catch {
    return [];
  }
};

// ========================================================================
// TRANSACTIONS
// ========================================================================

export const fetchTransactionsLive = async (filters?: { date?: string; paymentMethod?: string; search?: string }): Promise<Transaction[] | null> => {
  try {
    const sp = new URLSearchParams();
    if (filters?.date) sp.set('date', filters.date);
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') sp.set('paymentMethod', filters.paymentMethod);
    if (filters?.search) sp.set('search', filters.search);
    const qs = sp.toString();
    return await request<Transaction[]>(`/api/transactions${qs ? `?${qs}` : ''}`);
  } catch {
    return null;
  }
};

export const dbCreateTransaction = async (txData: {
  invoiceNumber: string;
  bookingId?: string;
  customerName: string;
  customerPhone?: string;
  barberId: string;
  barberName: string;
  items: any[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  notes?: string;
}): Promise<Transaction> => {
  const res = await request<{ success: boolean; transaction: Transaction }>('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txData),
  });
  return res.transaction;
};

export const dbDeleteTransaction = async (id: string): Promise<boolean> => {
  await request<{ success: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' });
  return true;
};

// ========================================================================
// CUSTOMERS
// ========================================================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalBookings: number;
  lastBookingDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Normalisasi nomor HP: hanya angka, untuk perbandingan yang konsisten */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export async function lookupCustomerByPhone(phone: string): Promise<Customer | null> {
  if (!phone || phone.trim().length === 0) return null;
  const normalized = normalizePhone(phone);
  if (normalized.length < 8) return null;

  try {
    const res = await request<{ found: boolean; customer?: Customer }>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lookup', phone: normalized }),
    });
    return res.found && res.customer ? res.customer : null;
  } catch {
    return null;
  }
}

export async function upsertCustomer(
  name: string,
  phone: string,
  email?: string,
): Promise<{ customer: Customer; isNew: boolean } | null> {
  if (!phone || phone.trim().length === 0) return null;
  const normalized = normalizePhone(phone);
  if (normalized.length < 8) return null;

  try {
    const res = await request<{ customer: Customer; isNew: boolean }>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', name, phone: normalized, email: email || undefined }),
    });
    return res;
  } catch {
    return null;
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    return await request<Customer[]>('/api/customers');
  } catch {
    return [];
  }
}

export const dbUpdateCustomer = async (
  id: string,
  updates: { name?: string; email?: string; phone?: string; isActive?: boolean },
): Promise<Customer> => {
  const res = await request<{ success: boolean; customer: Customer }>(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.customer;
};

export const dbDeleteCustomer = async (id: string): Promise<boolean> => {
  await request<{ success: boolean }>(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return true;
};