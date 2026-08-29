import { NextRequest } from 'next/server';
import { json, apiError, readBody, tooManyRequests, isRateLimited, corsPreflightResponse } from '@lib/api';
import { getAdminById } from '@server/adminAuth';
import { signJwt, verifyJwtAllowExpired } from '@server/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** CORS preflight untuk Android app. */
export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * POST /api/auth/refresh
 * Tukar token JWT yang masih dalam masa tenggang (30 hari sejak kedaluwarsa)
 * dengan token baru — tanpa perlu username/password lagi.
 * Dipakai otomatis oleh app Android agar pengguna tidak login ulang saat token
 * kedaluwarsa. Token diambil dari header Authorization: Bearer <token>.
 */
export async function POST(req: NextRequest) {
  if (isRateLimited(req, 30, 5 * 60 * 1000, 'auth-refresh')) {
    return tooManyRequests();
  }

  const authHeader = req.headers.get('authorization') || '';
  const body = await readBody(req);
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : String(body?.token || '').trim();

  if (!token) return apiError('Token tidak ditemukan.', 401);

  const payload = await verifyJwtAllowExpired(token);
  if (!payload || !payload.sub) {
    return apiError('Token tidak valid atau sudah kedaluwarsa lama. Silakan login ulang.', 401);
  }

  const user = await getAdminById(String(payload.sub));
  if (!user) {
    return apiError('Akun admin tidak ditemukan atau dinonaktifkan.', 401);
  }

  try {
    const newToken = await signJwt({
      sub: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    });
    return json({
      success: true,
      token: newToken,
      user,
    });
  } catch (err) {
    console.error('[JWT Refresh Error]:', err);
    return apiError('Gagal membuat token autentikasi.', 500);
  }
}