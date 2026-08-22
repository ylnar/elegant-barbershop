import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/logout
 */
export async function POST() {
  return json({ success: true, message: 'Berhasil logout.' });
}
