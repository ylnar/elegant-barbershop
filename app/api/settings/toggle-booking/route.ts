import { serverStore } from '@server/state';
import { json, readBody } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/settings/toggle-booking
export async function POST(req: Request) {
  const { isOpen } = await readBody(req);
  const result = serverStore.toggleBookingSwitch(typeof isOpen === 'boolean' ? isOpen : undefined);
  return json({
    success: true,
    isBookingOpen: result.isBookingOpen,
    message: result.message,
  });
}
