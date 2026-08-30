import { serverStore } from '@server/state';
import { Service } from '@/types';
import { json, apiError, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';
import { isMongoAvailable } from '@server/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/services - Always fetch fresh dynamic data from MongoDB
export async function GET() {
  // Cek ketersediaan MongoDB SEBELUM query.
  if (!isMongoAvailable()) {
    return apiError(
      'Database sedang tidak tersedia. Menampilkan data dari cache lokal.',
      503,
      { cached: true },
    );
  }

  try {
    const remote = await mongoRepo.fetchServices();
    if (remote !== null) {
      serverStore.setServices(remote);
      return json(remote);
    }
  } catch (err) {
    console.warn('[Services Route] MongoDB fetch error:', err);
  }

  return apiError(
    'Gagal mengambil data layanan dari database.',
    503,
    { cached: true },
  );
}

// POST /api/services
export async function POST(req: Request) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const body = await readBody(req);
  const name = sanitizeString(body.name);
  if (!name) {
    return json({ error: 'Nama layanan wajib diisi.' }, 400);
  }

  // Idempotensi: request ulang dengan key yang sama tidak membuat layanan ganda.
  const idempotencyKey = body.idempotencyKey
    ? sanitizeString(body.idempotencyKey).slice(0, 120)
    : '';
  if (idempotencyKey) {
    try {
      const existing = await mongoRepo.findServiceByIdempotencyKey(idempotencyKey);
      if (existing) {
        return json(
          { success: true, service: existing, message: 'Layanan sudah tersimpan sebelumnya.', duplicate: true },
          200,
        );
      }
    } catch (err) {
      console.warn('[Services Route] Gagal cek idempotencyKey:', err);
    }
  }

  const parsedPrice = Number(body.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return json({ error: 'Harga layanan harus berupa angka yang valid.' }, 400);
  }
  const price = parsedPrice;
  const newService: Service = {
    id: body.id || `srv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    idempotencyKey: idempotencyKey || undefined,
    name,
    category: body.category || 'haircut',
    price,
    durationMinutes: Math.max(5, Number(body.durationMinutes) || 40),
    description: sanitizeString(body.description || ''),
    badge: body.badge ? sanitizeString(body.badge) : undefined,
    isActive: body.isActive !== false,
  };

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.insertService(newService);
    if (!persistedToDatabase) {
      console.error('[MongoDB Insert Service Error]: simpan gagal');
    }
  } catch (err) {
    console.error('[MongoDB Insert Service Error]:', err);
  }

  // Always store in-memory (persist=false since route already handled MongoDB)
  const created = serverStore.addService(newService, false);
  return json(
    {
      success: true,
      service: created,
      message: persistedToDatabase
        ? 'Layanan berhasil disimpan ke MongoDB.'
        : 'Layanan berhasil disimpan (mode lokal).',
    },
    201,
  );
}
