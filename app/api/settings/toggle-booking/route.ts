import { serverStore } from '@server/state';
import { json, apiError, readBody } from '@lib/api';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/settings/toggle-booking
export async function POST(req: Request) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { isOpen } = await readBody(req);
  const result = serverStore.toggleBookingSwitch(typeof isOpen === 'boolean' ? isOpen : undefined);
  return json({
    success: true,
    isBookingOpen: result.isBookingOpen,
    message: result.message,
  });
}
