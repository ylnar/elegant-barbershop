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

  /** Display-friendly server URL */
  get displayUrl() {
    return `http://${this.host}:${this.port}`;
  },
};

// ── Supabase Config ──────────────────────────────────────────────────────────

export const supabaseConfig = {
  /** Supabase project URL (https://xxx.supabase.co) */
  url: env('SUPABASE_URL') || env('VITE_SUPABASE_URL'),

  /** Anon key (public, untuk client browser) */
  anonKey: env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY'),

  /** Service role key (server-side, full access) — HANYA di server */
  serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),

  /** Database password (hanya untuk migrasi CLI) */
  dbPassword: env('SUPABASE_DB_PASSWORD'),

  /**
   * PostgreSQL connection string untuk migration CLI.
   * Jika kosong, otomatis disusun dari dbPassword + host pattern.
   */
  get databaseUrl(): string {
    const explicit = env('DATABASE_URL');
    if (explicit) return explicit;

    // Auto-compose dari project ref
    if (this.dbPassword && this.url) {
      const host = this.url.replace('https://', 'db.');
      return `postgresql://postgres:${this.dbPassword}@${host.replace('.supabase.co', '')}.supabase.co:5432/postgres`;
    }

    return '';
  },

  /** Server-side client pakai service role key */
  get serverKey(): string {
    return this.serviceRoleKey || this.anonKey;
  },

  get isConfigured(): boolean {
    return Boolean(this.url && this.serverKey && this.url.startsWith('http'));
  },

  /** Deteksi detail masalah env Supabase untuk pesan error yang jelas */
  diagnose(): string[] {
    const issues: string[] = [];
    if (!this.url) {
      issues.push('SUPABASE_URL / VITE_SUPABASE_URL tidak terbaca oleh Functions');
    } else if (!this.url.startsWith('http')) {
      issues.push(`SUPABASE_URL tidak valid (harus diawali https://)`);
    }
    if (!this.serviceRoleKey) {
      issues.push(
        this.anonKey
          ? 'SUPABASE_SERVICE_ROLE_KEY tidak terbaca (yang terdeteksi hanya anon key)'
          : 'SUPABASE_SERVICE_ROLE_KEY & SUPABASE_ANON_KEY tidak terbaca',
      );
    }
    return issues.length > 0
      ? issues
      : ['Konfigurasi terbaca, namun kredensial ditolak — cek nilai di dashboard Vercel'];
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
  console.log(`│ 🗄️  Supabase  : ${(supabaseConfig.isConfigured ? '✅ Configured' : '⚠️  Not configured').padEnd(28)}│`);
  if (supabaseConfig.url) {
    console.log(`│    URL       : ${mask(supabaseConfig.url, 20).padEnd(28)}│`);
  }
  console.log(`│ 🤖 AI (Gemini): ${(aiConfig.isEnabled ? '✅ Enabled' : '⚠️  Disabled').padEnd(28)}│`);
  console.log(`│ 🔄 Auto-Migrate: ${(dbConfig.autoMigrate ? '✅ ON' : '❌ OFF').padEnd(28)}│`);
  console.log('└─────────────────────────────────────────────┘');
}
