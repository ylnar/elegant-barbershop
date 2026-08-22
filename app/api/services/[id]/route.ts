import { serverStore } from '@server/state';
import { json, readBody, sanitizeString } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/services/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.category) payload.category_slug = updates.category;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.badge !== undefined) payload.badge = updates.badge;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { error } = await supabase.from('services').update(payload).eq('id', id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Update Service Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Update Service Error]:', err);
    }
  }

  // Always update in-memory (persist=false since route already handled Supabase)
  const updated = serverStore.updateService(id, updates, false);
  if (!updated) {
    return json({ error: 'Layanan tidak ditemukan.' }, 404);
  }

  return json({
    success: true,
    service: updated,
    message: persistedToDatabase
      ? 'Layanan berhasil diperbarui di database.'
      : 'Layanan berhasil diperbarui (mode lokal).',
  });
}

// DELETE /api/services/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!serverStore.getServiceById(id)) {
    return json({ error: 'Layanan tidak ditemukan.' }, 404);
  }

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('services').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Delete Service Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Delete Service Error]:', err);
    }
  }

  // Always delete from in-memory (persist=false since route already handled Supabase)
  serverStore.deleteService(id, false);
  return json({
    success: true,
    message: persistedToDatabase
      ? 'Layanan berhasil dihapus dari database.'
      : 'Layanan berhasil dihapus (mode lokal).',
  });
}
