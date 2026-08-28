import { serverStore } from '@server/state';
import { json, apiError, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/bookings/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;
  const updates = await readBody(req);
  if (updates.customerName) updates.customerName = sanitizeString(updates.customerName);
  if (updates.customerPhone) updates.customerPhone = sanitizeString(updates.customerPhone);
  if (updates.notes) updates.notes = sanitizeString(updates.notes);

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.updateBooking(id, updates);
    if (!persistedToDatabase) {
      console.warn('[MongoDB Update Booking] tidak cocok dengan data di database');
    }
  } catch (err) {
    console.error('[MongoDB Update Booking Error]:', err);
  }

  // Always update in-memory (persist=false since route already handled MongoDB)
  const updated = serverStore.updateBooking(id, updates, false);
  if (!updated) {
    return json({ error: 'Data booking tidak ditemukan.' }, 404);
  }

  return json({ success: true, booking: updated });
}

// DELETE /api/bookings/:id - Hapus data reservasi (soft delete di MongoDB)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;

  try {
    await mongoRepo.deleteBooking(id);
  } catch (err) {
    console.error('[MongoDB Delete Booking Error]:', err);
  }

  const removed = serverStore.deleteBooking(id, false);
  if (!removed) {
    return json({ error: 'Data booking tidak ditemukan.' }, 404);
  }

  return json({ success: true, message: 'Data reservasi berhasil dihapus.' });
}
