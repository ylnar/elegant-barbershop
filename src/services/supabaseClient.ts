import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Barber, Service, Booking, BookingStatus, Transaction, SystemSettings, ServiceCategory } from '../types';

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

// ========================================================================
// MAPPERS — normalize DB rows ↔ app types
// ========================================================================

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

function mapSettings(s: any): SystemSettings {
  return {
    isBookingOpen: s.is_booking_open ?? true,
    walkInOnlyMessage: s.walk_in_only_message || '',
    maintenanceMessage: s.maintenance_message || '',
    currentWalkInQueue: s.active_lounge_queue ?? 0,
    estimatedWalkInWaitMinutes: s.estimated_wait_minutes ?? 0,
    shopName: s.shop_name || 'ELEGANT BARBERSHOP SOLOK',
    tagline: s.tagline || 'MASUAK CAYAH KALUA COGAH',
    address: s.address || '',
    googleMapsUrl: s.google_maps_url || '',
    phone: s.phone || '',
    whatsappNumber: s.whatsapp_number || '',
    email: s.email || '',
    instagramHandle: s.instagram_handle || '',
    openTime: s.open_time || '10:00',
    closeTime: s.close_time || '22:00',
    slotIntervalMinutes: s.slot_interval_minutes ?? 30,
    maxSimultaneousBookingsPerSlot: s.max_simultaneous_bookings_per_slot ?? 2,
    currency: s.currency || 'IDR',
  };
}

// ========================================================================
// READ — Live fetchers (direct Supabase client)
// ========================================================================

export const fetchBarbersLive = async (): Promise<Barber[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('barbers')
      .select('*')
      .eq('is_deleted', false);

    if (error || !data) return null;
    return data.map(mapBarber);
  } catch {
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

    if (error || !data) return null;
    return data.map(mapService);
  } catch {
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
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    return data.map(mapBooking);
  } catch {
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
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    return data.map(mapTransaction);
  } catch {
    return null;
  }
};

export const fetchSettingsLive = async (): Promise<SystemSettings | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('system_settings')
      .select('*')
      .eq('id', 'default_settings')
      .single();

    if (error || !data) return null;
    return mapSettings(data);
  } catch {
    return null;
  }
};

// ========================================================================
// BOOKINGS — Full CRUD (direct Supabase)
// ========================================================================

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
  status?: string;
}): Promise<Booking> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  // Check for duplicate booking (same barber, date, time, not cancelled)
  const { data: existing } = await client
    .from('bookings')
    .select('id')
    .eq('barber_id', bookingData.barberId)
    .eq('date', bookingData.date)
    .eq('time_slot', bookingData.timeSlot)
    .neq('status', 'cancelled')
    .eq('is_deleted', false)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('Slot waktu ini sudah dipesan untuk barber tersebut.');
  }

  // Generate booking code
  const codeNum = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `ELG-${codeNum}`;

  const { data, error } = await client
    .from('bookings')
    .insert({
      booking_code: bookingCode,
      customer_name: bookingData.customerName,
      customer_phone: bookingData.customerPhone,
      customer_email: bookingData.customerEmail || null,
      service_id: bookingData.serviceId.length > 20 ? bookingData.serviceId : null,
      service_name: bookingData.serviceName,
      service_price: bookingData.servicePrice,
      barber_id: bookingData.barberId.length > 20 ? bookingData.barberId : null,
      barber_name: bookingData.barberName,
      date: bookingData.date,
      time_slot: bookingData.timeSlot,
      total_amount: bookingData.totalAmount,
      status: bookingData.status || (bookingData.isWalkIn ? 'confirmed' : 'pending'),
      is_walk_in: bookingData.isWalkIn || false,
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal membuat reservasi: ${error.message}`);
  return mapBooking(data);
};

export const dbUpdateBooking = async (
  id: string,
  updates: Partial<Booking>
): Promise<Booking> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const dbUpdates: Record<string, any> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
  if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
  if (updates.customerEmail !== undefined) dbUpdates.customer_email = updates.customerEmail;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.timeSlot !== undefined) dbUpdates.time_slot = updates.timeSlot;
  if ((updates as any).notes !== undefined) dbUpdates.notes = (updates as any).notes;

  const { data, error } = await client
    .from('bookings')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Gagal update booking: ${error.message}`);
  return mapBooking(data);
};

export const dbDeleteBooking = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const { error } = await client
    .from('bookings')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Gagal hapus booking: ${error.message}`);
  return true;
};

// ========================================================================
// TRANSACTIONS — Full CRUD (direct Supabase)
// ========================================================================

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
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const { data, error } = await client
    .from('transactions')
    .insert({
      invoice_number: txData.invoiceNumber,
      booking_id: txData.bookingId && txData.bookingId.length > 20 ? txData.bookingId : null,
      customer_name: txData.customerName,
      customer_phone: txData.customerPhone || null,
      barber_id: txData.barberId && txData.barberId.length > 20 ? txData.barberId : null,
      barber_name: txData.barberName,
      items: txData.items || [],
      subtotal: txData.subtotal,
      discount: txData.discount,
      total_amount: txData.totalAmount,
      payment_method: txData.paymentMethod,
      payment_status: 'paid',
      amount_paid: txData.amountPaid,
      change_amount: txData.changeAmount,
      notes: txData.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal simpan transaksi: ${error.message}`);
  return mapTransaction(data);
};

