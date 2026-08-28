import { serverStore } from '@server/state';
import { Service } from '@/types';
import { json, apiError, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/services - Always fetch fresh dynamic data from MongoDB
export async function GET() {
  try {
    const remote = await mongoRepo.fetchServices();
    if (remote) {
      serverStore.setServices(remote);
      return json(remote);
    }
  } catch (err) {
    console.warn('[Services Route] MongoDB fetch error:', err);
  }

  return json(serverStore.getServices());
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

  const parsedPrice = Number(body.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return json({ error: 'Harga layanan harus berupa angka yang valid.' }, 400);
  }
  const price = parsedPrice;
  const newService: Service = {
    id: body.id || `srv-${Date.now()}`,
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
