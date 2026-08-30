import { serverStore } from '@server/state';
import { json, apiError, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/barbers/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;
  const updates = await readBody(req);
  if (updates.name) updates.name = sanitizeString(updates.name);
  if (updates.phone !== undefined) updates.phone = sanitizeString(updates.phone);
  const existing = serverStore.getBarberById(id);
  if (!existing) {
    return json({ error: 'Barber tidak ditemukan.' }, 404);
  }

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.updateBarber(id, updates);
    if (!persistedToDatabase) {
      console.warn('[MongoDB Update Barber] tidak cocok dengan data di database');
    }
  } catch (err) {
    console.error('[MongoDB Update Barber Error]:', err);
  }

  // Always update in-memory (persist=false since route already handled MongoDB)
  const updated = serverStore.updateBarber(id, updates, false);
  if (!updated) {
    return json({ error: 'Barber tidak ditemukan.' }, 404);
  }

  return json({
    success: true,
    barber: updated,
    message: persistedToDatabase
      ? 'Barber berhasil diperbarui di MongoDB.'
      : 'Barber berhasil diperbarui (mode lokal).',
  });
}

// DELETE /api/barbers/:id
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;

  if (!serverStore.getBarberById(id)) {
    return json({ error: 'Barber tidak ditemukan.' }, 404);
  }

  // Proteksi data: barber yang pernah melayani (transaksi) atau sedang
  // dijadwalkan (reservasi aktif) TIDAK boleh dihapus — cukup di-nonaktifkan.
  const servedTransactions = serverStore
    .getTransactions()
    .some((t) => t.barberId === id);
  const scheduledBookings = serverStore
    .getBookings()
    .some((b) => b.barberId === id && !['completed', 'cancelled'].includes(b.status));

  if (servedTransactions || scheduledBookings) {
    let persisted = false;
    try {
      persisted = await mongoRepo.updateBarber(id, { isActive: false });
    } catch (err) {
      console.error('[MongoDB Deactivate Barber Error]:', err);
    }
    serverStore.updateBarber(id, { isActive: false }, false);
    return json({
      success: true,
      deactivated: true,
      message:
        'Barber ini pernah melayani transaksi / terjadwal di reservasi sehingga tidak bisa dihapus. Barber di-nonaktifkan saja agar data riwayat tetap aman.',
    });
  }

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.deleteBarber(id);
    if (!persistedToDatabase) {
      console.warn('[MongoDB Delete Barber] tidak cocok dengan data di database');
    }
  } catch (err) {
    console.error('[MongoDB Delete Barber Error]:', err);
  }

  // Always delete from in-memory (persist=false since route already handled MongoDB)
  serverStore.deleteBarber(id, false);
  return json({
    success: true,
    deactivated: false,
    message: persistedToDatabase
      ? 'Barber berhasil dihapus dari MongoDB.'
      : 'Barber berhasil dihapus (mode lokal).',
  });
}
