import { Booking } from '../types';
import { INITIAL_BOOKINGS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import {
  fetchBookingsLive,
  dbCreateBooking,
  dbUpdateBooking,
  dbDeleteBooking,
  getSupabaseClient,
} from './supabaseClient';

export const bookingsService = {
  async getBookings(filters?: { date?: string; status?: string; search?: string; code?: string }): Promise<Booking[]> {
    // 1. Direct Supabase client
    try {
      const liveBookings = await fetchBookingsLive();
      if (liveBookings !== null) {
        setLocal(STORAGE_KEYS.BOOKINGS, liveBookings);
        let list = liveBookings;
        if (filters?.code) {
          list = list.filter((b) => b.bookingCode.toLowerCase() === filters.code?.toLowerCase());
        }
        if (filters?.date) {
          list = list.filter((b) => b.date === filters.date);
        }
        if (filters?.status && filters.status !== 'all') {
          list = list.filter((b) => b.status === filters.status);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (b) =>
              b.customerName.toLowerCase().includes(q) ||
              b.customerPhone.includes(q) ||
              b.bookingCode.toLowerCase().includes(q)
          );
        }
        return list;
      }
    } catch {
      // Fall through to local cache
    }

    let list = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    if (filters?.code) {
      list = list.filter((b) => b.bookingCode.toLowerCase() === filters.code?.toLowerCase());
    }
    if (filters?.date) {
      list = list.filter((b) => b.date === filters.date);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((b) => b.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          b.bookingCode.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async createBooking(bookingData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceId: string;
    barberId?: string;
    date: string;
    timeSlot: string;
    isWalkIn?: boolean;
    isAdminEntry?: boolean;
  }): Promise<Booking> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase belum terkonfigurasi.');

    // Fetch service & barber info for full data
    const { data: serviceData } = await client
      .from('services')
      .select('*')
      .eq('id', bookingData.serviceId)
      .single();

    const serviceName = serviceData?.name || 'Layanan Pangkas';
    const servicePrice = Number(serviceData?.price ?? 0);

    let barberName = 'Barber Siap Pertama';
    if (bookingData.barberId && bookingData.barberId !== 'any' && bookingData.barberId.length > 10) {
      const { data: barberData } = await client
        .from('barbers')
        .select('*')
        .eq('id', bookingData.barberId)
        .single();
      if (barberData) barberName = barberData.name;
    }

    const created = await dbCreateBooking({
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      customerEmail: bookingData.customerEmail,
      serviceId: bookingData.serviceId,
      serviceName,
      servicePrice,
      barberId: bookingData.barberId || 'any',
      barberName,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      totalAmount: servicePrice,
      isWalkIn: bookingData.isWalkIn,
    });

    // Update local cache
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    bookings.unshift(created);
    setLocal(STORAGE_KEYS.BOOKINGS, bookings);

    return created;
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    // Try Supabase first — only if ID is a valid UUID
    if (id.length > 20) {
      try {
        const updated = await dbUpdateBooking(id, updates);
        const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
        const idx = bookings.findIndex((b) => b.id === id);
        if (idx !== -1) {
          bookings[idx] = { ...bookings[idx], ...updated };
        }
        setLocal(STORAGE_KEYS.BOOKINGS, bookings);
        return updated;
      } catch (e: any) {
        console.warn('[Supabase Update Booking Error]:', e.message);
      }
    }

    if (getSupabaseClient()) {
      throw new Error('Booking gagal diperbarui di Supabase.');
    }

    // Local-only fallback when Supabase is not configured
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      bookings[idx] = { ...bookings[idx], ...updates, updatedAt: new Date().toISOString() };
      setLocal(STORAGE_KEYS.BOOKINGS, bookings);
      return bookings[idx];
    }
    throw new Error('Booking tidak ditemukan.');
  },

  async deleteBooking(id: string): Promise<boolean> {
    // Try Supabase first — only if ID is a valid UUID (length > 20)
    if (id.length > 20) {
      try {
        await dbDeleteBooking(id);
      } catch (e: any) {
        console.error('[Supabase Delete Booking]:', e.message);
        throw e;
      }
    }

    if (getSupabaseClient()) {
      throw new Error('Booking tidak memiliki ID Supabase yang valid.');
    }

    // Always sync local cache
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    setLocal(STORAGE_KEYS.BOOKINGS, bookings.filter((b) => b.id !== id && b.bookingCode !== id));
    return true;
  },

  async trackBooking(query: string): Promise<Booking[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const q = query.trim().toLowerCase();
        // Try by booking code
        const { data: byCode } = await client
          .from('bookings')
          .select('*')
          .ilike('booking_code', q)
          .eq('is_deleted', false)
          .limit(10);
        if (byCode && byCode.length > 0) return byCode.map((b: any) => ({
          id: String(b.id),
          bookingCode: b.booking_code,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          customerEmail: b.customer_email || undefined,
          serviceId: String(b.service_id || ''),
          serviceName: b.service_name,
          servicePrice: Number(b.service_price ?? 0),
          barberId: String(b.barber_id || 'any'),
          barberName: b.barber_name,
          date: typeof b.date === 'string' ? b.date.split('T')[0] : b.date,
          timeSlot: b.time_slot,
          totalAmount: Number(b.total_amount ?? 0),
          status: b.status,
          isWalkIn: Boolean(b.is_walk_in),
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));

        // Try by phone
        const { data: byPhone } = await client
          .from('bookings')
          .select('*')
          .eq('customer_phone', q.replace(/[^0-9]/g, ''))
          .eq('is_deleted', false)
          .limit(10);
        if (byPhone && byPhone.length > 0) return byPhone.map((b: any) => ({
          id: String(b.id),
          bookingCode: b.booking_code,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          customerEmail: b.customer_email || undefined,
          serviceId: String(b.service_id || ''),
          serviceName: b.service_name,
          servicePrice: Number(b.service_price ?? 0),
          barberId: String(b.barber_id || 'any'),
          barberName: b.barber_name,
          date: typeof b.date === 'string' ? b.date.split('T')[0] : b.date,
          timeSlot: b.time_slot,
          totalAmount: Number(b.total_amount ?? 0),
          status: b.status,
          isWalkIn: Boolean(b.is_walk_in),
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));
      } catch {
        // Fall through to local
      }
    }

    const q = query.trim().toLowerCase();
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    return bookings.filter(
      (b) =>
        b.bookingCode.toLowerCase() === q ||
        b.customerPhone.replace(/[^0-9]/g, '') === q.replace(/[^0-9]/g, '')
    );
  },
};
