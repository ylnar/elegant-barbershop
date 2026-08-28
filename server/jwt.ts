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

const JWT_EXPIRY = '24h';

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
