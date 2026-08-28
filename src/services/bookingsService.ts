import { Booking } from '../types';
import { INITIAL_BOOKINGS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import {
  fetchBookingsLive,
  fetchServicesLive,
  fetchBarbersLive,
  dbCreateBooking,
  dbUpdateBooking,
  dbDeleteBooking,
  trackBooking as trackBookingFromDb,
} from './dbClient';
import { upsertCustomer } from './customersService';

export const bookingsService = {
  async getBookings(filters?: { date?: string; status?: string; search?: string; code?: string }): Promise<Booking[]> {
    // 1. Ambil dari server (MongoDB via API routes)
    try {
      const liveBookings = await fetchBookingsLive(filters);
      if (liveBookings !== null) {
        setLocal(STORAGE_KEYS.BOOKINGS, liveBookings);
        return liveBookings;
      }
    } catch {
      // Aksi lanjut ke cache lokal
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
          b.bookingCode.toLowerCase().includes(q),
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
    // Ambil info layanan & barber dari server API
    let serviceName = 'Layanan Pangkas';
    let servicePrice = 0;
    let barberName = 'Barber Siap Pertama';

    try {
      const services = await fetchServicesLive();
      const service = services?.find((s) => s.id === bookingData.serviceId);
      if (service) {
        serviceName = service.name;
        servicePrice = service.price;
      }
    } catch {
      // pakai default
    }

    if (bookingData.barberId && bookingData.barberId !== 'any') {
      try {
        const barbers = await fetchBarbersLive();
        const barber = barbers?.find((b) => b.id === bookingData.barberId);
        if (barber) barberName = barber.name;
      } catch {
        // pakai default
      }
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
      isAdminEntry: bookingData.isAdminEntry,
    });

    // Upsert customer to prevent duplicates
    try {
      await upsertCustomer(
        bookingData.customerName,
        bookingData.customerPhone,
        bookingData.customerEmail,
      );
    } catch {
      // Non-blocking: customer upsert failure shouldn't block booking
    }

    // Update local cache
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    bookings.unshift(created);
    setLocal(STORAGE_KEYS.BOOKINGS, bookings);

    return created;
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    try {
      const updated = await dbUpdateBooking(id, updates);
      const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
      const idx = bookings.findIndex((b) => b.id === id || b.bookingCode === id);
      if (idx !== -1) {
        bookings[idx] = { ...bookings[idx], ...updated };
      }
      setLocal(STORAGE_KEYS.BOOKINGS, bookings);
      return updated;
    } catch (e: any) {
      console.warn('[DB Update Booking Error]:', e?.message || e);
      throw e;
    }
  },

  async deleteBooking(id: string): Promise<boolean> {
    try {
      await dbDeleteBooking(id);
    } catch (e: any) {
      console.error('[DB Delete Booking]:', e?.message || e);
      throw e;
    }
    // Update local cache
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    setLocal(STORAGE_KEYS.BOOKINGS, bookings.filter((b) => b.id !== id && b.bookingCode !== id));
    return true;
  },

  async trackBooking(query: string): Promise<Booking[]> {
    try {
      const found = await trackBookingFromDb(query);
      if (found.length > 0) return found;
    } catch {
      // Aksi lanjut ke cache lokal
    }

    const q = query.trim().toLowerCase();
    const bookings = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    return bookings.filter(
      (b) =>
        b.bookingCode.toLowerCase() === q ||
        b.customerPhone.replace(/[^0-9]/g, '') === q.replace(/[^0-9]/g, ''),
    );
  },
};