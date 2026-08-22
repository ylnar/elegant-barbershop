import { Booking, Service, Barber } from '../types';
import { INITIAL_BOOKINGS, INITIAL_SERVICES, INITIAL_BARBERS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { fetchBookingsLive } from './supabaseClient';

export const bookingsService = {
  async getBookings(filters?: { date?: string; status?: string; search?: string; code?: string }): Promise<Booking[]> {
    // 1. Try direct live client Supabase SDK
    try {
      const liveBookings = await fetchBookingsLive();
      if (liveBookings && liveBookings.length > 0) {
        setLocal(STORAGE_KEYS.BOOKINGS, liveBookings);
        let list = liveBookings;
        if (filters?.code) {
          list = list.filter((b) => b.bookingCode.toLowerCase() === filters.code?.toLowerCase());
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
      // Fall through to server API
    }

    // 2. Fetch from backend server API
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.code) params.append('code', filters.code);

      const res = await fetch(`/api/bookings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocal(STORAGE_KEYS.BOOKINGS, data);
          return data;
        }
      }
    } catch {
      // Fall through to local cache
    }

    let list = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    if (filters?.code) {
      list = list.filter((b) => b.bookingCode.toLowerCase() === filters.code?.toLowerCase());
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
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        const data = await res.json();
        const created = data.booking;
        const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
        bookings.unshift(created);
        setLocal(STORAGE_KEYS.BOOKINGS, bookings);
        return created;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat reservasi.');
      }
    } catch (e: any) {
      throw e instanceof Error ? e : new Error('Gagal membuat reservasi ke database.');
    }
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.booking;
        const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
        const idx = bookings.findIndex((b) => b.id === id || b.bookingCode === id);
        if (idx !== -1) {
          bookings[idx] = { ...bookings[idx], ...updated };
        } else {
          bookings.unshift(updated);
        }
        setLocal(STORAGE_KEYS.BOOKINGS, bookings);
        return updated;
      }
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Perubahan booking gagal disimpan ke database.');
    } catch {
      throw new Error('Perubahan booking gagal disimpan ke database. Periksa koneksi server dan Supabase.');
    }
  },

  async deleteBooking(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.status === 404) {
        // Sudah tidak ada di server — anggap sukses agar cache lokal tetap bersih
      } else if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Gagal menghapus data reservasi.');
      }
    } catch (e: any) {
      throw e instanceof Error ? e : new Error('Gagal menghapus data reservasi.');
    }

    // Sinkronkan cache lokal
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    setLocal(STORAGE_KEYS.BOOKINGS, bookings.filter((b) => b.id !== id && b.bookingCode !== id));
    return true;
  },

  async trackBooking(query: string): Promise<Booking[]> {
    try {
      const res = await fetch(`/api/bookings/track/${encodeURIComponent(query)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
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

