/**
 * ============================================================
 * db-lib.mjs — Inti logika database Elegant Barbershop Solok
 * ============================================================
 * Dipakai oleh CLI (scripts/db.mjs) dan auto-migrate saat server
 * start (server/dbAutoMigrate.ts). Tanpa side-effect saat import.
 *
 * Urutan resolusi koneksi:
 *   1. DATABASE_URL / SUPABASE_DB_URL di .env (instan)
 *   2. SUPABASE_DB_PASSWORD + project ref dari SUPABASE_URL
 *      -> deteksi otomatis host pooler/direct (TCP probe paralel)
 *      -> verifikasi autentikasi
 *      -> hasil DISIMPAN otomatis ke DATABASE_URL di .env
 *         sehingga boot berikutnya tidak perlu probe lagi.
 * ============================================================
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { Client } from 'pg';

const ROOT = process.env.PROJECT_ROOT || process.cwd();
export const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');
const ENV_FILE = path.join(ROOT, '.env');
const MIGRATIONS_TABLE = 'app_migrations';

const POOLER_PREFIXES = ['aws-0', 'aws-1', 'aws-2', 'aws-3'];
const POOLER_REGIONS = [
  'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'ap-east-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-central-1', 'eu-central-2',
  'ca-central-1', 'sa-east-1',
];

/* ---------------------------- util dasar --------------------------- */

export function maskUrl(url) {
  return String(url).replace(/:\/\/([^:/@]+):([^@]+)@/, '://$1:****@');
}

export function getProjectRef() {
  const projectUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  return (projectUrl.match(/https:\/\/([a-z0-9]{10,})\.supabase\.co/i) || [])[1] || null;
}

export function getDbPassword() {
  const pw = process.env.SUPABASE_DB_PASSWORD;
  return pw && pw.trim() ? pw.trim() : null;
}

/** Perbarui satu baris KEY="value" di file .env tanpa merusak isi lain. */
export function updateEnvFile(key, value) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const line = `${key}="${value}"`;
  const re = new RegExp(`^(\\s*${key}\\s*=).*$`, 'm');
  if (re.test(content)) {
    content = content.replace(re, `$1"${value}"`);
  } else {
    if (content && !content.endsWith('\n')) content += '\n';
    content += `${line}\n`;
  }
  fs.writeFileSync(ENV_FILE, content);
}

/* -------------------------- deteksi host --------------------------- */

function tcpProbe(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish({ host, ok: true, ms: Date.now() - startedAt }));
    socket.once('timeout', () => finish({ host, ok: false, err: 'timeout' }));
    socket.once('error', (e) => finish({ host, ok: false, err: e.code || String(e.message) }));
    const startedAt = Date.now();
    socket.connect(port, host);
  });
}

async function probeAll(hosts, port, chunkSize = 12) {
  const results = [];
  for (let i = 0; i < hosts.length; i += chunkSize) {
    const chunk = hosts.slice(i, i + chunkSize);
    const settled = await Promise.all(chunk.map((h) => tcpProbe(h, port)));
    results.push(...settled.filter((r) => r.ok));
    if (results.length > 0 && i + chunkSize < hosts.length) {
      // Ada kandidat yang merespons — cukup, jangan buang waktu.
      break;
    }
  }
  return results;
}

function buildCandidateUrls(ref, password) {
  const encPw = encodeURIComponent(password);
  const urls = [];
  // 1. Koneksi langsung (butuh IPv6 / jaringan yang mendukung)
  urls.push({
    label: 'direct',
    host: `db.${ref}.supabase.co`,
    url: `postgresql://postgres:${encPw}@db.${ref}.supabase.co:5432/postgres`,
  });
  // 2. Pooler session mode (IPv4, paling kompatibel)
  for (const prefix of POOLER_PREFIXES) {
    for (const region of POOLER_REGIONS) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      urls.push({
        label: `pooler ${prefix}-${region}`,
        host,
        url: `postgresql://postgres.${ref}:${encPw}@${host}:5432/postgres`,
      });
    }
  }
  return urls;
}

