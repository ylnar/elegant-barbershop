import { serverStore } from '@server/state';
import { json, readBody, sanitizeString } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/barbers/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await readBody(req);
  if (updates.name) updates.name = sanitizeString(updates.name);
  const existing = serverStore.getBarberById(id);
  if (!existing) {
    return json({ error: 'Barber tidak ditemukan.' }, 404);
  }

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.workingDays) payload.working_days = updates.workingDays;

      const { error } = await supabase.from('barbers').update(payload).eq('id', id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Update Barber Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Update Barber Error]:', err);
    }
  }

  // Always update in-memory (persist=false since route already handled Supabase)
  const updated = serverStore.updateBarber(id, updates, false);
  if (!updated) {
    return json({ error: 'Barber tidak ditemukan.' }, 404);
  }

  return json({
    success: true,
    barber: updated,
    message: persistedToDatabase
      ? 'Barber berhasil diperbarui di database.'
      : 'Barber berhasil diperbarui (mode lokal).',
  });
}

// DELETE /api/barbers/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!serverStore.getBarberById(id)) {
    return json({ error: 'Barber tidak ditemukan.' }, 404);
  }

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('barbers').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Delete Barber Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Delete Barber Error]:', err);
    }
  }

  // Always delete from in-memory (persist=false since route already handled Supabase)
  serverStore.deleteBarber(id, false);
  return json({
    success: true,
    message: persistedToDatabase
      ? 'Barber berhasil dihapus dari database.'
      : 'Barber berhasil dihapus (mode lokal).',
  });
}
