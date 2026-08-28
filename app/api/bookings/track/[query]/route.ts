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
    if (remote.length > 0) {
      return json(remote);
    }
    if (remote) {
      // MongoDB aktif tapi tidak ditemukan -> lanjut fallback in-memory
    }
  } catch (err) {
    console.warn('[MongoDB Track Booking Error]:', err);
  }

  const bookings = serverStore.getBookings();
  const found = bookings.filter(
    (b) =>
      b.bookingCode.toLowerCase() === query ||
      b.customerPhone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, ''),
  );

  if (found.length === 0) {
    return json({ error: 'Tidak ditemukan reservasi dengan kode atau nomor tersebut.' }, 404);
  }
  return json(found);
}
