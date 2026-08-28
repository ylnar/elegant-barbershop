import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { WithId, Document } from 'mongodb';
import { COLLECTIONS, getMongoCollection } from './mongodb';
import { verifyJwt, type JwtPayload } from './jwt';

/**
 * server/adminAuth.ts
 * ───────────────────
 * Autentikasi admin terpusat berbasis MongoDB.
 * - Password disimpan sebagai hash scrypt (salt acak per user), TIDAK pernah
 *   disimpan plaintext.
 * - Sesi disimpan di koleksi `sessions` dengan TTL (expireAfterSeconds: 0).
 * - Login/waktu nonaktif memakai httpOnly cookie `eb_session`.
 */

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
};

export const SESSION_COOKIE = 'eb_session';
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

/** Akun default — password dipakai HANYA saat seeding (di-hash ke MongoDB). */
export const DEFAULT_ADMIN = {
  id: 'admin-owner',
  username: 'owner',
  password: 'owner123',
  displayName: 'Owner',
  role: 'owner',
} as const;

// ── Password hashing (scrypt) ────────────────────────────────────────────────

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const candidate = scryptSync(String(password), String(salt), 64);
    const expected = Buffer.from(String(hash), 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

// ── Admin storage ────────────────────────────────────────────────────────────

async function adminsCol() {
  return getMongoCollection(COLLECTIONS.ADMINS);
}

function toAdminUser(row: WithId<Document>): AdminUser {
  return {
    id: String(row.id || row._id || ''),
    username: String(row.username || ''),
    displayName: String(row.displayName || row.username || 'Owner'),
    role: String(row.role || 'owner'),
  };
}

/** Pastikan akun admin default (owner/owner123) ada — idempotent, dipanggil saat boot/seed. */
export async function ensureDefaultAdmin(): Promise<boolean> {
  try {
    const col = await adminsCol();
    if (!col) return false;
    const existing = await col.findOne({
      $or: [{ username: DEFAULT_ADMIN.username }, { id: DEFAULT_ADMIN.id }],
    });
    if (existing) return true;

    const { hash, salt } = hashPassword(DEFAULT_ADMIN.password);
    const now = new Date().toISOString();
    await col.insertOne({
      id: DEFAULT_ADMIN.id,
      username: DEFAULT_ADMIN.username,
      passwordHash: hash,
      passwordSalt: salt,
      displayName: DEFAULT_ADMIN.displayName,
      role: DEFAULT_ADMIN.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  } catch {
    return false;
  }
}

/** Validasi username + password terhadap koleksi admins di MongoDB. */
export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ ok: boolean; user?: AdminUser; error?: string }> {
  try {
    const col = await adminsCol();
    if (!col) return { ok: false, error: 'Database tidak tersedia. Periksa koneksi MongoDB.' };

    const uname = String(username || '').trim();
    const row = await col.findOne({ username: uname });
    if (!row) return { ok: false, error: 'Username atau password salah.' };
    if (row.isActive === false) return { ok: false, error: 'Akun dinonaktifkan.' };

    if (
      !verifyPassword(
        String(password || ''),
        String(row.passwordHash || ''),
        String(row.passwordSalt || ''),
      )
    ) {
      return { ok: false, error: 'Username atau password salah.' };
    }

    return { ok: true, user: toAdminUser(row) };
  } catch {
    return { ok: false, error: 'Database tidak tersedia. Periksa koneksi MongoDB.' };
  }
}

// ── Sesi ─────────────────────────────────────────────────────────────────────

async function sessionsCol() {
  return getMongoCollection(COLLECTIONS.SESSIONS);
}

/** Buat sesi baru (disimpan di MongoDB, token acak). */
export async function createAdminSession(
  user: AdminUser,
): Promise<{ token: string; expiresAt: Date } | null> {
  try {
    const col = await sessionsCol();
    if (!col) return null;
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await col.insertOne({
      token,
      adminId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    return { token, expiresAt };
  } catch {
    return null;
  }
}

/** Ambil user dari token sesi (token harus valid & belum kedaluwarsa). */
export async function getSessionUser(
  token: string | undefined | null,
): Promise<AdminUser | null> {
  if (!token) return null;
  try {
    const col = await sessionsCol();
    if (!col) return null;
    const row = await col.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!row) return null;
    return {
      id: String(row.adminId || ''),
      username: String(row.username || ''),
      displayName: String(row.displayName || row.username || 'Owner'),
      role: String(row.role || 'owner'),
    };
  } catch {
    return null;
  }
}

/** Hapus sesi (logout). */
export async function deleteAdminSession(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    const col = await sessionsCol();
    if (!col) return false;
    await col.deleteMany({ token });
    return true;
  } catch {
    return false;
  }
}

/**
 * Cookie options untuk sesi admin.
 * `secure` dipilih dari protokol permintaan (https bila di belakang proxy/edge
 * seperti Vercel), sehingga login tetap bekerja lewat http (localhost/dev/next start).
 */
export function sessionCookieOptions(expiresAt: Date, secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    expires: expiresAt,
  };
}

/** Ambil token sesi dari header Cookie (objek Request generik). */
function getSessionToken(headers: Headers): string | null {
  const cookie = headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const pair = part.trim();
    if (pair.startsWith(`${SESSION_COOKIE}=`)) return pair.slice(SESSION_COOKIE.length + 1);
  }
  return null;
}

/**
 * Guard autentikasi untuk endpoint mutasi admin.
 * Mendukung 2 metode:
 * 1. Cookie `eb_session` (untuk web app)
 * 2. Header `Authorization: Bearer <jwt>` (untuk mobile app)
 *
 * Mengembalikan user bila valid, atau null (401).
 * GET/HEAD tetap terbuka — dipakai halaman publik (tracking, list layanan, dll).
 */
export async function requireAdminSession(req: { headers: Headers }): Promise<AdminUser | null> {
  // 1. Coba cookie session dulu (web)
  const cookieUser = await getSessionUser(getSessionToken(req.headers));
  if (cookieUser) return cookieUser;

  // 2. Fallback: JWT token dari header Authorization (mobile)
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const jwtPayload = await verifyJwt(token);
      if (jwtPayload) {
        return {
          id: String(jwtPayload.sub || ''),
          username: String(jwtPayload.username || ''),
          displayName: String(jwtPayload.displayName || jwtPayload.username || 'Owner'),
          role: String(jwtPayload.role || 'owner'),
        };
      }
    }
  }

  return null;
}

/** Deteksi apakah permintaan datang lewat HTTPS (mendukung x-forwarded-proto proxy). */
export function isSecureRequest(req: { headers: Headers; nextUrl?: { protocol?: string } }): boolean {
  const forwarded = req.headers.get('x-forwarded-proto') || '';
  if (forwarded.includes('https')) return true;
  return req?.nextUrl?.protocol === 'https:';
}