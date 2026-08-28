/**
 * server/config.ts
 * ────────────────
 * Sentralisasi seluruh konfigurasi server dalam satu tempat.
 * Setiap env var dibaca, divalidasi, dan diekspor sebagai object typed.
 * Jika ada yang missing tapi kritis, server akan throw saat boot.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Ambil env var dengan default; throw jika required=true dan kosong */
function env(
  key: string,
  opts: { required?: boolean; default?: string; mask?: boolean } = {},
): string {
  let val = process.env[key]?.trim() ?? '';
  // Tahan salah paste di dashboard (nilai dibungkus kutip literal)
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  if (!val && opts.required) {
    throw new Error(
      `[Config] Env var "${key}" wajib diisi. Lihat .env.example atau dokumentasi.`,
    );
  }
  return val || (opts.default ?? '');
}

/** Parse env ke number; throw jika required dan kosong/NaN */
function envInt(
  key: string,
  opts: { required?: boolean; default?: number } = {},
): number {
  const raw = env(key, { required: opts.required });
  const num = parseInt(raw, 10);
  if (isNaN(num)) {
    if (opts.required) {
      throw new Error(`[Config] Env var "${key}" harus berupa angka integer.`);
    }
    return opts.default ?? 0;
  }
  return num;
}

/** Parse env ke boolean (true/false/1/0) */
function envBool(key: string, defaultValue = false): boolean {
  const raw = env(key).toLowerCase();
  if (!raw) return defaultValue;
  return raw === 'true' || raw === '1' || raw === 'on';
}

// ── JWT Config ─────────────────────────────────────────────────────────────

export const jwtConfig = {
  /** Secret key untuk sign/verify JWT token (mobile auth) */
  secret: env('JWT_SECRET', { default: 'elegant-barbershop-jwt-secret-change-in-production' }),
};

// ── Server Config ────────────────────────────────────────────────────────────

export const serverConfig = {
  /** Port HTTP server */
  port: envInt('PORT', { default: 3000 }),

  /**
   * Host bind address.
   * - "0.0.0.0" → listen semua interface (cocok untuk Docker/VM)
   * - "localhost" → hanya local (aman untuk dev)
   * - "127.0.0.1" → hanya loopback
   *
   * Default: "localhost" supaya browser bisa akses http://localhost:3000
   */
  host: env('HOST', { default: 'localhost' }),

  /** Node environment: development | production | test */
  nodeEnv: env('NODE_ENV', { default: 'development' }),

  /** App base URL (untuk CORS, redirect, dll) */
  appUrl: env('APP_URL', { default: 'http://localhost:3000' }),

  get isProduction() {
    return this.nodeEnv === 'production';
  },

  get isDevelopment() {
    return this.nodeEnv !== 'production';
  },

  /** JWT secret untuk mobile auth */
  get jwtSecret(): string {
    return jwtConfig.secret;
  },

  /** Display-friendly server URL */
  get displayUrl() {
    return `http://${this.host}:${this.port}`;
  },
};

// ── MongoDB Config ───────────────────────────────────────────────────────────

export const mongoConfig = {
  /**
   * MongoDB connection string.
   * Contoh:
   *   - Local:  mongodb://localhost:27017/elegant_barbershop
   *   - Atlas:  mongodb+srv://user:pass@cluster.mongodb.net/elegant_barbershop
   */
  uri: env('MONGODB_URI', {
    default: 'mongodb://localhost:27017/elegant_barbershop',
  }),

  /** Nama database MongoDB */
  dbName: env('MONGODB_DB_NAME', {
    default: env('MONGODB_URI').split('/').pop()?.split('?')[0] || 'elegant_barbershop',
  }),

  /** Timeout koneksi (ms) */
  connectTimeoutMs: envInt('MONGODB_CONNECT_TIMEOUT_MS', {
    default: 10000,
  }),

  /** Jalankan seed data awal otomatis saat server boot (hanya jika database kosong) */
  autoSeed: envBool('MONGODB_AUTO_SEED', true),

  get isConfigured(): boolean {
    return Boolean(
      this.uri &&
        (this.uri.startsWith('mongodb://') || this.uri.startsWith('mongodb+srv://')),
    );
  },

  /** Deteksi masalah env MongoDB untuk pesan error yang jelas */
  diagnose(): string[] {
    const issues: string[] = [];
    if (!this.uri) {
      issues.push('MONGODB_URI belum diisi di .env');
    } else if (!this.isConfigured) {
      issues.push(
        'MONGODB_URI tidak valid (harus diawali mongodb:// atau mongodb+srv://)',
      );
    }
    return issues;
  },
};

// ── Database Migration Config ────────────────────────────────────────────────

export const dbConfig = {
  /** Jalankan auto-migrate saat server boot */
  autoMigrate: envBool('DB_AUTO_MIGRATE', true),
};

// ── Gemini AI Config ─────────────────────────────────────────────────────────

export const aiConfig = {
  /** Google Gemini API key */
  apiKey: env('GEMINI_API_KEY'),

  /** Model name */
  model: env('GEMINI_MODEL', { default: 'gemini-3.7-flash' }),

  get isEnabled(): boolean {
    return Boolean(this.apiKey);
  },
};

// ── Rate Limiting Config ─────────────────────────────────────────────────────

export const rateLimitConfig = {
  /** Default max requests per window */
  maxRequests: envInt('RATE_LIMIT_MAX', { default: 60 }),

  /** Window size in ms */
  windowMs: envInt('RATE_LIMIT_WINDOW_MS', { default: 60000 }),
};

// ── Security Config ──────────────────────────────────────────────────────────

export const securityConfig = {
  /** Trusted proxy count (reverse proxy) */
  trustProxy: envInt('TRUST_PROXY', { default: 0 }),

  /** CORS origins (comma-separated) */
  corsOrigins: env('CORS_ORIGINS', { default: '' })
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

// ── Boot summary ─────────────────────────────────────────────────────────────

export function printConfigSummary(): void {
  const mask = (s: string, show = 6) =>
    s.length > show ? s.slice(0, show) + '****' : s;

  console.log('┌─────────────────────────────────────────────┐');
  console.log('│           📋 CONFIG SUMMARY                 │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│ 🌐 Server    : ${serverConfig.displayUrl.padEnd(28)}│`);
  console.log(`│ 🔧 Env       : ${serverConfig.nodeEnv.padEnd(28)}│`);
  console.log(`│ 🗄️  MongoDB   : ${(mongoConfig.isConfigured ? '✅ Configured' : '⚠️  Not configured').padEnd(28)}│`);
  if (mongoConfig.uri) {
    console.log(`│    URI       : ${mask(mongoConfig.uri, 20).padEnd(28)}│`);
  }
  console.log(`│ 🤖 AI (Gemini): ${(aiConfig.isEnabled ? '✅ Enabled' : '⚠️  Disabled').padEnd(28)}│`);
  console.log(`│ 🔄 Auto-Seed  : ${(mongoConfig.autoSeed ? '✅ ON' : '❌ OFF').padEnd(28)}│`);
  console.log('└─────────────────────────────────────────────┘');
}
