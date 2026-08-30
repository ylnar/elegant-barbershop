import { serverStore } from '@server/state';
import { Booking } from '@/types';
import { isRateLimited, json, queryOf, readBody, sanitizeString, normalizeNickname, tooManyRequests } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Normalisasi nomor WA untuk perbandingan: angka saja, awalan 0 -> 62 */
function normalizePhone(phone: string): string {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

/** Status reservasi yang masih menghitung sebagai "aktif" */
const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'in_service'];

/**
 * Cek apakah nomor WhatsApp sudah memiliki reservasi aktif yang belum terlewat.
 * Aturan: 1 nomor = 1 reservasi aktif. Setelah tanggal reservasi terlewat
 * (date < hari ini), nomor tersebut boleh membuat reservasi baru.
 */
async function findActiveBookingByPhone(
  phone: string,
  todayStr: string,
): Promise<{ code: string; date: string } | null> {
  return mongoRepo.findActiveBookingByPhone(phone, todayStr);
}

// GET /api/bookings
export async function GET(req: Request) {
  const sp = queryOf(req);
  const code = sp.get('code');
  const date = sp.get('date');
  const status = sp.get('status');
  const search = sp.get('search');
  const hasFilters = Boolean(code || date || status || search);

  try {
    const remote = await mongoRepo.queryBookings({
      code: code || undefined,
      date: date || undefined,
      status: status || undefined,
      search: search || undefined,
    });
    // Sinkronisasi in-memory bila query tanpa filter (ambil semua data)
    if (!hasFilters) serverStore.setBookings(remote);
    return json(remote);
  } catch (err) {
    console.warn('[MongoDB Bookings Error]:', err);
  }

  // MongoDB tidak tersedia: return [] (bukan data in-memory stale).
  // In-memory TIDAK bisa dipercaya karena tidak sinkron dengan soft-delete
  // di MongoDB — mengembalikannya akan membuat booking yang sudah dihapus
  // muncul kembali.
  return json([]);
}

