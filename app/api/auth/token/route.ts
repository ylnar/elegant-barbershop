import { NextRequest } from 'next/server';
import { json, apiError, readBody, tooManyRequests, isRateLimited, corsPreflightResponse } from '@lib/api';
import { authenticateAdmin, createAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** CORS preflight untuk Android app. */
export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * POST /api/auth/token
 * Endpoint login untuk mobile app (Android).
 * Mengembalikan session token acak (bukan JWT) yang disimpan di MongoDB
 * koleksi `sessions`. Token dikirim via header `Authorization: Bearer <token>`.
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

  // Buat sesi di MongoDB (bukan JWT) — token acak 32 bytes, TTL 24 jam
  const session = await createAdminSession(result.user);
  if (!session) {
    return apiError('Gagal membuat sesi. Periksa koneksi MongoDB.', 500);
  }

  return json({
    success: true,
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: result.user,
  });
}
