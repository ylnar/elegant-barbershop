import { json, apiError, queryOf, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { serverStore } from '@server/state';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/customers?search=...
 * Daftar pelanggan. Ketika MongoDB tidak aktif/ kosong,
 * dihitung dari data booking di serverStore agar tetap berfungsi.
 */
export async function GET(req: Request) {
  const sp = queryOf(req);
  const search = sp.get('search')?.toLowerCase();

  try {
    const remote = await mongoRepo.fetchCustomers();
    if (remote.length > 0) {
      const filtered = search
        ? remote.filter(
            (c) =>
              c.name.toLowerCase().includes(search) ||
              c.phone.includes(search),
          )
        : remote;
      return json(filtered);
    }
  } catch (err) {
    console.warn('[Customers Route] MongoDB gagal:', err);
  }

  // MongoDB tidak tersedia: return [] (bukan data in-memory stale)
  return json([]);
}

/**
 * POST /api/customers
 * body: { action: 'lookup' | 'upsert', phone, name? }
 */
export async function POST(req: Request) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const body = await readBody(req);
  const action = sanitizeString(body.action) || 'lookup';
  const rawPhone = sanitizeString(body.phone || '');
  const phone = rawPhone.replace(/[^0-9]/g, '');
  if (!phone || phone.length < 8) {
    return json({ found: false, error: 'Nomor telepon tidak valid.' }, 400);
  }

  try {
    if (action === 'upsert') {
      const name = sanitizeString(body.name || 'Pelanggan');
      const email = body.email ? sanitizeString(body.email) : undefined;
      const result = await mongoRepo.upsertCustomer(name, phone, { overwriteName: true });
      if (result) {
        return json({ customer: result.customer, isNew: result.isNew });
      }
      return apiError('Gagal menyimpan data pelanggan.', 500);
    }

    // Default: lookup
    const existing = await mongoRepo.lookupCustomerByPhone(phone);
    if (existing) {
      return json({ found: true, customer: existing });
    }
    return json({ found: false });
  } catch (err) {
    console.warn('[Customers Route] Error:', err);
    return apiError('Terjadi kesalahan saat memproses permintaan.', 500);
  }
}