async function verifyAuth(url) {
  const parsed = new URL(url);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  const client = new Client({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    statement_timeout: 8000,
  });
  await client.connect();
  try {
    await client.query('SELECT 1;');
    return true;
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * Resolusi koneksi database.
 * @returns {{ url: string, source: string }} atau null bila tidak cukup data.
 */
export async function resolveConnection({ persist = true, logger = () => {} } = {}) {
  const directEnv = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (directEnv && directEnv.trim()) {
    return { url: directEnv.trim(), source: 'DATABASE_URL (.env)' };
  }

  const password = getDbPassword();
  const ref = getProjectRef();
  if (!password || !ref) return null;

  logger(`Mendeteksi host database untuk project ${ref} (sekali saja, lalu disimpan)...`);
  const candidates = buildCandidateUrls(ref, password);

  // Tahap 1: TCP probe semua host unik secara paralel.
  const uniqueHosts = [...new Map(candidates.map((c) => [c.host, c.host])).values()];
  const reachable = await probeAll(uniqueHosts, 5432);
  if (reachable.length === 0) {
    throw new Error(
      'Tidak ada host database Supabase yang bisa dijangkau dari jaringan ini. Periksa koneksi internet/firewall Anda.'
    );
  }
  const reachableSet = new Set(reachable.map((r) => r.host));
  logger(`${reachableSet.size} host ditemukan. Menguji autentikasi...`);

  // Tahap 2: urutkan kandidat yang reachable, uji autentikasi satu per satu.
  const ordered = candidates.filter((c) => reachableSet.has(c.host));
  for (const candidate of ordered) {
    try {
      await verifyAuth(candidate.url);
      logger(`Koneksi berhasil via ${candidate.label}.`);
      if (persist) {
        updateEnvFile('DATABASE_URL', candidate.url);
        logger('Connection string disimpan ke DATABASE_URL di .env (boot berikutnya instan).');
      }
      return { url: candidate.url, source: `auto-detected (${candidate.label})` };
    } catch {
      // Coba kandidat berikutnya.
    }
  }
  throw new Error(
    'Host terjangkau namun autentikasi gagal. Pastikan SUPABASE_DB_PASSWORD benar (Project Settings > Database > Database password).'
  );
}

/* ----------------------------- migrasi ----------------------------- */

export function listMigrationFiles() {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort();
}

export function createClientFromUrl(url) {
  const parsed = new URL(url);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  return new Client({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

export async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);
}

export async function getApplied(client) {
  const { rows } = await client.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name;`);
  return rows.map((r) => r.name);
}

export async function applyOne(client, file, { logger = () => {} } = {}) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  logger(`→ Menerapkan ${file} ...`);
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1);`, [file]);
    await client.query('COMMIT');
    logger(`✔ ${file} berhasil.`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger(`✖ ${file} GAGAL: ${err.message}`);
    return false;
  }
}

/**
 * Terapkan semua migrasi pending. Melempar Error dengan pesan ramah
 * bila koneksi tidak bisa dibentuk.
 */
export async function migratePending({ logger = () => {} } = {}) {
  const resolved = await resolveConnection({ logger });
  if (!resolved) {
    throw new Error(
      'Koneksi database belum ada. Isi SUPABASE_DB_PASSWORD di .env (atau jalankan npm run db:setup -- PASSWORD).'
    );
  }
  logger(`Koneksi: ${maskUrl(resolved.url)} [${resolved.source}]`);

  const client = createClientFromUrl(resolved.url);
  await client.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    const files = listMigrationFiles();
    const pending = files.filter((f) => !applied.includes(f));

    if (pending.length === 0) {
      logger(`Database sudah mutakhir (${applied.length} migrasi diterapkan).`);
      return { applied: [], skipped: applied.length };
    }

    logger(`Menjalankan ${pending.length} migrasi...`);
    const done = [];
    for (const file of pending) {
      const success = await applyOne(client, file, { logger });
      if (!success) {
        throw new Error(`Berhenti di ${file}. Perbaiki lalu jalankan ulang migrasi.`);
      }
      done.push(file);
    }
    return { applied: done, skipped: applied.length };
  } finally {
    await client.end().catch(() => {});
  }
}
