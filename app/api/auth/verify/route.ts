import { NextRequest } from 'next/server';
import { json } from '@lib/api';
import { SESSION_COOKIE, getSessionUser } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/auth/verify
 * Cek sesi admin aktif (cookie `eb_session`). Dipakai untuk melindungi
 * dashboard: tanpa sesi valid -> { valid: false } (status 200 agar mudah
 * ditangani client).
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);

  if (!user) {
    return json({ valid: false, user: null });
  }

  return json({ valid: true, user });
}