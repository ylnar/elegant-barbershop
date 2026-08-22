import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Barber, Service, Booking, Transaction } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;
let directConnectionValid: boolean | null = null; // null = not tested yet

/**
 * Check if the anon key is a valid JWT (starts with eyJ).
 * Many Supabase setups use JWT tokens. If the key doesn't look like a JWT,
 * we skip direct client connections and use server API instead.
 */
const isAnonKeyValid = (): boolean => {
  if (!supabaseAnonKey) return false;
  // Valid Supabase anon keys are JWT tokens starting with 'eyJ'
  // Keys like 'sb_publishable_...' are NOT valid for PostgREST API
  return supabaseAnonKey.startsWith('eyJ');
};

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

/**
 * Get Supabase client - only create if anon key is a valid JWT.
 * Returns null if key format is invalid (e.g. sb_publishable_*).
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  // If anon key is not a valid JWT, don't even try
  if (!isAnonKeyValid()) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch {
      return null;
    }
  }

  return supabaseInstance;
};

export const checkSupabaseConnection = async (): Promise<{ connected: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    // Try via server API instead
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return {
            connected: true,
            message: 'Terhubung ke database via Server API (mode aman)!',
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      connected: false,
      message: 'Database belum terkonfigurasi. Pastikan server berjalan.',
    };
  }

  try {
    const { error } = await client.from('barbers').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: `Koneksi langsung error: ${error.message}. Menggunakan mode Server API.`,
      };
    }
    return {
      connected: true,
      message: 'Berhasil terhubung langsung ke Supabase!',
    };
  } catch {
    return {
      connected: false,
      message: 'Gagal menghubungi Supabase. Menggunakan mode Server API.',
    };
  }
};

/**
 * Helper: fetch from server API with timeout
 */
const apiFetch = async <T>(path: string, timeout = 10000): Promise<T | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(path, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data as T : null;
  } catch {
    return null;
  }
};

/**
 * Live fetchers - try direct Supabase first, fallback to server API.
 * If anon key is invalid, skip directly to server API.
 */
export const fetchBarbersLive = async (): Promise<Barber[] | null> => {
  // Try direct Supabase (only if valid JWT key)
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('barbers').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapBarber);
      }
    } catch {
      // Fall through
    }
  }

  // Fallback: server API (already returns camelCase app types)
  return apiFetch<any[]>('/api/barbers');
};

export const fetchServicesLive = async (): Promise<Service[] | null> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('services').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapService);
      }
    } catch {
      // Fall through
    }
  }

  // Fallback: server API (already returns camelCase app types)
  return apiFetch<any[]>('/api/services');
};

export const fetchBookingsLive = async (): Promise<Booking[] | null> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('bookings').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapBooking);
      }
    } catch {
      // Fall through
    }
  }

  // Fallback: server API (already returns camelCase app types)
  return apiFetch<any[]>('/api/bookings');
};

export const fetchTransactionsLive = async (): Promise<Transaction[] | null> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('transactions').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapTransaction);
      }
    } catch {
      // Fall through
    }
  }

  // Fallback: server API (already returns camelCase app types)
  return apiFetch<any[]>('/api/transactions');
};

/**
 * Mappers - normalize DB rows to app types
 */
function mapBarber(b: any): Barber {
  return {
    id: String(b.id),
    name: b.name || 'Barber',
    phone: b.phone || undefined,
    isActive: b.is_active !== undefined ? Boolean(b.is_active) : true,
    workingDays: Array.isArray(b.working_days) ? b.working_days : [0, 1, 2, 3, 4, 5, 6],
  };
}

function mapService(s: any): Service {
  return {
    id: String(s.id),
    name: s.name || s.nama || s.service_name || 'Layanan Pangkas',
    category: s.category_slug || s.category || s.kategori || 'haircut',
    price: Number(s.price ?? s.harga ?? 0),
    durationMinutes: Number(s.duration_minutes ?? s.durationMinutes ?? s.durasi ?? 35),
    description: s.description || s.deskripsi || '',
    badge: s.badge || undefined,
    imageUrl: s.image_url || s.imageUrl || s.foto || undefined,
    isActive: s.is_active !== undefined ? Boolean(s.is_active) : (s.isActive !== undefined ? Boolean(s.isActive) : true),
  };
}

function mapBooking(b: any): Booking {
  return {
    id: String(b.id),
    bookingCode: b.booking_code || b.bookingCode || `ELG-${String(b.id).slice(-4)}`,
    customerName: b.customer_name || b.customerName || 'Pelanggan',
    customerPhone: b.customer_phone || b.customerPhone || '',
    customerEmail: b.customer_email || b.customerEmail || undefined,
    serviceId: String(b.service_id || b.serviceId || 'srv-1'),
    serviceName: b.service_name || b.serviceName || 'Layanan Pangkas',
    servicePrice: Number(b.service_price ?? b.servicePrice ?? 0),
    barberId: String(b.barber_id || b.barberId || 'any'),
    barberName: b.barber_name || b.barberName || 'Barber Siap Pertama',
    date: typeof b.date === 'string' ? b.date.split('T')[0] : b.date,
    timeSlot: b.time_slot || b.timeSlot || '10:00',
    totalAmount: Number(b.total_amount ?? b.totalAmount ?? 0),
    status: b.status || 'pending',
    isWalkIn: Boolean(b.is_walk_in ?? b.isWalkIn ?? false),
    createdAt: b.created_at || b.createdAt || new Date().toISOString(),
    updatedAt: b.updated_at || b.updatedAt || b.created_at || new Date().toISOString(),
  };
}

function mapTransaction(t: any): Transaction {
  return {
    id: String(t.id),
    invoiceNumber: t.invoice_number || t.invoiceNumber || `TRX-${String(t.id).slice(-4)}`,
    bookingId: t.booking_id ? String(t.booking_id) : undefined,
    customerName: t.customer_name || t.customerName || 'Pelanggan',
    customerPhone: t.customer_phone || t.customerPhone || undefined,
    barberId: String(t.barber_id || t.barberId || 'barber-1'),
    barberName: t.barber_name || t.barberName || 'Staff Barber',
    items: Array.isArray(t.items) ? t.items : [],
    subtotal: Number(t.subtotal ?? t.total_amount ?? 0),
    discount: Number(t.discount ?? 0),
    totalAmount: Number(t.total_amount ?? 0),
    paymentMethod: t.payment_method || t.paymentMethod || 'cash',
    amountPaid: Number(t.amount_paid ?? t.total_amount ?? 0),
    changeAmount: Number(t.change_amount ?? 0),
    notes: t.notes || undefined,
    createdAt: t.created_at || t.createdAt || new Date().toISOString(),
  };
}

/**
 * Subscribe to realtime PostgreSQL changes (only works with valid JWT key)
 */
export const subscribeToTable = (
  tableName: 'bookings' | 'transactions' | 'services' | 'barbers' | 'categories' | 'system_settings',
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; new: any; old: any }) => void
) => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel(`realtime_${tableName}_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          callback({
            eventType: payload.eventType as any,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();

    return channel;
  } catch {
    return null;
  }
};
