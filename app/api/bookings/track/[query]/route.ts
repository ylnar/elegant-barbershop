import { serverStore } from '@server/state';
import { Booking } from '@/types';
import { json, sanitizeString } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function mapBookingRow(b: any): Booking {
  return {
    id: b.id,
    bookingCode: b.booking_code,
    customerName: b.customer_name,
    customerPhone: b.customer_phone,
    customerEmail: b.customer_email || undefined,
    serviceId: b.service_id || 'srv-1',
    serviceName: b.service_name,
    servicePrice: Number(b.service_price) || 0,
    barberId: b.barber_id || 'any',
    barberName: b.barber_name,
    date: b.date,
    timeSlot: b.time_slot,
    totalAmount: Number(b.total_amount) || 0,
    status: b.status || 'pending',
    isWalkIn: b.is_walk_in || false,
    createdAt: b.created_at,
    updatedAt: b.updated_at || b.created_at,
  };
}

// GET /api/bookings/track/:query
export async function GET(_req: Request, { params }: { params: Promise<{ query: string }> }) {
  const { query: rawQuery } = await params;
  const query = sanitizeString(rawQuery).toLowerCase();
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('is_deleted', false)
        .or(`booking_code.ilike.%${query}%,customer_phone.ilike.%${query}%`);

      if (!error && data && data.length > 0) {
        return json(data.map(mapBookingRow));
      }
    } catch (err) {
      console.warn('[Supabase Track Booking Error]:', err);
    }
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
