import { serverStore } from '@server/state';
import { json, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/bookings/track/:query
export async function GET(_req: Request, { params }: { params: Promise<{ query: string }> }) {
  const { query: rawQuery } = await params;
  const query = sanitizeString(rawQuery).toLowerCase();

  try {
    const remote = await mongoRepo.trackBookings(query);
    return json(remote);
  } catch (err) {
    console.warn('[MongoDB Track Booking Error]:', err);
    // MongoDB tidak tersedia: return error, bukan data in-memory stale
    return json({ error: 'Database tidak tersedia. Silakan coba lagi.' }, 503);
  }
}
