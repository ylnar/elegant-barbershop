import { serverStore } from '@server/state';
import { Barber } from '@/types';
import { json, apiError, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/barbers - Always fetch fresh dynamic data from MongoDB
export async function GET() {
  try {
    const remote = await mongoRepo.fetchBarbers();
    if (remote !== null) {
      serverStore.setBarbers(remote);
      return json(remote);
    }
  } catch (err) {
    console.warn('[Barbers Route] MongoDB fetch error:', err);
  }

  // MongoDB tidak tersedia: return [] (bukan data in-memory stale)
  return json([]);
}

// POST /api/barbers
export async function POST(req: Request) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const body = await readBody(req);
  const name = sanitizeString(body.name);
  if (!name) {
    return json({ error: 'Nama barber wajib diisi.' }, 400);
  }

  // Idempotensi: request ulang dengan key yang sama tidak membuat barber ganda.
  const idempotencyKey = body.idempotencyKey
    ? sanitizeString(body.idempotencyKey).slice(0, 120)
    : '';
  if (idempotencyKey) {
    try {
      const existing = await mongoRepo.findBarberByIdempotencyKey(idempotencyKey);
      if (existing) {
        return json(
          { success: true, barber: existing, message: 'Barber sudah tersimpan sebelumnya.', duplicate: true },
          200,
        );
      }
    } catch (err) {
      console.warn('[Barbers Route] Gagal cek idempotencyKey:', err);
    }
  }

  const newBarber: Barber = {
    id: body.id || `barber-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    idempotencyKey: idempotencyKey || undefined,
    name,
    phone: body.phone ? sanitizeString(body.phone) : undefined,
    isActive: body.isActive !== false,
    workingDays: Array.isArray(body.workingDays) ? body.workingDays : [0, 1, 2, 3, 4, 5, 6],
  };

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.insertBarber(newBarber);
    if (!persistedToDatabase) {
      console.error('[MongoDB Insert Barber Error]: simpan gagal');
    }
  } catch (err) {
    console.error('[MongoDB Insert Barber Error]:', err);
  }

  // Always store in-memory (persist=false since route already handled MongoDB)
  const created = serverStore.addBarber(newBarber, false);
  return json(
    {
      success: true,
      barber: created,
      message: persistedToDatabase
        ? 'Barber berhasil disimpan ke MongoDB.'
        : 'Barber berhasil disimpan (mode lokal).',
    },
    201,
  );
}
