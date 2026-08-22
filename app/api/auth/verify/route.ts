import { getServerSupabase } from '@server/supabase';
import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/auth/verify
 * Verify current session is still valid
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return json({ valid: false }, 401);
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return json({ valid: false, error: 'Database tidak tersedia.' }, 503);
    }

    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, display_name, role, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return json({ valid: false }, 401);
    }

    return json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('[Auth Verify Error]:', err?.message || err);
    return json({ valid: false }, 500);
  }
}
