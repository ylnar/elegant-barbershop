import { NextRequest } from 'next/server';
import { json, apiError, readBody, tooManyRequests, isRateLimited, corsPreflightResponse } from '@lib/api';
import { authenticateAdmin } from '@server/adminAuth';
import { signJwt } from '@server/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** CORS preflight untuk Android app. */
export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * POST /api/auth/token
 * Endpoint login untuk mobile app (Android).
 * Mengembalikan JWT token (bukan cookie) yang bisa disimpan
 * dan dikirim via header Authorization di request berikutnya.
 *
 * Kredensial: owner / owner123
 */
export async function POST(req: NextRequest) {
  if (isRateLimited(req, 10, 5 * 60 * 1000, 'auth-token')) {
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

  try {
    const token = await signJwt({
      sub: result.user.id,
      username: result.user.username,
      role: result.user.role,
      displayName: result.user.displayName,
    });

    return json({
      success: true,
      token,
      user: result.user,
    });
  } catch (err) {
    console.error('[JWT Sign Error]:', err);
    return apiError('Gagal membuat token autentikasi.', 500);
  }
}
