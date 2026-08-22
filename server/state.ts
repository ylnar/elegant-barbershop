import {
  INITIAL_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_BARBERS,
  INITIAL_BOOKINGS,
  INITIAL_TRANSACTIONS,
} from '../src/data/initialData.ts';
import {
  Booking,
  Service,
  Barber,
  SystemSettings,
  Transaction,
} from '../src/types.ts';
import { SupabaseRepo } from './supabaseRepo.ts';

class ServerStore {
  private settings: SystemSettings = { ...INITIAL_SETTINGS };
  private services: Service[] = [...INITIAL_SERVICES];
  private barbers: Barber[] = [...INITIAL_BARBERS];
  private bookings: Booking[] = [...INITIAL_BOOKINGS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private isInitialized = false;

  constructor() {
    this.initSupabaseSync();
  }

  private async initSupabaseSync() {
    try {
      const [remoteSettings, remoteServices, remoteBarbers, remoteBookings, remoteTransactions] =
        await Promise.all([
          SupabaseRepo.fetchSettings(),
          SupabaseRepo.fetchServices(),
          SupabaseRepo.fetchBarbers(),
          SupabaseRepo.fetchBookings(),
          SupabaseRepo.fetchTransactions(),
        ]);

      if (remoteSettings) this.settings = remoteSettings;
      if (remoteServices && remoteServices.length > 0) this.services = remoteServices;
      if (remoteBarbers && remoteBarbers.length > 0) this.barbers = remoteBarbers;
      if (remoteBookings && remoteBookings.length > 0) this.bookings = remoteBookings;
      if (remoteTransactions && remoteTransactions.length > 0) this.transactions = remoteTransactions;

      this.isInitialized = true;
      console.log('⚡ ServerStore synced with Supabase PostgreSQL');
    } catch (err) {
      console.log('ℹ️ Supabase not active or using local fallback state');
    }
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<SystemSettings>, persist = true): SystemSettings {
    this.settings = { ...this.settings, ...updates };
    if (persist) {
      void SupabaseRepo.saveSettings(this.settings);
    }
    return { ...this.settings };
  }

  toggleBookingSwitch(isOpen?: boolean): { isBookingOpen: boolean; message: string } {
    if (typeof isOpen === 'boolean') {
      this.settings.isBookingOpen = isOpen;
    } else {
      this.settings.isBookingOpen = !this.settings.isBookingOpen;
    }
    void SupabaseRepo.saveSettings(this.settings);
    return {
      isBookingOpen: this.settings.isBookingOpen,
      message: this.settings.isBookingOpen
        ? 'Sistem Booking Online DIBUKA. Pelanggan dapat reservasi.'
        : 'Sistem Booking Online DITUTUP. Form di halaman depan kini menampilkan mode Walk-In Only.',
    };
  }

  // --- Services ---
  getServices(): Service[] {
    return [...this.services];
  }

  setServices(services: Service[]): void {
    this.services = [...services];
  }

  getServiceById(id: string): Service | undefined {
    return this.services.find((s) => s.id === id);
  }

  addService(service: Service, persist = true): Service {
    this.services.push(service);
    if (persist) {
      void SupabaseRepo.insertService(service);
    }
    return service;
  }

  updateService(id: string, updates: Partial<Service>, persist = true): Service | null {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.services[idx] = { ...this.services[idx], ...updates };
    if (persist) {
      void SupabaseRepo.updateService(id, updates);
    }
    return this.services[idx];
  }

  deleteService(id: string, persist = true): boolean {
    const prevLen = this.services.length;
    this.services = this.services.filter((s) => s.id !== id);
    if (persist) {
      void SupabaseRepo.deleteService(id);
    }
    return this.services.length < prevLen;
  }

  // --- Barbers ---
  getBarbers(): Barber[] {
    return [...this.barbers];
  }

  setBarbers(barbers: Barber[]): void {
    this.barbers = [...barbers];
  }

  getBarberById(id: string): Barber | undefined {
    return this.barbers.find((b) => b.id === id);
  }

  addBarber(barber: Barber, persist = true): Barber {
    this.barbers.push(barber);
    if (persist) {
      void SupabaseRepo.insertBarber(barber);
    }
    return barber;
  }

  updateBarber(id: string, updates: Partial<Barber>, persist = true): Barber | null {
    const idx = this.barbers.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.barbers[idx] = { ...this.barbers[idx], ...updates };
    if (persist) {
      void SupabaseRepo.updateBarber(id, updates);
    }
    return this.barbers[idx];
  }

  deleteBarber(id: string, persist = true): boolean {
    const prevLen = this.barbers.length;
    this.barbers = this.barbers.filter((b) => b.id !== id);
    if (persist) {
      void SupabaseRepo.deleteBarber(id);
    }
    return this.barbers.length < prevLen;
  }

  // --- Bookings ---
  getBookings(): Booking[] {
    return [...this.bookings];
  }

  setBookings(bookings: Booking[]): void {
    this.bookings = [...bookings];
  }

  addBooking(booking: Booking, persist = true): Booking {
    this.bookings.unshift(booking);
    if (persist) {
      void SupabaseRepo.insertBooking(booking);
    }
    return booking;
  }

  updateBooking(id: string, updates: Partial<Booking>, persist = true): Booking | null {
    const idx = this.bookings.findIndex((b) => b.id === id || b.bookingCode === id);
    if (idx === -1) return null;
    this.bookings[idx] = {
      ...this.bookings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (persist) {
      void SupabaseRepo.updateBooking(id, updates);
    }
    return this.bookings[idx];
  }

  deleteBooking(id: string, persist = true): boolean {
    const prevLen = this.bookings.length;
    this.bookings = this.bookings.filter((b) => b.id !== id && b.bookingCode !== id);
    if (persist) {
      void SupabaseRepo.deleteBooking(id);
    }
    return this.bookings.length < prevLen;
  }

  // --- Transactions ---
  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  setTransactions(transactions: Transaction[]): void {
    this.transactions = [...transactions];
  }

  addTransaction(trx: Transaction, persist = true): Transaction {
    this.transactions.unshift(trx);
    if (persist) {
      void SupabaseRepo.insertTransaction(trx);
    }
    // Mark associated booking as completed if applicable
    if (trx.bookingId) {
      this.updateBooking(trx.bookingId, { status: 'completed' }, false);
    }
    return trx;
  }

  deleteTransaction(id: string, persist = true): boolean {
    const prevLen = this.transactions.length;
    this.transactions = this.transactions.filter((t) => t.id !== id);
    if (persist) {
      void SupabaseRepo.deleteTransaction(id);
    }
    return this.transactions.length < prevLen;
  }
}

export const serverStore = new ServerStore();
