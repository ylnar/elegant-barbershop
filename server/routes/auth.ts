import { Router, Request, Response } from 'express';
import { getServerSupabase } from '../supabase.ts';
import { sanitizeString } from '../middleware/security.ts';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Authenticate admin user with username + password
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const username = sanitizeString(req.body?.username);
    const password = sanitizeString(req.body?.password);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({
        error: 'Database Supabase belum terkonfigurasi. Periksa .env dan restart server.',
      });
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
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Update last_login (fire and forget)
    supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {}, () => {});

    return res.json({
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
    return res.status(500).json({ error: 'Terjadi kesalahan internal saat autentikasi.' });
  }
});

/**
 * GET /api/auth/verify
 * Verify current session is still valid
 */
authRouter.get('/verify', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ valid: false });
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({ valid: false, error: 'Database tidak tersedia.' });
    }

    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, display_name, role, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ valid: false });
    }

    return res.json({
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
    return res.status(500).json({ valid: false });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Berhasil logout.' });
});
