import { checkServerSupabaseStatus } from '@server/supabase';
import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/database/status
export async function GET() {
  const status = await checkServerSupabaseStatus();
  return json(status);
}