// POST /api/bookings - Rate limited to prevent spam
export async function POST(req: Request) {
  if (isRateLimited(req, 30, 60000)) {
    return tooManyRequests();
  }

  const body = await readBody(req);
  const settings = serverStore.getSettings();
  const isManualWalkIn = body.isWalkIn === true;
  const isAdminEntry = body.isAdminEntry === true;

  // Idempotensi: bila klien mengirim ulang request yang sama (retry setelah
  // timeout/jaringan putus), kembalikan booking yang sudah tersimpan — mencegah
  // duplikat saat aplikasi HP atau web mengulang POST yang sebenarnya sukses.
  const idempotencyKey = body.idempotencyKey
    ? sanitizeString(body.idempotencyKey).slice(0, 120)
    : '';
  if (idempotencyKey) {
    try {
      const existing = await mongoRepo.findBookingByIdempotencyKey(idempotencyKey);
      if (existing) {
        return json(
          {
            success: true,
            booking: existing,
            message: `Reservasi sudah tercatat sebelumnya. Kode: ${existing.bookingCode}`,
            duplicate: true,
          },
          200,
        );
      }
    } catch (err) {
      console.warn('[Bookings Route] Gagal cek idempotencyKey:', err);
    }
    // Fallback: cek idempotencyKey di store in-memory (mis. MongoDB tidak
    // aktif). Mengulang request yang sama tidak boleh membuat booking baru.
    const inMemory = serverStore.findBookingByIdempotencyKey(idempotencyKey);
    if (inMemory) {
      return json(
        {
          success: true,
          booking: inMemory,
          message: `Reservasi sudah tercatat sebelumnya. Kode: ${inMemory.bookingCode}`,
          duplicate: true,
        },
        200,
      );
    }
  }

  if (!settings.isBookingOpen && !isManualWalkIn && !isAdminEntry) {
    return json(
      {
        error: 'Sistem booking online saat ini sedang ditutup atau dalam mode walk-in.',
        message: settings.walkInOnlyMessage,
      },
      403,
    );
  }

  // Nama panggilan pelanggan: satu kata, tanpa spasi.
  let customerName = normalizeNickname(body.customerName);
  const customerPhone = sanitizeString(body.customerPhone).replace(/[^0-9]/g, '').slice(0, 16);
  const customerEmail = body.customerEmail ? sanitizeString(body.customerEmail) : undefined;
  const serviceId = sanitizeString(body.serviceId);
  const barberId = sanitizeString(body.barberId || 'any');
  const date = sanitizeString(body.date);
  const timeSlot = sanitizeString(body.timeSlot);
  if (!customerName || !customerPhone || !serviceId || !date || !timeSlot) {
    return json(
      {
        error: 'Data booking belum lengkap. Nama, Telepon, Layanan, Tanggal, dan Jam wajib diisi.',
      },
      400,
    );
  }

  // Deduplikasi pelanggan by nomor: bila nomor sudah tersimpan, otomatis pakai
  // nama yang sudah dikenal (nickname) meskipun yang diketik berbeda.
  try {
    const existing = await mongoRepo.lookupCustomerByPhone(customerPhone);
    if (existing && existing.name) customerName = existing.name;
  } catch (err) {
    console.warn('[Bookings Route] Gagal lookup pelanggan:', err);
  }

  // Validate: reject booking for past time slot on today (WIB timezone)
  const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayStr = nowWIB.toISOString().split('T')[0];
  if (date === todayStr && !isManualWalkIn) {
    const [slotH, slotM] = timeSlot.split(':').map(Number);
    const currentH = nowWIB.getUTCHours();
    const currentM = nowWIB.getUTCMinutes();
    if (slotH < currentH || (slotH === currentH && slotM <= currentM)) {
      return json(
        {
          error: `Jam ${timeSlot} sudah lewat untuk hari ini. Silakan pilih jam yang tersedia.`,
        },
        400,
      );
    }
  }

  // Validate: reject booking for past date
  if (date < todayStr && !isManualWalkIn) {
    return json(
      {
        error: 'Tidak dapat membuat booking untuk tanggal yang sudah lewat.',
      },
      400,
    );
  }

  // Validate: 1 nomor WhatsApp hanya boleh 1 reservasi aktif (belum lewat 1 hari).
  // Walk-in & pencatatan manual admin tidak diblokir karena bersifat instan/internal.
  if (!isManualWalkIn && !isAdminEntry) {
    try {
      const existing = await findActiveBookingByPhone(customerPhone, todayStr);
      if (existing) {
        return json(
          {
            error: `Nomor WhatsApp ini sudah memiliki reservasi aktif dengan kode ${existing.code} pada ${existing.date}. Satu nomor hanya boleh satu reservasi aktif. Setelah hari reservasi terlewat, Anda bisa memesan lagi.`,
          },
          409,
        );
      }
    } catch (err) {
      console.warn('[Bookings Route] Gagal cek duplikat nomor:', err);
    }
  }

  // Validasi: kapasitas slot per waktu & konflik barber (reservasi online).
  // Walk-in & pencatatan manual admin dilewati karena bersifat instan/internal.
  if (!isManualWalkIn && !isAdminEntry) {
    try {
      const slotBookings = await mongoRepo.queryBookings({ date, status: 'active' });
      const activeSlot = slotBookings.filter((b) => b.timeSlot === timeSlot);
      const maxSlot = settings.maxSimultaneousBookingsPerSlot || 4;
      if (activeSlot.length >= maxSlot) {
        return json(
          {
            error: `Slot pukul ${timeSlot} pada ${date} sudah penuh. Silakan pilih jam yang tersedia lain.`,
          },
          409,
        );
      }
      if (barberId && barberId !== 'any') {
        const barberClash = activeSlot.find((b) => b.barberId === barberId);
        if (barberClash) {
          return json(
            {
              error: `Master barber ini sudah dijadwalkan pada slot ${timeSlot} (tiket ${barberClash.bookingCode}). Pilih barber lain atau jam yang berbeda.`,
            },
            409,
          );
        }
      }
    } catch (err) {
      console.warn('[Bookings Route] Gagal cek ketersediaan slot:', err);
    }
  }

  const service = serverStore.getServiceById(serviceId);
  const serviceName = service ? service.name : body.serviceName || '';
  const servicePrice = service ? service.price : Number(body.servicePrice) || 0;

  let barberName = '';
  if (barberId && barberId !== 'any') {
    const b = serverStore.getBarberById(barberId);
    if (b) barberName = b.name;
    else if (body.barberName) barberName = body.barberName;
  } else if (body.barberName) {
    barberName = body.barberName;
  }

  // Booking code: 6 digit acak dengan collision check
  let bookingCode = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const digits = Math.floor(100000 + Math.random() * 900000);
    const candidate = `ELG-${digits}`;
    const existing = await mongoRepo.queryBookings({ code: candidate });
    if (existing.length === 0) {
      bookingCode = candidate;
      break;
    }
  }
  if (!bookingCode) {
    // Fallback: gunakan timestamp sebagai jaminan unik
    bookingCode = `ELG-${Date.now().toString().slice(-6)}`;
  }
  const nowIso = new Date().toISOString();

  const newBooking: Booking = {
    id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bookingCode,
    idempotencyKey: idempotencyKey || undefined,
    customerName,
    customerPhone,
    customerEmail,
    serviceId,
    serviceName,
    servicePrice,
    barberId,
    barberName,
    date,
    timeSlot,
    totalAmount: servicePrice,
    status: 'pending',
    isWalkIn: isManualWalkIn,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Simpan ke MongoDB — kalau gagal, JANGAN klaim sukses (data in-memory serverless
  // hilang saat instance di-recycle). Beri 503 agar pemesan tahu perlu mencoba lagi
  // dan tidak terjadi duplikat saat pengulangan.
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.insertBooking(newBooking);
    if (!persistedToDatabase) {
      console.error('[MongoDB Insert Booking] Gagal simpan ke database');
    }
    // Upsert customer to prevent duplicates (non-blocking)
    if (persistedToDatabase) {
      await mongoRepo.upsertCustomer(customerName, customerPhone).catch(() => {});
    }
  } catch (err) {
    console.error('[MongoDB Insert Booking] Gagal:', err);
  }

  if (!persistedToDatabase) {
    return json(
      {
        success: false,
        error: 'Reservasi belum tersimpan. Gangguan sementara pada database, silakan coba lagi dalam beberapa saat.',
        message: settings.maintenanceMessage && !isManualWalkIn && !isAdminEntry
          ? settings.maintenanceMessage
          : 'Gangguan sementara, silakan coba lagi.',
      },
      503,
    );
  }

  // Store in-memory hanya setelah benar-benar tersimpan di MongoDB
  const created = serverStore.addBooking(newBooking, false);
  return json(
    {
      success: true,
      booking: created,
      message: `Reservasi berhasil tercatat! Kode: ${bookingCode}`,
    },
    201,
  );
}