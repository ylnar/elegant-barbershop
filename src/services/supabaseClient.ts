import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Barber, Service, Booking, Transaction } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Check if the Supabase client is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

/**
 * Get or create Supabase client singleton
 */
export const getSupabaseClient = (): SupabaseClient | null => {
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
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.error('[Supabase Client] Failed to create client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

/**
 * Check Supabase connection status
 */
export const checkSupabaseConnection = async (): Promise<{ connected: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
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
        message: `Koneksi error: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Berhasil terhubung ke Supabase!',
    };
  } catch {
    return {
      connected: false,
      message: 'Gagal menghubungi Supabase.',
    };
  }
};

/**
 * Live fetchers - fetch data directly from Supabase
 * Filters out soft-deleted records (is_deleted = true)
 */
export const fetchBarbersLive = async (): Promise<Barber[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('barbers')
      .select('*')
      .eq('is_deleted', false);

    if (error) {
      console.error('[Supabase] fetchBarbersLive error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map(mapBarber);
  } catch (err) {
    console.error('[Supabase] fetchBarbersLive exception:', err);
    return null;
  }
};

export const fetchServicesLive = async (): Promise<Service[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('is_deleted', false);

    if (error) {
      console.error('[Supabase] fetchServicesLive error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map(mapService);
  } catch (err) {
    console.error('[Supabase] fetchServicesLive exception:', err);
    return null;
  }
};

export const fetchBookingsLive = async (): Promise<Booking[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .eq('is_deleted', false);

    if (error) {
      console.error('[Supabase] fetchBookingsLive error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map(mapBooking);
  } catch (err) {
    console.error('[Supabase] fetchBookingsLive exception:', err);
    return null;
  }
};

export const fetchTransactionsLive = async (): Promise<Transaction[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('is_deleted', false);

    if (error) {
      console.error('[Supabase] fetchTransactionsLive error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map(mapTransaction);
  } catch (err) {
    console.error('[Supabase] fetchTransactionsLive exception:', err);
    return null;
  }
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
 * Subscribe to realtime PostgreSQL changes
 * 
 * IMPORTANT: This requires:
 * 1. REPLICA IDENTITY FULL on the table
 * 2. Table added to supabase_realtime publication
 * 3. Proper RLS policies (or RLS disabled for the table)
 */
export const subscribeToTable = (
  tableName: 'bookings' | 'transactions' | 'services' | 'barbers' | 'categories' | 'system_settings',
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; new: any; old: any }) => void
) => {
  const client = getSupabaseClient();
  if (!client) {
    console.warn(`[Realtime] Supabase not configured, cannot subscribe to ${tableName}`);
    return null;
  }

  try {
    const channelName = `realtime_${tableName}_${Date.now()}`;
    
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: tableName 
        },
        (payload) => {
          console.log(`[Realtime] ${tableName}: ${payload.eventType}`, payload);
          
          // Skip soft-deleted records in DELETE events
          if (payload.eventType === 'DELETE') {
            callback({
              eventType: 'DELETE',
              new: null,
              old: payload.old,
            });
            return;
          }
          
          // For INSERT/UPDATE, check if record is soft-deleted
          const record = payload.new as any;
          if (record && record.is_deleted === true) {
            // Treat soft-delete as DELETE event
            callback({
              eventType: 'DELETE',
              new: null,
              old: record,
            });
            return;
          }
          
          callback({
            eventType: payload.eventType as any,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Subscribed to ${tableName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] ❌ Channel error for ${tableName}`);
        }
      });

    return channel;
  } catch (err) {
    console.error(`[Realtime] Failed to subscribe to ${tableName}:`, err);
    return null;
  }
};
