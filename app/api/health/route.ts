import { serverStore } from '@server/state';
import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/health
export async function GET() {
  const settings = serverStore.getSettings();
  return json({
    status: 'ok',
    shop: settings.shopName,
    bookingOpen: settings.isBookingOpen,
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
