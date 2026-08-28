import { NextResponse } from 'next/server';

/**
 * Helper API Next.js — util bersama untuk semua route handler
 * (respons JSON, sanitasi input, rate limiting, CORS).
 */

// ── CORS Headers ───────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/** Response JSON dengan CORS headers (untuk mobile app). */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data as Record<string, unknown>, {
    status,
    headers: CORS_HEADERS,
  });
}

/** Error response dengan CORS headers. */
export function apiError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { error: message, ...extra },
    { status, headers: CORS_HEADERS },
  );
}

/** CORS preflight response (untuk OPTIONS request). */
export function corsPreflightResponse() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function readBody(req: Request): Promise<Record<string, any>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export function queryOf(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

/** Sanitasi string dasar (buang < > dan trim) — setara sanitizeString lama */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim();
}

// ── Rate limiter sederhana berbasis memori ───────────────────────────────────

const buckets = new Map<string, { count: number; resetTime: number }>();

/**
 * Scope dipisah per endpoint agar kuota satu endpoint tidak
 * menghabiskan kuota endpoint lain (mis. flood AI memblokir booking).
 */
export function isRateLimited(
  req: Request,
  maxRequests = 60,
  windowMs = 60000,
  scope = 'global',
): boolean {
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip =
    fwd.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const key = `${scope}:${ip}`;
  const now = Date.now();

  const record = buckets.get(key);
  if (!record || now > record.resetTime) {
    buckets.set(key, { count: 1, resetTime: now + windowMs });
    // Cegah kebocoran memori pada instance berumur panjang
    if (buckets.size > 5000) buckets.clear();
    return false;
  }

  if (record.count >= maxRequests) return true;

  record.count += 1;
  return false;
}

export function tooManyRequests() {
  return apiError('Terlalu banyak permintaan. Silakan coba beberapa saat lagi.', 429);
}
