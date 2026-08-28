import { NextRequest } from 'next/server';
import { json } from '@lib/api';
import { SESSION_COOKIE, deleteAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/logout
 * Hapus sesi dari MongoDB + bersihkan cookie `eb_session`.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  await deleteAdminSession(token);

  const res = json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', httpOnly: true, maxAge: 0 });
  return res;
}