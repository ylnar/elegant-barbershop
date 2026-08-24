import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_WIDTHS = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1600]);
const ALLOWED_QUALITIES = new Set([75]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://tysuzmawovhavchwatjb.supabase.co';
const SUPABASE_HOST = (() => {
  try {
    return new URL(SUPABASE_URL).hostname;
  } catch {
    return '';
  }
})();
const SUPABASE_PUBLIC_PREFIX = `/storage/v1/object/public/`;

function isAllowedSource(rawUrl: string): boolean {
  if (!rawUrl) return false;
  if (rawUrl.startsWith('/')) return true;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname === SUPABASE_HOST && parsed.pathname.startsWith(SUPABASE_PUBLIC_PREFIX)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
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
  matcher: '/_next/image',
};
