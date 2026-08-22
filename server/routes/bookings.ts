import { Router } from 'express';
import { serverStore } from '../state.ts';
import { Booking } from '../../src/types.ts';
import { sanitizeString, rateLimiter } from '../middleware/security.ts';
import { getServerSupabase } from '../supabase.ts';

export const bookingsRouter = Router();

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
  const normalized = normalizePhone(phone);
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_code, customer_phone, date, time_slot')
        .eq('is_deleted', false)
        .in('status', ACTIVE_BOOKING_STATUSES)
        .gte('date', todayStr)
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && data) {
        const found = data.find((b: any) => normalizePhone(b.customer_phone) === normalized);
        if (found) {
          return { code: String(found.booking_code || ''), date: String(found.date || '') };
        }
        return null;
      }
    } catch (err) {
      console.warn('[Bookings Route] Duplikat phone check error:', err);
    }
  }

  // Fallback in-memory store
  const memFound = serverStore
    .getBookings()
    .find(
      (b) =>
        normalizePhone(b.customerPhone) === normalized &&
        ACTIVE_BOOKING_STATUSES.includes(b.status) &&
        b.date >= todayStr,
    );
  return memFound ? { code: memFound.bookingCode, date: memFound.date } : null;
}

// GET /api/bookings
bookingsRouter.get('/', async (req, res) => {
  const { date, status, search, code } = req.query;
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      let query = supabase.from('bookings').select('*').eq('is_deleted', false).order('created_at', { ascending: false });

      if (code) {
        query = query.ilike('booking_code', String(code));
      }
      if (date) {
        query = query.eq('date', String(date));
      }
      if (status && status !== 'all') {
        query = query.eq('status', String(status));
      }
      if (search) {
        const q = String(search);
        query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,booking_code.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const formatted: Booking[] = data.map((b: any) => ({
          id: b.id,
          bookingCode: b.booking_code,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          customerEmail: b.customer_email || undefined,
          serviceId: b.service_id || 'srv-1',
          serviceName: b.service_name,
          servicePrice: Number(b.service_price) || 0,
          barberId: b.barber_id || 'any',
          barberName: b.barber_name,
          date: b.date,
          timeSlot: b.time_slot,
          totalAmount: Number(b.total_amount) || 0,
          status: b.status || 'pending',
          isWalkIn: b.is_walk_in || false,
          createdAt: b.created_at,
          updatedAt: b.updated_at || b.created_at,
        }));
        return res.json(formatted);
      }
    } catch (err) {
      console.warn('[Supabase Bookings Error]:', err);
    }
  }

  let filtered = serverStore.getBookings();

  if (code) {
    filtered = filtered.filter((b) => b.bookingCode.toLowerCase() === String(code).toLowerCase());
  }
  if (date) {
    filtered = filtered.filter((b) => b.date === date);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((b) => b.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.bookingCode.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// POST /api/bookings - Rate limited to prevent spam
bookingsRouter.post('/', rateLimiter(30, 60000), async (req, res) => {
  const settings = serverStore.getSettings();
  const isManualWalkIn = req.body.isWalkIn === true;
  const isAdminEntry = req.body.isAdminEntry === true;

  if (!settings.isBookingOpen && !isManualWalkIn && !isAdminEntry) {
    return res.status(403).json({
      error: 'Sistem booking online saat ini sedang ditutup atau dalam mode walk-in.',
      message: settings.walkInOnlyMessage,
    });
  }

  const customerName = sanitizeString(req.body.customerName);
  const customerPhone = sanitizeString(req.body.customerPhone).replace(/[^0-9]/g, '').slice(0, 16);
  const customerEmail = req.body.customerEmail ? sanitizeString(req.body.customerEmail) : undefined;
  const serviceId = sanitizeString(req.body.serviceId);
  const barberId = sanitizeString(req.body.barberId || 'any');
  const date = sanitizeString(req.body.date);
  const timeSlot = sanitizeString(req.body.timeSlot);
  if (!customerName || !customerPhone || !serviceId || !date || !timeSlot) {
    return res.status(400).json({
      error: 'Data booking belum lengkap. Nama, Telepon, Layanan, Tanggal, dan Jam wajib diisi.',
    });
  }

  // Validate: reject booking for past time slot on today (WIB timezone)
  const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayStr = nowWIB.toISOString().split('T')[0];
  if (date === todayStr && !isManualWalkIn) {
    const [slotH, slotM] = timeSlot.split(':').map(Number);
    const currentH = nowWIB.getUTCHours();
    const currentM = nowWIB.getUTCMinutes();
    if (slotH < currentH || (slotH === currentH && slotM <= currentM)) {
      return res.status(400).json({
        error: `Jam ${timeSlot} sudah lewat untuk hari ini. Silakan pilih jam yang tersedia.`,
      });
    }
  }

  // Validate: reject booking for past date
  if (date < todayStr && !isManualWalkIn) {
    return res.status(400).json({
      error: 'Tidak dapat membuat booking untuk tanggal yang sudah lewat.',
    });
  }

  // Validate: 1 nomor WhatsApp hanya boleh 1 reservasi aktif (belum lewat 1 hari).
  // Walk-in & pencatatan manual admin tidak diblokir karena bersifat instan/internal.
  if (!isManualWalkIn && !isAdminEntry) {
    try {
      const existing = await findActiveBookingByPhone(customerPhone, todayStr);
      if (existing) {
        return res.status(409).json({
          error: `Nomor WhatsApp ini sudah memiliki reservasi aktif dengan kode ${existing.code} pada ${existing.date}. Satu nomor hanya boleh satu reservasi aktif. Setelah hari reservasi terlewat, Anda bisa memesan lagi.`,
        });
      }
    } catch (err) {
      console.warn('[Bookings Route] Gagal cek duplikat nomor:', err);
    }
  }

  const service = serverStore.getServiceById(serviceId);
  const serviceName = service ? service.name : req.body.serviceName || 'Layanan Pangkas';
  const servicePrice = service ? service.price : Number(req.body.servicePrice) || 45000;

  let barberName = 'Barber Siap Pertama';
  if (barberId && barberId !== 'any') {
    const b = serverStore.getBarberById(barberId);
    if (b) barberName = b.name;
    else if (req.body.barberName) barberName = req.body.barberName;
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `ELG-${randomDigits}`;

  const newBooking: Booking = {
    id: `bk-${Date.now()}`,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').insert({
        booking_code: bookingCode,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        service_id: serviceId.length > 20 ? serviceId : null,
        service_name: serviceName,
        service_category: service?.category || 'haircut',
        service_price: servicePrice,
        barber_id: barberId !== 'any' && barberId.length > 20 ? barberId : null,
        barber_name: barberName,
        date: date,
        time_slot: timeSlot,
        total_amount: servicePrice,
        status: 'pending',
        is_walk_in: isManualWalkIn,
      }).select().single();

      if (!error && data) {
        newBooking.id = data.id;
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Insert Booking] Gagal:', error?.message);
      }
    } catch (err) {
      console.error('[Supabase Insert Booking] Gagal:', err);
    }
  }

  // Always store in-memory (persist=false since route already handled Supabase)
  const created = serverStore.addBooking(newBooking, false);
  res.status(201).json({
    success: true,
    booking: created,
    message: `Reservasi berhasil tercatat! Kode: ${bookingCode}`,
  });
});

