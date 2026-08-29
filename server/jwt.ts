import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { serverConfig } from './config';

/**
 * server/jwt.ts
 * ──────────────
 * JWT helpers untuk autentikasi mobile app (Android).
 * Menggunakan library `jose` (Edge-compatible).
 */

export interface JwtPayload extends JWTPayload {
  sub: string;      // admin ID
  username: string;
  role: string;
  displayName: string;
}

const JWT_EXPIRY = '365d';

/** Masa tenggang (detik) untuk refresh: token tetap bisa ditukar dengan yang baru
 *  walau sudah kedaluwarsa, selama masih dalam 30 hari. */
const JWT_GRACE_SECONDS = 30 * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const secret = serverConfig.jwtSecret;
  if (!secret) {
    throw new Error('[JWT] JWT_SECRET belum dikonfigurasi di environment variables.');
  }
  return new TextEncoder().encode(secret);
}

/** Buat JWT token untuk admin yang berhasil login. */
export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('elegant-barbershop')
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

/** Verifikasi dan decode JWT token. Return null bila token invalid/expired. */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'elegant-barbershop',
    });
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Verifikasi JWT dengan masa tenggang kedaluwarsa.
 * Dipakai endpoint /api/auth/refresh agar app Android bisa menukar token yang
 * barusan kedaluwarsa (< 30 hari) dengan token baru — tanpa meminta password lagi.
 */
export async function verifyJwtAllowExpired(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'elegant-barbershop',
      clockTolerance: JWT_GRACE_SECONDS,
    });
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
