import { serverStore } from '@server/state';
import { Booking } from '@/types';
import { isRateLimited, json, queryOf, readBody, sanitizeString, tooManyRequests } from '@lib/api';
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
    if (remote.length > 0) {
      // Hanya sinkronisasi store bila query tanpa filter, agar hasil filter
      // (mis. date tertentu) tidak menimpa seluruh data in-memory.
      if (!hasFilters) serverStore.setBookings(remote);
      return json(remote);
    }
  } catch (err) {
    console.warn('[MongoDB Bookings Error]:', err);
  }

  let filtered = serverStore.getBookings();

  if (code) {
    filtered = filtered.filter((b) => b.bookingCode.toLowerCase() === String(code).toLowerCase());
  }
  if (date) {
    filtered = filtered.filter((b) => b.date === date);
  }
  if (status && status !== 'all') {
    filtered =
      status === 'active'
        ? filtered.filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status))
        : filtered.filter((b) => b.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.bookingCode.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q),
    );
  }

  return json(filtered);
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

  if (!settings.isBookingOpen && !isManualWalkIn && !isAdminEntry) {
    return json(
      {
        error: 'Sistem booking online saat ini sedang ditutup atau dalam mode walk-in.',
        message: settings.walkInOnlyMessage,
      },
      403,
    );
  }

  const customerName = sanitizeString(body.customerName);
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
      let slotBookings = await mongoRepo.queryBookings({ date, status: 'active' });
      // Fallback in-memory bila Mongo tidak tersedia / tidak mengembalikan data
      if (slotBookings.length === 0) {
        slotBookings = serverStore.getBookings().filter(
          (b) => b.date === date && ACTIVE_BOOKING_STATUSES.includes(b.status),
        );
      }
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
  const serviceName = service ? service.name : body.serviceName || 'Layanan Pangkas';
  const servicePrice = service ? service.price : Number(body.servicePrice) || 45000;

  let barberName = 'Barber Siap Pertama';
  if (barberId && barberId !== 'any') {
    const b = serverStore.getBarberById(barberId);
    if (b) barberName = b.name;
    else if (body.barberName) barberName = body.barberName;
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `ELG-${randomDigits}`;
  const nowIso = new Date().toISOString();

  const newBooking: Booking = {
    id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingCode,
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
      await mongoRepo.upsertCustomer(customerName, customerPhone, customerEmail).catch(() => {});
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
      persistedToDatabase,
    },
    201,
  );
}