// PUT /api/bookings/:id
bookingsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.customerName) updates.customerName = sanitizeString(updates.customerName);
  if (updates.customerPhone) updates.customerPhone = sanitizeString(updates.customerPhone);
  if (updates.notes) updates.notes = sanitizeString(updates.notes);

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.status) payload.status = updates.status;
      if (updates.customerName) payload.customer_name = updates.customerName;
      if (updates.customerPhone) payload.customer_phone = updates.customerPhone;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { error } = await supabase.from('bookings').update(payload).or(`id.eq.${id},booking_code.eq.${id}`);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Update Booking Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Update Booking Error]:', err);
    }
  }

  // Always update in-memory (persist=false since route already handled Supabase)
  const updated = serverStore.updateBooking(id, updates, false);
  if (!updated) {
    return res.status(404).json({ error: 'Data booking tidak ditemukan.' });
  }

  res.json({ success: true, booking: updated });
});

// DELETE /api/bookings/:id - Hapus data reservasi (soft delete di Supabase)
bookingsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).or(`id.eq.${id},booking_code.eq.${id}`);
      if (error) console.error('[Supabase Delete Booking Error]:', error.message);
    } catch (err) {
      console.error('[Supabase Delete Booking Error]:', err);
    }
  }

  const removed = serverStore.deleteBooking(id, false);
  if (!removed) {
    return res.status(404).json({ error: 'Data booking tidak ditemukan.' });
  }

  res.json({ success: true, message: 'Data reservasi berhasil dihapus.' });
});

// GET /api/bookings/track/:query
bookingsRouter.get('/track/:query', async (req, res) => {
  const query = sanitizeString(req.params.query).toLowerCase();
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('is_deleted', false)
        .or(`booking_code.ilike.%${query}%,customer_phone.ilike.%${query}%`);

      if (!error && data && data.length > 0) {
        const formatted: Booking[] = data.map((b: any) => ({
          id: b.id,
          bookingCode: b.booking_code,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          customerEmail: b.customer_email || undefined,
          serviceId: b.service_id || 'srv-1',
          serviceName: b.service_name,
          servicePrice: Number(b.service_price) || 0,
          barberId: b.barber_id || 'any',
          barberName: b.barber_name,
          date: b.date,
          timeSlot: b.time_slot,
          totalAmount: Number(b.total_amount) || 0,
          status: b.status || 'pending',
          isWalkIn: b.is_walk_in || false,
          createdAt: b.created_at,
          updatedAt: b.updated_at || b.created_at,
        }));
        return res.json(formatted);
      }
    } catch (err) {
      console.warn('[Supabase Track Booking Error]:', err);
    }
  }

  const bookings = serverStore.getBookings();
  const found = bookings.filter(
    (b) =>
      b.bookingCode.toLowerCase() === query ||
      b.customerPhone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '')
  );

  if (found.length === 0) {
    return res.status(404).json({ error: 'Tidak ditemukan reservasi dengan kode atau nomor tersebut.' });
  }
  res.json(found);
});
