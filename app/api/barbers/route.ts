import { serverStore } from '@server/state';
import { Barber } from '@/types';
import { json, readBody, sanitizeString } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/barbers - Always fetch fresh dynamic data from Supabase
export async function GET() {
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
        return json(mapped);
      }
    }
  } catch (err) {
    console.warn('[Barbers Route] Remote fetch error:', err);
  }

  return json(serverStore.getBarbers());
}

// POST /api/barbers
export async function POST(req: Request) {
  const body = await readBody(req);
  const name = sanitizeString(body.name);
  if (!name) {
    return json({ error: 'Nama barber wajib diisi.' }, 400);
  }

  const newBarber: Barber = {
    id: body.id || `barber-${Date.now()}`,
    name,
    isActive: body.isActive !== false,
    workingDays: Array.isArray(body.workingDays) ? body.workingDays : [0, 1, 2, 3, 4, 5, 6],
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
  return json(
    {
      success: true,
      barber: created,
      message: persistedToDatabase
        ? 'Barber berhasil disimpan ke database.'
        : 'Barber berhasil disimpan (mode lokal).',
    },
    201,
  );
}
