import { NextRequest } from 'next/server';
import { json, apiError, readBody, tooManyRequests, isRateLimited } from '@lib/api';
import {
  authenticateAdmin,
  createAdminSession,
  isSecureRequest,
  sessionCookieOptions,
} from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * Login admin kasir/owner: validasi username + password terhadap koleksi
 * `admins` di MongoDB, lalu buat sesi tersimpan di koleksi `sessions`
 * (httpOnly cookie `eb_session`).
 *
 * Kredensial default hasil seed: owner / owner123 (role owner).
 */
export async function POST(req: NextRequest) {
  // Batasi percobaan login per IP untuk meredam brute-force
  if (isRateLimited(req, 10, 5 * 60 * 1000, 'auth-login')) {
    return tooManyRequests();
  }

  const body = await readBody(req);
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return apiError('Username dan password wajib diisi.', 400);
  }

  const result = await authenticateAdmin(username, password);
  if (!result.ok || !result.user) {
    return apiError(result.error || 'Login gagal.', 401);
  }

  const session = await createAdminSession(result.user);
  if (!session) {
    return apiError('Gagal membuat sesi. Periksa koneksi MongoDB.', 500);
  }

  const res = json({ success: true, user: result.user });
  res.cookies.set(
    'eb_session',
    session.token,
    sessionCookieOptions(session.expiresAt, isSecureRequest(req)),
  );
  return res;
}