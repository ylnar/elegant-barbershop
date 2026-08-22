import { Router } from 'express';
import { serverStore } from '../state.ts';
import { Service } from '../../src/types.ts';
import { sanitizeString } from '../middleware/security.ts';
import { getServerSupabase } from '../supabase.ts';

export const servicesRouter = Router();

// GET /api/services - Always fetch fresh dynamic data from Supabase
servicesRouter.get('/', async (_req, res) => {
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Service[] = data.map((s: any) => ({
          id: String(s.id),
          name: s.name || 'Layanan Pangkas',
          category: s.category_slug || s.category || 'haircut',
          price: Number(s.price ?? 0),
          durationMinutes: Number(s.duration_minutes ?? s.durationMinutes ?? 35),
          description: s.description || '',
          badge: s.badge || undefined,
          isActive: s.is_active !== undefined ? Boolean(s.is_active) : true,
        }));
        serverStore.setServices(mapped);
        return res.json(mapped);
      }
    }
  } catch (err) {
    console.warn('[Services Route] Remote fetch error:', err);
  }

  res.json(serverStore.getServices());
});

// POST /api/services
servicesRouter.post('/', async (req, res) => {
  const name = sanitizeString(req.body.name);
  if (!name) {
    return res.status(400).json({ error: 'Nama layanan wajib diisi.' });
  }

  const parsedPrice = Number(req.body.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Harga layanan harus berupa angka yang valid.' });
  }
  const price = parsedPrice;
  const newService: Service = {
    id: req.body.id || `srv-${Date.now()}`,
    name,
    category: req.body.category || 'haircut',
    price,
    durationMinutes: Math.max(5, Number(req.body.durationMinutes) || 40),
    description: sanitizeString(req.body.description || ''),
    badge: req.body.badge ? sanitizeString(req.body.badge) : undefined,
    isActive: req.body.isActive !== false,
  };

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('services').insert({
        name: newService.name,
        category_slug: newService.category,
        price: newService.price,
        duration_minutes: newService.durationMinutes,
        description: newService.description,
        badge: newService.badge || null,
        is_active: newService.isActive,
      });
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Insert Service Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase Insert Service Error]:', err);
    }
  }

  // Always store in-memory (persist=false since route already handled Supabase)
  const created = serverStore.addService(newService, false);
  res.status(201).json({
    success: true,
    service: created,
    message: persistedToDatabase
      ? 'Layanan berhasil disimpan ke database.'
      : 'Layanan berhasil disimpan (mode lokal).',
  });
});

// PUT /api/services/:id
servicesRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.name) updates.name = sanitizeString(updates.name);
  if (updates.description) updates.description = sanitizeString(updates.description);
  if (updates.badge) updates.badge = sanitizeString(updates.badge);
  if (updates.price !== undefined) {
    const parsedPrice = Number(updates.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Harga layanan harus berupa angka yang valid.' });
    }
    updates.price = parsedPrice;
  }

  const existing = serverStore.getServiceById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Layanan tidak ditemukan.' });
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
    return res.status(404).json({ error: 'Layanan tidak ditemukan.' });
  }

  res.json({
    success: true,
    service: updated,
    message: persistedToDatabase
      ? 'Layanan berhasil diperbarui di database.'
      : 'Layanan berhasil diperbarui (mode lokal).',
  });
});

// DELETE /api/services/:id
servicesRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!serverStore.getServiceById(id)) {
    return res.status(404).json({ error: 'Layanan tidak ditemukan.' });
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
  res.json({
    success: true,
    message: persistedToDatabase
      ? 'Layanan berhasil dihapus dari database.'
      : 'Layanan berhasil dihapus (mode lokal).',
  });
});
