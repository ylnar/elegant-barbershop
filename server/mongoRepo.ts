import { WithId, Collection, Document } from 'mongodb';
import { Booking, BookingStatus, Service, Barber, SystemSettings, Transaction } from '../src/types';
import { INITIAL_SETTINGS } from '../src/data/initialData';
import {
  COLLECTIONS,
  ensureMongoIndexes,
  getMongoCollection,
  reconnectMongoRuntime,
} from './mongodb';
import { ensureDefaultAdmin } from './adminAuth';

/**
 * server/mongoRepo.ts
 * ───────────────────
 * Repository MongoDB untuk seluruh domain data barbershop.
 *
 * Documents disimpan langsung dalam bentuk camelCase yang sama dengan
 * TypeScript domain types — tanpa pemetaan kolom — karena MongoDB bersifat
 * schemaless. Setiap doc memiliki:
 *   - `_id`        : ObjectId internal MongoDB
 *   - `id`         : string uuid/slug unik (kompatibel dengan id lama)
 *   - `isDeleted`  : soft-delete flag
 *   - `createdAt` / `updatedAt` : timestamp ISO
 */

// ── Helpers kotak pasir ──────────────────────────────────────────────────────

function isDeletedFilter(): Document {
  return { $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }] };
}

/**
 * Jalankan operasi Mongo dengan auto-retry: bila koleksi tak tersedia atau operasi
 * melempar error transien (koneksi mati idle, cold-start serverless, dll.), koneksi
 * dibangun ulang lalu percobaan dijalankan sekali lagi. Ini mencegah data hilang
 * diam-diam pada percobaan pertama setelah instance/connection baru.
 */
async function runWithMongo<T>(
  name: string,
  fn: (col: Collection<Document>) => Promise<T>,
  fallback: T,
): Promise<T> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const col = await getMongoCollection(name);
    if (col) {
      try {
        return await fn(col);
      } catch (err: unknown) {
        if (attempt < 2) {
          console.warn(`[MongoDB] Operasi "${name}" gagal, coba ulang dengan koneksi baru.`, err);
          await reconnectMongoRuntime();
          continue;
        }
        return fallback;
      }
    }
    if (attempt < 2) {
      await reconnectMongoRuntime();
      continue;
    }
    return fallback;
  }
  return fallback;
}

function toIso(d: string | Date | undefined, fallback?: string): string {
  if (!d) return fallback ?? new Date().toISOString();
  if (typeof d === 'string') return d;
  return d.toISOString();
}

