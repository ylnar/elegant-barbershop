import { serverStore } from '@server/state';
import { json, apiError, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/services/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;
  const updates = await readBody(req);
  if (updates.name) updates.name = sanitizeString(updates.name);
  if (updates.description) updates.description = sanitizeString(updates.description);
  if (updates.badge) updates.badge = sanitizeString(updates.badge);
  if (updates.price !== undefined) {
    const parsedPrice = Number(updates.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return json({ error: 'Harga layanan harus berupa angka yang valid.' }, 400);
    }
    updates.price = parsedPrice;
  }

  const existing = serverStore.getServiceById(id);
  if (!existing) {
    return json({ error: 'Layanan tidak ditemukan.' }, 404);
  }

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.updateService(id, updates);
    if (!persistedToDatabase) {
      console.warn('[MongoDB Update Service] tidak cocok dengan data di database');
    }
  } catch (err) {
    console.error('[MongoDB Update Service Error]:', err);
  }

  // Always update in-memory (persist=false since route already handled MongoDB)
  const updated = serverStore.updateService(id, updates, false);
  if (!updated) {
    return json({ error: 'Layanan tidak ditemukan.' }, 404);
  }

  return json({
    success: true,
    service: updated,
    message: persistedToDatabase
      ? 'Layanan berhasil diperbarui di MongoDB.'
      : 'Layanan berhasil diperbarui (mode lokal).',
  });
}

// DELETE /api/services/:id
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;

  if (!serverStore.getServiceById(id)) {
    return json({ error: 'Layanan tidak ditemukan.' }, 404);
  }

  // Proteksi data: layanan yang sudah dipakai di transaksi / reservasi aktif
  // TIDAK boleh dihapus (agar riwayat tetap utuh). Cukup di-nonaktifkan.
  const usedInTransactions = serverStore
    .getTransactions()
    .some((t) => (t.items || []).some((i) => i.serviceId === id));
  const usedInActiveBookings = serverStore
    .getBookings()
    .some((b) => b.serviceId === id && !['completed', 'cancelled'].includes(b.status));

  if (usedInTransactions || usedInActiveBookings) {
    let persisted = false;
    try {
      persisted = await mongoRepo.updateService(id, { isActive: false });
    } catch (err) {
      console.error('[MongoDB Deactivate Service Error]:', err);
    }
    serverStore.updateService(id, { isActive: false }, false);
    return json({
      success: true,
      deactivated: true,
      message:
        'Layanan ini sudah dipakai di transaksi/reservasi sehingga tidak bisa dihapus. Layanan di-nonaktifkan saja agar data riwayat tetap aman.',
    });
  }

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.deleteService(id);
    if (!persistedToDatabase) {
      console.warn('[MongoDB Delete Service] tidak cocok dengan data di database');
    }
  } catch (err) {
    console.error('[MongoDB Delete Service Error]:', err);
  }

  // Always delete from in-memory (persist=false since route already handled MongoDB)
  serverStore.deleteService(id, false);
  return json({
    success: true,
    deactivated: false,
    message: persistedToDatabase
      ? 'Layanan berhasil dihapus dari MongoDB.'
      : 'Layanan berhasil dihapus (mode lokal).',
  });
}
