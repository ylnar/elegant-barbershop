import { serverStore } from '@server/state';
import { json, readBody, sanitizeString } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/bookings/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await readBody(req);
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
    return json({ error: 'Data booking tidak ditemukan.' }, 404);
  }

  return json({ success: true, booking: updated });
}

// DELETE /api/bookings/:id - Hapus data reservasi (soft delete di Supabase)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
    return json({ error: 'Data booking tidak ditemukan.' }, 404);
  }

  return json({ success: true, message: 'Data reservasi berhasil dihapus.' });
}