function normalizeStr(v: unknown, fallback = ''): string {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function normalizeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeBool(v: unknown, fallback = false): boolean {
  if (v === undefined || v === null) return fallback;
  return v === true || v === 'true' || v === 1 || v === '1';
}

function normalizePhone(phone: string): string {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

// ── Mapper baris -> tipe aplikasi (defensif thd legacy snake_case) ───────────

function mapServiceRow(row: WithId<Document>): Service {
  return {
    id: normalizeStr(row.id, String(row._id)),
    idempotencyKey: row.idempotencyKey ? normalizeStr(row.idempotencyKey) : undefined,
    name: normalizeStr(row.name),
    category: (row.category || row.categorySlug || 'haircut') as Service['category'],
    price: normalizeNum(row.price),
    durationMinutes: normalizeNum(row.durationMinutes ?? row.duration_minutes, 35),
    description: normalizeStr(row.description, ''),
    badge: row.badge ? normalizeStr(row.badge) : undefined,
    isActive: normalizeBool(row.isActive ?? row.is_active, true),
  };
}

function mapBarberRow(row: WithId<Document>): Barber {
  return {
    id: normalizeStr(row.id, String(row._id)),
    idempotencyKey: row.idempotencyKey ? normalizeStr(row.idempotencyKey) : undefined,
    name: normalizeStr(row.name),
    phone: row.phone ? normalizeStr(row.phone) : undefined,
    isActive: normalizeBool(row.isActive ?? row.is_active, true),
    workingDays: Array.isArray(row.workingDays)
      ? row.workingDays
      : Array.isArray(row.working_days)
        ? row.working_days
        : [0, 1, 2, 3, 4, 5, 6],
  };
}

function mapBookingRow(row: WithId<Document>): Booking {
  const createdAt = toIso(row.createdAt ?? row.created_at);
  return {
    id: normalizeStr(row.id, String(row._id)),
    bookingCode: normalizeStr(row.bookingCode ?? row.booking_code),
    idempotencyKey: row.idempotencyKey ? normalizeStr(row.idempotencyKey) : undefined,
    customerName: normalizeStr(row.customerName ?? row.customer_name),
    customerPhone: normalizeStr(row.customerPhone ?? row.customer_phone),
    customerEmail: row.customerEmail || row.customer_email ? normalizeStr(row.customerEmail ?? row.customer_email) : undefined,
    serviceId: normalizeStr(row.serviceId ?? row.service_id),
    serviceName: normalizeStr(row.serviceName ?? row.service_name),
    servicePrice: normalizeNum(row.servicePrice ?? row.service_price),
    barberId: normalizeStr(row.barberId ?? row.barber_id),
    barberName: normalizeStr(row.barberName ?? row.barber_name),
    date: normalizeStr(row.date).split('T')[0],
    timeSlot: normalizeStr(row.timeSlot ?? row.time_slot),
    totalAmount: normalizeNum(row.totalAmount ?? row.total_amount),
    status: normalizeStr(row.status, 'pending') as BookingStatus,
    isWalkIn: normalizeBool(row.isWalkIn ?? row.is_walk_in, false),
    createdAt,
    updatedAt: toIso(row.updatedAt ?? row.updated_at, createdAt),
  };
}

function mapTransactionRow(row: WithId<Document>): Transaction {
  const createdAt = toIso(row.createdAt ?? row.created_at);
  return {
    id: normalizeStr(row.id, String(row._id)),
    invoiceNumber: normalizeStr(row.invoiceNumber ?? row.invoice_number),
    idempotencyKey: row.idempotencyKey ? normalizeStr(row.idempotencyKey) : undefined,
    bookingId: row.bookingId ? normalizeStr(row.bookingId) : undefined,
    customerName: normalizeStr(row.customerName ?? row.customer_name),
    customerPhone: row.customerPhone || row.customer_phone
      ? normalizeStr(row.customerPhone ?? row.customer_phone)
      : undefined,
    barberId: normalizeStr(row.barberId ?? row.barber_id),
    barberName: normalizeStr(row.barberName ?? row.barber_name),
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: normalizeNum(row.subtotal),
    discount: normalizeNum(row.discount),
    totalAmount: normalizeNum(row.totalAmount ?? row.total_amount),
    paymentMethod: (row.paymentMethod || row.payment_method || 'cash') as Transaction['paymentMethod'],
    amountPaid: normalizeNum(row.amountPaid ?? row.amount_paid),
    changeAmount: normalizeNum(row.changeAmount ?? row.change_amount),
    notes: row.notes ? normalizeStr(row.notes) : undefined,
    createdAt,
  };
}

function mapSettingsRow(row: WithId<Document>): SystemSettings {
  return {
    ...INITIAL_SETTINGS,
    isBookingOpen: normalizeBool(row.isBookingOpen, INITIAL_SETTINGS.isBookingOpen),
    walkInOnlyMessage: normalizeStr(row.walkInOnlyMessage, INITIAL_SETTINGS.walkInOnlyMessage),
    maintenanceMessage: normalizeStr(row.maintenanceMessage, INITIAL_SETTINGS.maintenanceMessage),
    currentWalkInQueue: normalizeNum(row.currentWalkInQueue, INITIAL_SETTINGS.currentWalkInQueue),
    estimatedWalkInWaitMinutes: normalizeNum(row.estimatedWalkInWaitMinutes, INITIAL_SETTINGS.estimatedWalkInWaitMinutes),
    shopName: normalizeStr(row.shopName, INITIAL_SETTINGS.shopName),
    tagline: normalizeStr(row.tagline, INITIAL_SETTINGS.tagline),
    address: normalizeStr(row.address, INITIAL_SETTINGS.address),
    googleMapsUrl: normalizeStr(row.googleMapsUrl, INITIAL_SETTINGS.googleMapsUrl),
    phone: normalizeStr(row.phone, INITIAL_SETTINGS.phone),
    whatsappNumber: normalizeStr(row.whatsappNumber, INITIAL_SETTINGS.whatsappNumber),
    email: normalizeStr(row.email, INITIAL_SETTINGS.email),
    instagramHandle: normalizeStr(row.instagramHandle, INITIAL_SETTINGS.instagramHandle),
    openTime: normalizeStr(row.openTime, INITIAL_SETTINGS.openTime),
    closeTime: normalizeStr(row.closeTime, INITIAL_SETTINGS.closeTime),
    slotIntervalMinutes: normalizeNum(row.slotIntervalMinutes, INITIAL_SETTINGS.slotIntervalMinutes),
    maxSimultaneousBookingsPerSlot: normalizeNum(row.maxSimultaneousBookingsPerSlot, INITIAL_SETTINGS.maxSimultaneousBookingsPerSlot),
    currency: normalizeStr(row.currency, INITIAL_SETTINGS.currency),
  };
}

// ── Settings ─────────────────────────────────────────────────────────────────

export const mongoRepo = {
  async fetchSettings(): Promise<SystemSettings | null> {
    try {
      const col = await getMongoCollection(COLLECTIONS.SETTINGS);
      if (!col) return null;
      const row = await col.findOne({ key: 'default_settings' });
      if (!row) return null;
      return mapSettingsRow(row as WithId<Document>);
    } catch {
      return null;
    }
  },

  async saveSettings(settings: SystemSettings): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.SETTINGS,
      async (col) => {
        const { _id: _omit, ...payload } = { ...(settings as unknown as Document) };
        await col.updateOne(
          { key: 'default_settings' },
          {
            $set: { ...payload, updatedAt: new Date().toISOString() },
            $setOnInsert: { key: 'default_settings', createdAt: new Date().toISOString() },
          },
          { upsert: true },
        );
        return true;
      },
      false,
    );
  },

  // ── Services ───────────────────────────────────────────────────────────────

  async fetchServices(): Promise<Service[] | null> {
    return runWithMongo(
      COLLECTIONS.SERVICES,
      async (col) => {
        const rows = await col.find(isDeletedFilter()).sort({ createdAt: -1 }).toArray();
        // Kembalikan [] saat koleksi kosong — JANGAN null, agar state.ts
        // tahu bahwa MongoDB aktif dan koleksi memang kosong (bukan gagal fetch).
        return rows.map(mapServiceRow);
      },
      null,
    );
  },

  async insertService(service: Service): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.SERVICES,
      async (col) => {
        // Cek duplikat berdasarkan nama (case-insensitive) — mencegah
        // layanan ganda dari request berulang atau race condition.
        const existing = await col.findOne({
          name: new RegExp(`^${escapeRegExp(service.name)}$`, 'i'),
          ...isDeletedFilter(),
        });
        if (existing) return true; // Sudah ada, anggap sukses (idempoten)
        const res = await col.insertOne({
          ...service,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return res.acknowledged;
      },
      false,
    );
  },

  /**
   * Cari layanan yang sudah pernah dibuat dengan idempotencyKey yang sama
   * (anti-duplikat create saat klien mengulang request yang gagal timeout).
   */
  async findServiceByIdempotencyKey(key: string): Promise<Service | null> {
    return runWithMongo(
      COLLECTIONS.SERVICES,
      async (col) => {
        const row = await col.findOne({
          idempotencyKey: key,
          ...isDeletedFilter(),
        });
        return row ? mapServiceRow(row) : null;
      },
      null,
    );
  },

  async updateService(id: string, updates: Partial<Service>): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.SERVICES,
      async (col) => {
        const result = await col.updateMany(
          { id },
          { $set: { ...updates, updatedAt: new Date().toISOString() } },
        );
        return result.matchedCount > 0;
      },
      false,
    );
  },

  async deleteService(id: string): Promise<boolean> {
    try {
      const col = await getMongoCollection(COLLECTIONS.SERVICES);
      if (!col) return false;
      const result = await col.updateMany(
        { id },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  async restoreService(id: string): Promise<boolean> {
    try {
      const col = await getMongoCollection(COLLECTIONS.SERVICES);
      if (!col) return false;
      const result = await col.updateMany(
        { id },
        { $set: { isDeleted: false, deletedAt: null, updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  // ── Barbers ────────────────────────────────────────────────────────────────

  async fetchBarbers(): Promise<Barber[] | null> {
    return runWithMongo(
      COLLECTIONS.BARBERS,
      async (col) => {
        const rows = await col.find(isDeletedFilter()).sort({ createdAt: -1 }).toArray();
        return rows.map(mapBarberRow);
      },
      null,
    );
  },

  async insertBarber(barber: Barber): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.BARBERS,
      async (col) => {
        const res = await col.insertOne({
          ...barber,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return res.acknowledged;
      },
      false,
    );
  },

  /** Cari barber yang sudah pernah dibuat dengan idempotencyKey yang sama. */
  async findBarberByIdempotencyKey(key: string): Promise<Barber | null> {
    return runWithMongo(
      COLLECTIONS.BARBERS,
      async (col) => {
        const row = await col.findOne({
          idempotencyKey: key,
          ...isDeletedFilter(),
        });
        return row ? mapBarberRow(row) : null;
      },
      null,
    );
  },

  async updateBarber(id: string, updates: Partial<Barber>): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.BARBERS,
      async (col) => {
        const result = await col.updateMany(
          { id },
          { $set: { ...updates, updatedAt: new Date().toISOString() } },
        );
        return result.matchedCount > 0;
      },
      false,
    );
  },

  async deleteBarber(id: string): Promise<boolean> {
    try {
      const col = await getMongoCollection(COLLECTIONS.BARBERS);
      if (!col) return false;
      const result = await col.updateMany(
        { id },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  async restoreBarber(id: string): Promise<boolean> {
    try {
      const col = await getMongoCollection(COLLECTIONS.BARBERS);
      if (!col) return false;
      const result = await col.updateMany(
        { id },
        { $set: { isDeleted: false, deletedAt: null, updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  // ── Bookings ───────────────────────────────────────────────────────────────

  async fetchBookings(): Promise<Booking[] | null> {
    return runWithMongo(
      COLLECTIONS.BOOKINGS,
      async (col) => {
        const rows = await col.find(isDeletedFilter()).sort({ createdAt: -1, _id: -1 }).toArray();
        return rows.map(mapBookingRow);
      },
      null,
    );
  },

  async insertBooking(booking: Booking): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.BOOKINGS,
      async (col) => {
        const res = await col.insertOne({
          ...booking,
          isDeleted: false,
          createdAt: booking.createdAt || new Date().toISOString(),
          updatedAt: booking.updatedAt || booking.createdAt || new Date().toISOString(),
        });
        return res.acknowledged;
      },
      false,
    );
  },

  /** Cari booking yang sudah pernah dibuat dengan idempotencyKey yang sama. */
  async findBookingByIdempotencyKey(key: string): Promise<Booking | null> {
    return runWithMongo(
      COLLECTIONS.BOOKINGS,
      async (col) => {
        const row = await col.findOne({
          idempotencyKey: key,
          ...isDeletedFilter(),
        });
        return row ? mapBookingRow(row) : null;
      },
      null,
    );
  },

  async updateBooking(identifier: string, updates: Partial<Booking>): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.BOOKINGS,
      async (col) => {
        const result = await col.updateMany(
          { $or: [{ id: identifier }, { bookingCode: identifier }] },
          { $set: { ...updates, updatedAt: new Date().toISOString() } },
        );
        return result.matchedCount > 0;
      },
      false,
    );
  },

  async deleteBooking(identifier: string): Promise<boolean> {
    try {
      const col = await getMongoCollection(COLLECTIONS.BOOKINGS);
      if (!col) return false;
      const result = await col.updateMany(
        { $or: [{ id: identifier }, { bookingCode: identifier }] },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      );
      if (result.matchedCount > 0) {
        // Cascade: hapus transaksi terkait agar tidak ada data menggantung
        await this.deleteTransactionsByBooking(identifier);
      }
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  /** Cari booking dengan filter: kode, tanggal, status, pencarian bebas */
  async queryBookings(filters: {
    code?: string;
    date?: string;
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<Booking[]> {
    return runWithMongo(
      COLLECTIONS.BOOKINGS,
      async (col) => {
        const query: Document = { ...isDeletedFilter() };
        if (filters.code) query.bookingCode = new RegExp(`^${escapeRegExp(filters.code)}$`, 'i');
        if (filters.date) query.date = filters.date;
        if (filters.status && filters.status !== 'all') {
          // Pseudo-status 'active' dipakai API untuk mengambil reservasi aktif saja
          query.status =
            filters.status === 'active'
              ? { $in: ['pending', 'confirmed', 'in_service'] }
              : filters.status;
        }
        if (filters.search) {
          const q = escapeRegExp(filters.search);
          // Gabung kondisi pencarian dengan filter soft-delete secara aman.
          // Karena isDeletedFilter() pakai $or, kita harus menempatkan
          // kondisi pencarian di level $and yang sama agar tidak konflik.
          const searchCondition = {
            $or: [
              { customerName: new RegExp(q, 'i') },
              { customerPhone: new RegExp(q, 'i') },
              { bookingCode: new RegExp(q, 'i') },
              { serviceName: new RegExp(q, 'i') },
            ],
          };
          if (query.$and) {
            // $and sudah ada (dari isDeletedFilter) — tambahkan search
            (query.$and as Document[]).push(searchCondition);
          } else {
            query.$and = [searchCondition];
          }
        }

        const rows = await col
          .find(query)
          .sort({ createdAt: -1, _id: -1 })
          .limit(filters.limit ?? 0)
          .toArray();
        return rows.map(mapBookingRow);
      },
      [],
    );
  },

  /** Lacak reservasi via kode tiket atau nomor handphone */
  async trackBookings(queryStr: string): Promise<Booking[]> {
    try {
      const col = await getMongoCollection(COLLECTIONS.BOOKINGS);
      if (!col) return [];

      // Cocokkan nomor simpanan 08xx (0-awal) maupun 62xx (ternormalisasi)
      const rawDigits = String(queryStr || '').replace(/[^0-9]/g, '');
      const $or: Document[] = [
        { bookingCode: new RegExp(`^${escapeRegExp(queryStr)}$`, 'i') },
      ];
      if (rawDigits) $or.push({ customerPhone: { $in: [rawDigits, normalizePhone(rawDigits)] } });

      const rows = await col
        .find({
          ...isDeletedFilter(),
          $and: [{ $or }],
        })
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .toArray();
      return rows.map(mapBookingRow);
    } catch {
      return [];
    }
  },

  /** Cek apakah nomor punya reservasi aktif (belum lewat tanggal) */
  async findActiveBookingByPhone(
    phone: string,
    todayStr: string,
  ): Promise<{ code: string; date: string } | null> {
    try {
      return await runWithMongo(
        COLLECTIONS.BOOKINGS,
        async (col) => {
          const normalized = normalizePhone(phone);
          const rows = await col
            .find({
              ...isDeletedFilter(),
              status: { $in: ['pending', 'confirmed', 'in_service'] },
              date: { $gte: todayStr },
            })
            .sort({ createdAt: -1, _id: -1 })
            .limit(200)
            .toArray();
          const found = rows.find((b) => normalizePhone(b.customerPhone) === normalized);
          return found
            ? { code: String(found.bookingCode || ''), date: String(found.date || '') }
            : null;
        },
        null,
      );
    } catch {
      return null;
    }
  },

  // ── Transactions ───────────────────────────────────────────────────────────

  async fetchTransactions(): Promise<Transaction[] | null> {
    return runWithMongo(
      COLLECTIONS.TRANSACTIONS,
      async (col) => {
        const rows = await col.find(isDeletedFilter()).sort({ createdAt: -1, _id: -1 }).toArray();
        return rows.map(mapTransactionRow);
      },
      null,
    );
  },

  async queryTransactions(filters: {
    date?: string;
    paymentMethod?: string;
    search?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    return runWithMongo(
      COLLECTIONS.TRANSACTIONS,
      async (col) => {
        const query: Document = { ...isDeletedFilter() };
        if (filters.date) {
          const startUTC = new Date(`${filters.date}T00:00:00+07:00`).toISOString();
          const endUTC = new Date(`${filters.date}T23:59:59+07:00`).toISOString();
          query.createdAt = { $gte: startUTC, $lte: endUTC };
        }
        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
          query.paymentMethod = filters.paymentMethod;
        }
        if (filters.search) {
          const q = escapeRegExp(filters.search);
          const searchCondition = {
            $or: [
              { invoiceNumber: new RegExp(q, 'i') },
              { customerName: new RegExp(q, 'i') },
              { customerPhone: new RegExp(q, 'i') },
              { barberName: new RegExp(q, 'i') },
            ],
          };
          if (query.$and) {
            (query.$and as Document[]).push(searchCondition);
          } else {
            query.$and = [searchCondition];
          }
        }

        const rows = await col
          .find(query)
          .sort({ createdAt: -1, _id: -1 })
          .limit(filters.limit ?? 0)
          .toArray();
        return rows.map(mapTransactionRow);
      },
      [],
    );
  },

  async insertTransaction(trx: Transaction): Promise<boolean> {
    return runWithMongo(
      COLLECTIONS.TRANSACTIONS,
      async (col) => {
        const res = await col.insertOne({
          ...trx,
          isDeleted: false,
          createdAt: trx.createdAt || new Date().toISOString(),
          updatedAt: trx.createdAt || new Date().toISOString(),
        });
        return res.acknowledged;
      },
      false,
    );
  },

  /** Cari transaksi berdasarkan bookingId (termasuk yang sudah soft-delete). */
  async findTransactionByBookingId(bookingId: string): Promise<Transaction | null> {
    return runWithMongo(
      COLLECTIONS.TRANSACTIONS,
      async (col) => {
        // Cari TANPA isDeletedFilter — termasuk transaksi yang sudah dihapus
        // agar tidak terjadi duplikat auto-transaction.
        const row = await col.findOne({ bookingId });
        return row ? mapTransactionRow(row) : null;
      },
      null,
    );
  },

  /** Cari transaksi yang sudah pernah dibuat dengan idempotencyKey yang sama. */
  async findTransactionByIdempotencyKey(key: string): Promise<Transaction | null> {
    return runWithMongo(
      COLLECTIONS.TRANSACTIONS,
      async (col) => {
        const row = await col.findOne({
          idempotencyKey: key,
          ...isDeletedFilter(),
        });
        return row ? mapTransactionRow(row) : null;
      },
      null,
    );
  },

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const col = await getMongoCollection(COLLECTIONS.TRANSACTIONS);
      if (!col) return false;
      const result = await col.updateMany(
        { id },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  /**
   * Hapus (soft-delete) semua transaksi yang terhubung ke sebuah booking.
   * `identifier` adalah id booking. Transaksi otomatis dari reservasi
   * menyimpan `bookingId` = booking.id. Dipanggil saat booking dihapus agar
   * histori transaksi tidak menyimpan data menggantung yang merujuk ke
   * reservasi yang sudah tidak ada.
   */
  async deleteTransactionsByBooking(identifier: string): Promise<number> {
    try {
      const col = await getMongoCollection(COLLECTIONS.TRANSACTIONS);
      if (!col) return 0;
      const result = await col.updateMany(
        {
          isDeleted: { $ne: true },
          bookingId: identifier,
        },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      );
      return result.modifiedCount;
    } catch {
      return 0;
    }
  },

  // ── Customers ──────────────────────────────────────────────────────────────

  async fetchCustomers(): Promise<Document[]> {
    try {
      const col = await getMongoCollection<Document>(COLLECTIONS.CUSTOMERS);
      if (!col) return [];
      const rows = await col
        .find(isDeletedFilter())
        .sort({ totalBookings: -1, _id: -1 })
        .limit(500)
        .toArray();
      return rows.map(mapCustomerRow);
    } catch {
      return [];
    }
  },

  async lookupCustomerByPhone(phone: string): Promise<Document | null> {
    try {
      const col = await getMongoCollection<Document>(COLLECTIONS.CUSTOMERS);
      if (!col || !phone) return null;
      const normalized = normalizePhone(phone);
      const row = await col.findOne({ phone: normalized });
      return row ? mapCustomerRow(row) : null;
    } catch {
      return null;
    }
  },

  async upsertCustomer(
    name: string,
    phone: string,
    opts?: { overwriteName?: boolean },
  ): Promise<{ customer: Document; isNew: boolean } | null> {
    try {
      const col = await getMongoCollection<Document>(COLLECTIONS.CUSTOMERS);
      if (!col || !phone || normalizePhone(phone).length < 8) return null;

      const normalized = normalizePhone(phone);
      const today = new Date().toISOString().split('T')[0];
      const existing = await col.findOne({ phone: normalized });

      if (existing) {
        // Jangan timpa nama yang sudah dikenal untuk nomor yang sama —
        // nama pertama yang tersimpan menjadi nama resmi (nickname).
        // Kecuali edit eksplisit oleh admin (overwriteName=true) memakai
        // nama baru yang diketik di form edit pelanggan.
        const finalName =
          opts?.overwriteName && name && name.trim()
            ? name.trim()
            : (existing.name && existing.name.trim()) ||
              (name && name.trim()) ||
              'Pelanggan';
        const updated = await col.findOneAndUpdate(
          { _id: existing._id },
          {
            $set: {
              name: finalName,
              lastBookingDate: today,
              updatedAt: new Date().toISOString(),
            },
            $inc: { totalBookings: 1 },
          },
          { returnDocument: 'after' },
        );
        if (updated) {
          return { customer: mapCustomerRow(updated), isNew: false };
        }
        // Fallback: baca ulang bila update tidak membalas dokumen
        const after = await col.findOne({ phone: normalized });
        return { customer: mapCustomerRow(after), isNew: false };
      }

      const doc = {
        id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: (name && name.trim()) || 'Pelanggan',
        phone: normalized,
        totalBookings: 1,
        lastBookingDate: today,
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await col.insertOne(doc);
      return { customer: mapCustomerRow(doc), isNew: true };
    } catch {
      return null;
    }
  },

  /** Update pelanggan eksplisit (edit oleh admin) berdasarkan `id` dokumen. */
  async updateCustomerById(
    id: string,
    updates: { name?: string; phone?: string; isActive?: boolean },
  ): Promise<Document | null> {
    try {
      const col = await getMongoCollection<Document>(COLLECTIONS.CUSTOMERS);
      if (!col || !id) return null;
      const existing = await col.findOne({ id, ...isDeletedFilter() });
      if (!existing) return null;
      const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (updates.name !== undefined) {
        const name = String(updates.name || '').trim();
        if (name) set.name = name;
      }
      if (updates.phone !== undefined) {
        const phone = normalizePhone(updates.phone);
        if (phone.length >= 8) {
          // Hindari tabrakan nomor: jangan timpa bila nomor baru sudah dipakai doc lain.
          const clash = await col.findOne({ phone, _id: { $ne: existing._id }, ...isDeletedFilter() });
          if (!clash) set.phone = phone;
        }
      }
      if (updates.isActive !== undefined) set.isActive = updates.isActive;
      await col.updateOne({ _id: existing._id }, { $set: set });
      const after = await col.findOne({ id, ...isDeletedFilter() });
      return after ? mapCustomerRow(after) : null;
    } catch {
      return null;
    }
  },

  /** Soft-delete pelanggan berdasarkan `id` dokumen. */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const col = await getMongoCollection<Document>(COLLECTIONS.CUSTOMERS);
      if (!col) return false;
      const result = await col.updateMany(
        { id, ...isDeletedFilter() },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  /** Soft-delete pelanggan berdasarkan nomor HP (id sintetis `cust-<phone>`). */
  async deleteCustomerByPhone(phone: string): Promise<boolean> {
    try {
      const col = await getMongoCollection<Document>(COLLECTIONS.CUSTOMERS);
      if (!col) return false;
      const result = await col.updateMany(
        { phone: normalizePhone(phone) },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  /** Daftar nomor HP pelanggan yang sudah di-soft-delete (untuk filter fallback). */
  async fetchDeletedCustomerPhones(): Promise<string[]> {
    try {
      const col = await getMongoCollection<Document>(COLLECTIONS.CUSTOMERS);
      if (!col) return [];
      const rows = await col
        .find({ isDeleted: true })
        .project({ phone: 1, _id: 0 })
        .limit(2000)
        .toArray();
      return rows.map((r) => normalizeStr(r.phone, '')).filter(Boolean);
    } catch {
      return [];
    }
  },

  // ── Trash / Soft-Delete Management ─────────────────────────────────────────

  /**
   * Ambil semua data yang sudah di-soft-delete dari semua koleksi.
   * Mengembalikan array objek dengan field `type` (nama koleksi) + data asli.
   */
  async fetchDeletedItems(type?: string): Promise<{ type: string; id: string; name: string; deletedAt: string; detail: Record<string, unknown> }[]> {
    const results: { type: string; id: string; name: string; deletedAt: string; detail: Record<string, unknown> }[] = [];

    const collections: { name: string; collection: string; getName: (row: Document) => string }[] = [
      { name: 'services', collection: COLLECTIONS.SERVICES, getName: (r) => normalizeStr(r.name) },
      { name: 'barbers', collection: COLLECTIONS.BARBERS, getName: (r) => normalizeStr(r.name) },
      { name: 'bookings', collection: COLLECTIONS.BOOKINGS, getName: (r) => `${normalizeStr(r.bookingCode)} — ${normalizeStr(r.customerName)}` },
      { name: 'transactions', collection: COLLECTIONS.TRANSACTIONS, getName: (r) => `${normalizeStr(r.invoiceNumber)} — ${normalizeStr(r.customerName)}` },
      { name: 'customers', collection: COLLECTIONS.CUSTOMERS, getName: (r) => normalizeStr(r.name) },
    ];

    const targets = type ? collections.filter((c) => c.name === type) : collections;

    for (const cfg of targets) {
      try {
        const col = await getMongoCollection(cfg.collection);
        if (!col) continue;
        const rows = await col.find({ isDeleted: true }).sort({ deletedAt: -1 }).limit(200).toArray();
        for (const row of rows) {
          const id = normalizeStr(row.id, String(row._id));
          const detail: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(row)) {
            if (k === '_id' || k === 'isDeleted') continue;
            detail[k] = v;
          }
          results.push({
            type: cfg.name,
            id,
            name: cfg.getName(row),
            deletedAt: toIso(row.deletedAt, ''),
            detail,
          });
        }
      } catch {
        // skip collection on error
      }
    }

    return results;
  },

  /** Restore item yang sudah di-soft-delete berdasarkan type + id. */
  async restoreItem(type: string, id: string): Promise<boolean> {
    const colName =
      type === 'services' ? COLLECTIONS.SERVICES
      : type === 'barbers' ? COLLECTIONS.BARBERS
      : type === 'bookings' ? COLLECTIONS.BOOKINGS
      : type === 'transactions' ? COLLECTIONS.TRANSACTIONS
      : type === 'customers' ? COLLECTIONS.CUSTOMERS
      : null;
    if (!colName) return false;
    try {
      const col = await getMongoCollection(colName);
      if (!col) return false;
      const result = await col.updateMany(
        { id, isDeleted: true },
        { $set: { isDeleted: false, deletedAt: null, updatedAt: new Date().toISOString() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
  },

  /** Hapus permanen (hard delete) item berdasarkan type + id. */
  async permanentDeleteItem(type: string, id: string): Promise<boolean> {
    const colName =
      type === 'services' ? COLLECTIONS.SERVICES
      : type === 'barbers' ? COLLECTIONS.BARBERS
      : type === 'bookings' ? COLLECTIONS.BOOKINGS
      : type === 'transactions' ? COLLECTIONS.TRANSACTIONS
      : type === 'customers' ? COLLECTIONS.CUSTOMERS
      : null;
    if (!colName) return false;
    try {
      const col = await getMongoCollection(colName);
      if (!col) return false;
      const result = await col.deleteMany({ id });
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  },

  /** Hapus permanen semua item soft-deleted tertentu. */
  async permanentDeleteAll(type: string): Promise<number> {
    const colName =
      type === 'services' ? COLLECTIONS.SERVICES
      : type === 'barbers' ? COLLECTIONS.BARBERS
      : type === 'bookings' ? COLLECTIONS.BOOKINGS
      : type === 'transactions' ? COLLECTIONS.TRANSACTIONS
      : type === 'customers' ? COLLECTIONS.CUSTOMERS
      : null;
    if (!colName) return 0;
    try {
      const col = await getMongoCollection(colName);
      if (!col) return 0;
      const result = await col.deleteMany({ isDeleted: true });
      return result.deletedCount;
    } catch {
      return 0;
    }
  },

  // ── Seed awal (idempotent) ─────────────────────────────────────────────────

  /** Isi data awal jika koleksi <service/barber/setting/admin> masih kosong. */
  async seedIfEmpty(): Promise<{ seeded: boolean; services: number; barbers: number }> {
    try {
      await ensureMongoIndexes();
      await ensureDefaultAdmin();
      const { INITIAL_SERVICES, INITIAL_BARBERS } = await import('../src/data/initialData');

      const servicesCol = await getMongoCollection(COLLECTIONS.SERVICES);
      const barbersCol = await getMongoCollection(COLLECTIONS.BARBERS);
      const settingsCol = await getMongoCollection(COLLECTIONS.SETTINGS);
      if (!servicesCol || !barbersCol || !settingsCol) return { seeded: false, services: 0, barbers: 0 };

      const svcCount = await servicesCol.countDocuments();
      const brbCount = await barbersCol.countDocuments();

      let seeded = false;
      if (svcCount === 0) {
        await servicesCol.insertMany(
          INITIAL_SERVICES.map((s) => ({
            ...s,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          { ordered: false },
        );
        seeded = true;
      }
      if (brbCount === 0) {
        await barbersCol.insertMany(
          INITIAL_BARBERS.map((b) => ({
            ...b,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          { ordered: false },
        );
        seeded = true;
      }

      const settingsDoc = await settingsCol.findOne({ key: 'default_settings' });
      if (!settingsDoc) {
        await settingsCol.insertOne({
          key: 'default_settings',
          ...INITIAL_SETTINGS,
          createdAt: new Date().toISOString(),
        });
        seeded = true;
      }

      return { seeded, services: svcCount, barbers: brbCount };
    } catch {
      return { seeded: false, services: 0, barbers: 0 };
    }
  },
};

function escapeRegExp(input: string): string {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapCustomerRow(row: Document | null): Document {
  if (!row) return {};
  return {
    id: normalizeStr(row.id, String(row._id || '')),
    name: normalizeStr(row.name),
    phone: normalizeStr(row.phone),
    totalBookings: normalizeNum(row.totalBookings),
    lastBookingDate: row.lastBookingDate ? normalizeStr(row.lastBookingDate) : undefined,
    isActive: normalizeBool(row.isActive, true),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}