export const dbDeleteTransaction = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const { error } = await client
    .from('transactions')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Gagal hapus transaksi: ${error.message}`);
  return true;
};

// ========================================================================
// SERVICES — Full CRUD (direct Supabase)
// ========================================================================

export const dbCreateService = async (serviceData: {
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  description?: string;
  badge?: string;
  isActive?: boolean;
}): Promise<Service> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const { data, error } = await client
    .from('services')
    .insert({
      name: serviceData.name,
      category_slug: serviceData.category,
      price: serviceData.price,
      duration_minutes: serviceData.durationMinutes,
      description: serviceData.description || '',
      badge: serviceData.badge || null,
      is_active: serviceData.isActive ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal simpan layanan: ${error.message}`);
  return mapService(data);
};

export const dbUpdateService = async (
  id: string,
  updates: Partial<Service>
): Promise<Service> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.category !== undefined) dbUpdates.category_slug = updates.category;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.badge !== undefined) dbUpdates.badge = updates.badge;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { data, error } = await client
    .from('services')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Gagal update layanan: ${error.message}`);
  return mapService(data);
};

export const dbDeleteService = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const { error } = await client
    .from('services')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Gagal hapus layanan: ${error.message}`);
  return true;
};

// ========================================================================
// BARBERS — Full CRUD (direct Supabase)
// ========================================================================

export const dbCreateBarber = async (barberData: {
  name: string;
  phone?: string;
  isActive?: boolean;
  workingDays?: number[];
}): Promise<Barber> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const { data, error } = await client
    .from('barbers')
    .insert({
      name: barberData.name,
      phone: barberData.phone || null,
      is_active: barberData.isActive ?? true,
      working_days: barberData.workingDays || [0, 1, 2, 3, 4, 5, 6],
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal simpan barber: ${error.message}`);
  return mapBarber(data);
};

export const dbUpdateBarber = async (
  id: string,
  updates: Partial<Barber>
): Promise<Barber> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.workingDays !== undefined) dbUpdates.working_days = updates.workingDays;

  const { data, error } = await client
    .from('barbers')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Gagal update barber: ${error.message}`);
  return mapBarber(data);
};

export const dbDeleteBarber = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum terkonfigurasi.');

  const { error } = await client
    .from('barbers')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Gagal hapus barber: ${error.message}`);
  return true;
};

// ========================================================================
// SETTINGS — Read / Update (direct Supabase)
// ========================================================================

export const dbGetSettings = async (): Promise<SystemSettings | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('system_settings')
      .select('*')
      .eq('id', 'default_settings')
      .single();

    if (error || !data) return null;
    return mapSettings(data);
  } catch {
    return null;
  }
};

export const dbUpdateSettings = async (updates: Partial<SystemSettings>): Promise<SystemSettings | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const dbUpdates: Record<string, any> = {};
  if (updates.isBookingOpen !== undefined) dbUpdates.is_booking_open = updates.isBookingOpen;
  if (updates.walkInOnlyMessage !== undefined) dbUpdates.walk_in_only_message = updates.walkInOnlyMessage;
  if (updates.maintenanceMessage !== undefined) dbUpdates.maintenance_message = updates.maintenanceMessage;
  if (updates.currentWalkInQueue !== undefined) dbUpdates.active_lounge_queue = updates.currentWalkInQueue;
  if (updates.estimatedWalkInWaitMinutes !== undefined) dbUpdates.estimated_wait_minutes = updates.estimatedWalkInWaitMinutes;
  if (updates.shopName !== undefined) dbUpdates.shop_name = updates.shopName;
  if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.googleMapsUrl !== undefined) dbUpdates.google_maps_url = updates.googleMapsUrl;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.whatsappNumber !== undefined) dbUpdates.whatsapp_number = updates.whatsappNumber;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.instagramHandle !== undefined) dbUpdates.instagram_handle = updates.instagramHandle;
  if (updates.openTime !== undefined) dbUpdates.open_time = updates.openTime;
  if (updates.closeTime !== undefined) dbUpdates.close_time = updates.closeTime;
  if (updates.slotIntervalMinutes !== undefined) dbUpdates.slot_interval_minutes = updates.slotIntervalMinutes;
  if (updates.maxSimultaneousBookingsPerSlot !== undefined) dbUpdates.max_simultaneous_bookings_per_slot = updates.maxSimultaneousBookingsPerSlot;
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency;

  if (Object.keys(dbUpdates).length === 0) {
    // Nothing to update, just read current
    return dbGetSettings();
  }

  const { data, error } = await client
    .from('system_settings')
    .update(dbUpdates)
    .eq('id', 'default_settings')
    .select()
    .single();

  if (error) throw new Error(`Gagal update settings: ${error.message}`);
  return mapSettings(data);
};

// ========================================================================
// REALTIME SUBSCRIPTIONS
// ========================================================================

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
