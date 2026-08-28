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

  // Fallback: bangun daftar pelanggan dari data booking lokal
  const bookings = serverStore.getBookings();
  const map = new Map<string, { name: string; phone: string; email?: string; last: string }>();
  for (const b of bookings) {
    const phone = (b.customerPhone || '').replace(/[^0-9]/g, '');
    if (!phone) continue;
    const existing = map.get(phone);
    if (!existing) {
      map.set(phone, {
        name: b.customerName,
        phone,
        email: b.customerEmail,
        last: b.createdAt,
      });
    } else {
      existing.name = b.customerName;
      existing.email = b.customerEmail || existing.email;
      if (b.createdAt > existing.last) existing.last = b.createdAt;
    }
  }
  const customers = Array.from(map.values()).map((c) => ({
    id: `cust-${c.phone}`,
    name: c.name,
    phone: c.phone,
    email: c.email,
    totalBookings: bookings.filter((b) => b.customerPhone.replace(/[^0-9]/g, '') === c.phone).length,
    lastBookingDate: c.last,
    isActive: true,
    createdAt: c.last,
    updatedAt: c.last,
  }));
  const filtered = search
    ? customers.filter((c) => c.name.toLowerCase().includes(search) || c.phone.includes(search))
    : customers;
  return json(filtered);
}

/**
 * POST /api/customers
 * body: { action: 'lookup' | 'upsert', phone, name?, email? }
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
      const result = await mongoRepo.upsertCustomer(name, phone, email);
      return json(result);
    }

    const customer = await mongoRepo.lookupCustomerByPhone(phone);
    return json({ found: Boolean(customer), customer });
  } catch (err) {
    console.warn('[Customers Route] MongoDB gagal:', err);
    return json({ found: false, error: 'Gagal memproses pelanggan.' }, 503);
  }
}