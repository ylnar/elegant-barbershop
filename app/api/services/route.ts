import { serverStore } from '@server/state';
import { Service } from '@/types';
import { json, readBody, sanitizeString } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/services - Always fetch fresh dynamic data from Supabase
export async function GET() {
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
        return json(mapped);
      }
    }
  } catch (err) {
    console.warn('[Services Route] Remote fetch error:', err);
  }

  return json(serverStore.getServices());
}

// POST /api/services
export async function POST(req: Request) {
  const body = await readBody(req);
  const name = sanitizeString(body.name);
  if (!name) {
    return json({ error: 'Nama layanan wajib diisi.' }, 400);
  }

  const parsedPrice = Number(body.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return json({ error: 'Harga layanan harus berupa angka yang valid.' }, 400);
  }
  const price = parsedPrice;
  const newService: Service = {
    id: body.id || `srv-${Date.now()}`,
    name,
    category: body.category || 'haircut',
    price,
    durationMinutes: Math.max(5, Number(body.durationMinutes) || 40),
    description: sanitizeString(body.description || ''),
    badge: body.badge ? sanitizeString(body.badge) : undefined,
    isActive: body.isActive !== false,
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
  return json(
    {
      success: true,
      service: created,
      message: persistedToDatabase
        ? 'Layanan berhasil disimpan ke database.'
        : 'Layanan berhasil disimpan (mode lokal).',
    },
    201,
  );
}
