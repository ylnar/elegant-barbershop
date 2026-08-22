import { Router } from 'express';
import { serverStore } from '../state.ts';
import { Barber } from '../../src/types.ts';
import { sanitizeString } from '../middleware/security.ts';
import { getServerSupabase } from '../supabase.ts';

export const barbersRouter = Router();

// GET /api/barbers - Always fetch fresh dynamic data from Supabase
barbersRouter.get('/', async (_req, res) => {
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Barber[] = data.map((b: any) => ({
          id: String(b.id),
          name: b.name || 'Barber',
          isActive: b.is_active !== undefined ? Boolean(b.is_active) : true,
          workingDays: Array.isArray(b.working_days) ? b.working_days : [0, 1, 2, 3, 4, 5, 6],
        }));
        serverStore.setBarbers(mapped);
        return res.json(mapped);
      }
    }
  } catch (err) {
    console.warn('[Barbers Route] Remote fetch error:', err);
  }

  res.json(serverStore.getBarbers());
});

// POST /api/barbers
barbersRouter.post('/', async (req, res) => {
  const name = sanitizeString(req.body.name);
  if (!name) {
    return res.status(400).json({ error: 'Nama barber wajib diisi.' });
  }

  const newBarber: Barber = {
    id: req.body.id || `barber-${Date.now()}`,
    name,
    isActive: req.body.isActive !== false,
    workingDays: Array.isArray(req.body.workingDays) ? req.body.workingDays : [0, 1, 2, 3, 4, 5, 6],
  };

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('barbers').insert({
        name: newBarber.name,
        is_active: newBarber.isActive,
        working_days: newBarber.workingDays,
      });
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Insert Barber Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Insert Barber Error]:', err);
    }
  }

  // Always store in-memory (persist=false since route already handled Supabase)
  const created = serverStore.addBarber(newBarber, false);
  res.status(201).json({
    success: true,
    barber: created,
    message: persistedToDatabase
      ? 'Barber berhasil disimpan ke database.'
      : 'Barber berhasil disimpan (mode lokal).',
  });
});

// PUT /api/barbers/:id
barbersRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.name) updates.name = sanitizeString(updates.name);
  const existing = serverStore.getBarberById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Barber tidak ditemukan.' });
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
    return res.status(404).json({ error: 'Barber tidak ditemukan.' });
  }

  res.json({
    success: true,
    barber: updated,
    message: persistedToDatabase
      ? 'Barber berhasil diperbarui di database.'
      : 'Barber berhasil diperbarui (mode lokal).',
  });
});

// DELETE /api/barbers/:id
barbersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!serverStore.getBarberById(id)) {
    return res.status(404).json({ error: 'Barber tidak ditemukan.' });
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
  res.json({
    success: true,
    message: persistedToDatabase
      ? 'Barber berhasil dihapus dari database.'
      : 'Barber berhasil dihapus (mode lokal).',
  });
});
