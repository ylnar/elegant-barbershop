import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_WIDTHS = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1600]);
const ALLOWED_QUALITIES = new Set([75]);

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Hanya izinkan sumber gambar lokal (path relatif). Remote origin (mis. CDN)
 * perlu ditambahkan secara eksplisit lewat images.remotePatterns.
 */
function isAllowedSource(rawUrl: string): boolean {
  if (!rawUrl) return false;
  if (rawUrl.startsWith('/')) return true;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    // Tidak ada remote host yang diizinkan
    return false;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  // ── CORS for API routes (mobile app) ──
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Preflight OPTIONS
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }
    // Add CORS headers to all API responses
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // ── Image optimization guard ──
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new NextResponse(null, { status: 405 });
  }

  const params = req.nextUrl.searchParams;
  const source = params.get('url') ?? '';
  const width = Number(params.get('w'));
  const quality = Number(params.get('q'));

  const isAllowed =
    isAllowedSource(source) && ALLOWED_WIDTHS.has(width) && ALLOWED_QUALITIES.has(quality);

  if (!isAllowed) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/_next/image'],
};
