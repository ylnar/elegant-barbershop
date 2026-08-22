import { getServerSupabase } from '@server/supabase';
import { supabaseConfig } from '@server/config';
import { json, readBody, sanitizeString } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * Authenticate admin user with username + password
 */
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const username = sanitizeString(body?.username);
    const password = sanitizeString(body?.password);

    if (!username || !password) {
      return json({ error: 'Username dan password wajib diisi.' }, 400);
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return json(
        {
          error: `Database Supabase belum terkonfigurasi di server (${supabaseConfig.diagnose().join('; ')}).`,
        },
        503,
      );
    }

    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, display_name, role, is_active')
      .eq('username', username)
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn('[Auth] Query error:', error.message);
      return json({ error: 'Username atau password salah.' }, 401);
    }

    if (!user) {
      return json({ error: 'Username atau password salah.' }, 401);
    }

    // Update last_login (fire and forget)
    supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {}, () => {});

    return json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err?.message || err);
    return json({ error: 'Terjadi kesalahan internal saat autentikasi.' }, 500);
  }
}
