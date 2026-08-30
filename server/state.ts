import {
  INITIAL_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_BARBERS,
  INITIAL_BOOKINGS,
  INITIAL_TRANSACTIONS,
} from '../src/data/initialData';
import {
  Booking,
  Service,
  Barber,
  SystemSettings,
  Transaction,
} from '../src/types';
import { mongoRepo } from './mongoRepo';
import { mongoConfig } from './config';

class ServerStore {
  private settings: SystemSettings = { ...INITIAL_SETTINGS };
  private services: Service[] = [...INITIAL_SERVICES];
  private barbers: Barber[] = [...INITIAL_BARBERS];
  private bookings: Booking[] = [...INITIAL_BOOKINGS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private isInitialized = false;

  constructor() {
    this.boot();
  }

  private async boot() {
    try {
      if (!mongoConfig.isConfigured) {
        console.log('ℹ️ MongoDB tidak dikonfigurasi — beroperasi mode in-memory.');
        return;
      }
      const seedResult = await mongoRepo.seedIfEmpty();
      if (seedResult.seeded) {
        console.log(`🌱 MongoDB seeded (services=${seedResult.services}, barbers=${seedResult.barbers})`);
      }
      await this.initMongoSync();
    } catch (err) {
      console.log('ℹ️ MongoDB tidak aktif atau memakai fallback state in-memory');
    }
  }

  private async initMongoSync() {
    try {
      const [remoteSettings, remoteServices, remoteBarbers, remoteBookings, remoteTransactions] =
        await Promise.all([
          mongoRepo.fetchSettings(),
          mongoRepo.fetchServices(),
          mongoRepo.fetchBarbers(),
          mongoRepo.fetchBookings(),
          mongoRepo.fetchTransactions(),
        ]);

      if (remoteSettings) this.settings = remoteSettings;
      if (remoteServices && remoteServices.length > 0) this.services = remoteServices;
      if (remoteBarbers && remoteBarbers.length > 0) this.barbers = remoteBarbers;
      if (remoteBookings && remoteBookings.length > 0) this.bookings = remoteBookings;
      if (remoteTransactions && remoteTransactions.length > 0) this.transactions = remoteTransactions;

      this.isInitialized = true;
      console.log('⚡ ServerStore synced with MongoDB');
    } catch (err) {
      console.log('ℹ️ MongoDB sync failed — memakai fallback state in-memory');
    }
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<SystemSettings>, persist = true): SystemSettings {
    this.settings = { ...this.settings, ...updates };
    if (persist) {
      void mongoRepo.saveSettings(this.settings);
    }
    return { ...this.settings };
  }

  /** Simpan settings saat ini ke MongoDB secara awaited — mengembalikan status persist. */
  async saveSettingsNow(): Promise<boolean> {
    return mongoRepo.saveSettings(this.settings);
  }

  async toggleBookingSwitch(
    isOpen?: boolean,
  ): Promise<{
    isBookingOpen: boolean;
    message: string;
    persisted: boolean;
  }> {
    if (typeof isOpen === 'boolean') {
      this.settings.isBookingOpen = isOpen;
    } else {
      this.settings.isBookingOpen = !this.settings.isBookingOpen;
    }
    const persisted = await mongoRepo.saveSettings(this.settings);
    return {
      isBookingOpen: this.settings.isBookingOpen,
      message: this.settings.isBookingOpen
        ? 'Sistem Booking Online DIBUKA. Pelanggan dapat reservasi.'
        : 'Sistem Booking Online DITUTUP. Form di halaman depan kini menampilkan mode Walk-In Only.',
      persisted,
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
      void mongoRepo.insertService(service);
    }
    return service;
  }

  updateService(id: string, updates: Partial<Service>, persist = true): Service | null {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.services[idx] = { ...this.services[idx], ...updates };
    if (persist) {
      void mongoRepo.updateService(id, updates);
    }
    return this.services[idx];
  }

  deleteService(id: string, persist = true): boolean {
    const prevLen = this.services.length;
    this.services = this.services.filter((s) => s.id !== id);
    if (persist) {
      void mongoRepo.deleteService(id);
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
      void mongoRepo.insertBarber(barber);
    }
    return barber;
  }

  updateBarber(id: string, updates: Partial<Barber>, persist = true): Barber | null {
    const idx = this.barbers.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.barbers[idx] = { ...this.barbers[idx], ...updates };
    if (persist) {
      void mongoRepo.updateBarber(id, updates);
    }
    return this.barbers[idx];
  }

  deleteBarber(id: string, persist = true): boolean {
    const prevLen = this.barbers.length;
    this.barbers = this.barbers.filter((b) => b.id !== id);
    if (persist) {
      void mongoRepo.deleteBarber(id);
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
      void mongoRepo.insertBooking(booking);
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
      void mongoRepo.updateBooking(id, updates);
    }
    return this.bookings[idx];
  }

  deleteBooking(id: string, persist = true): boolean {
    const prevLen = this.bookings.length;
    this.bookings = this.bookings.filter((b) => b.id !== id && b.bookingCode !== id);
    if (persist) {
      void mongoRepo.deleteBooking(id);
    }
    // Cascade: buang transaksi yang terhubung ke booking yang dihapus
    // agar histori transaksi tidak menyimpan data menggantung (merujuk ke
    // reservasi yang sudah tidak ada). Soft-delete di MongoDB maupun filter
    // di memori ikut dilakukan di sini supaya semua jalur delete booking
    // bersih, bukan hanya lewat route.
    this.deleteTransactionsByBooking(id, false);
    void mongoRepo.deleteTransactionsByBooking(id);
    return this.bookings.length < prevLen;
  }

  /** Hapus semua transaksi yang merujuk ke sebuah booking (id). */
  deleteTransactionsByBooking(identifier: string, persist = true): number {
    const prevLen = this.transactions.length;
    this.transactions = this.transactions.filter((t) => t.bookingId !== identifier);
    if (persist) {
      void mongoRepo.deleteTransactionsByBooking(identifier);
    }
    return prevLen - this.transactions.length;
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
      void mongoRepo.insertTransaction(trx);
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
      void mongoRepo.deleteTransaction(id);
    }
    return this.transactions.length < prevLen;
  }
}

export const serverStore = new ServerStore();
