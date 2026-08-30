import { json, apiError, readBody, sanitizeString, normalizeNickname, normalizePhoneDigits } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Id sintetis fallback dari daftar pelanggan padanan dalam-memory:
 * "cust-<digitHP>". Id asli MongoDB selalu "cust-<epoch>_<acak>" (mengandung
 * underscore), jadi regex ini tepat membedakan keduanya.
 */
function phoneFromCustomerId(id: string): string {
  return /^cust-(\d+)$/.test(id) ? id.slice(5) : '';
}

// PUT /api/customers/:id - Edit data pelanggan (nama/nomor/email/status)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;
  const body = await readBody(req);

  const name = body.name !== undefined ? normalizeNickname(sanitizeString(body.name)) : undefined;
  const email = body.email !== undefined ? sanitizeString(body.email) : undefined;
  const phone = body.phone !== undefined ? normalizePhoneDigits(sanitizeString(body.phone)) : undefined;
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined;

  // 1) Update langsung dokumen yang ada di MongoDB
  let updated = await mongoRepo.updateCustomerById(id, { name, email, phone, isActive });
  if (updated) {
    return json({ success: true, customer: updated });
  }

  // 2) Id sintetis "cust-<phone>" (fallback / data belum memiliki dokumen):
  //    materialisasi & timpa nama ke MongoDB via upsert.
  const idPhone = phoneFromCustomerId(id);
  if (idPhone.length >= 8) {
    const phoneForUpsert = phone && phone.length >= 8 ? phone : idPhone;
    const result = await mongoRepo.upsertCustomer(
      name && name.length > 0 ? name : 'Pelanggan',
      phoneForUpsert,
      email,
      { overwriteName: true },
    );
    if (result) {
      return json({ success: true, customer: result.customer });
    }
    return json({ error: 'Database tidak aktif. Data pelanggan tidak dapat disimpan.' }, 503);
  }

  return json({ error: 'Data pelanggan tidak ditemukan.' }, 404);
}

// DELETE /api/customers/:id - Hapus data pelanggan (soft delete di MongoDB)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;

  const deletedById = await mongoRepo.deleteCustomer(id);
  if (deletedById) {
    return json({ success: true, message: 'Data pelanggan berhasil dihapus.' });
  }

  // Id sintetis fallback — hapus berdasarkan nomor HP agar tetap konsisten.
  const idPhone = phoneFromCustomerId(id);
  if (idPhone.length >= 8) {
    const deletedByPhone = await mongoRepo.deleteCustomerByPhone(idPhone);
    if (deletedByPhone) {
      return json({ success: true, message: 'Data pelanggan berhasil dihapus.' });
    }
  }

  return json({ error: 'Data pelanggan tidak ditemukan.' }, 404);
}