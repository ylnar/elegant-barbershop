import { NextRequest } from 'next/server';
import { json, apiError, readBody, tooManyRequests, isRateLimited, corsPreflightResponse } from '@lib/api';
import { refreshAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** CORS preflight untuk Android app. */
export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * POST /api/auth/refresh
 * Perpanjang sesi MongoDB yang masih aktif — tanpa perlu username/password lagi.
 * Dipakai otomatis oleh app Android agar pengguna tidak login ulang saat sesi
 * hampir kedaluwarsa. Token diambil dari header Authorization: Bearer <token>.
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

  // Perpanjang sesi yang masih valid di MongoDB
  const result = await refreshAdminSession(token);

  if (!result || !result.user) {
    return apiError('Sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.', 401);
  }

  return json({
    success: true,
    token: result.token,
    expiresAt: result.expiresAt.toISOString(),
    user: result.user,
  });
}
