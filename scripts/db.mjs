#!/usr/bin/env node
/**
 * ============================================================
 * ELEGANT BARBERSHOP SOLOK — Database CLI
 * ============================================================
 * Kelola database Supabase langsung dari terminal.
 * Tidak perlu buka Supabase Dashboard / SQL Editor lagi.
 *
 * Setup sekali saja (pilih salah satu):
 *   1. Isi SUPABASE_DB_PASSWORD="..." di file .env, selesai.
 *   2. npm run db:setup -- PASSWORD_DATABASE_ANDA
 *
 * Perintah:
 *   npm run db:migrate   Terapkan migrasi pending (+ seed data awal)
 *   npm run db:status    Lihat status migrasi (applied/pending)
 *   npm run db:doctor    Diagnosa lengkap koneksi & database
 *   npm run db:seed      Isi ulang data awal (idempotent)
 *   npm run db:reset     HAPUS semua tabel & migrasi ulang (--force)
 *   npm run db:sql       Jalankan SQL bebas
 *   npm run db:new       Buat file migrasi baru bertimestamp
 *
 * Catatan: `npm run dev` juga otomatis menjalankan migrasi pending
 * (matikan dengan DB_AUTO_MIGRATE="false" di .env).
 * ============================================================
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import {
  MIGRATIONS_DIR,
  maskUrl,
  getProjectRef,
  getDbPassword,
  updateEnvFile,
  resolveConnection,
  listMigrationFiles,
  createClientFromUrl,
  ensureMigrationsTable,
  getApplied,
  applyOne,
} from './db-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT, '.env');
const SEED_FILE = '0002_seed_data.sql';

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = (...a) => console.log(...a);
const ok = (msg) => log(`${C.green}✔${C.reset} ${msg}`);
const warn = (msg) => log(`${C.yellow}!${C.reset} ${msg}`);
const fail = (msg) => log(`${C.red}✖ ${msg}${C.reset}`);
const info = (msg) => log(`${C.dim}${msg}${C.reset}`);

function usage() {
  log(`
${C.bold}Elegant Barbershop — Database CLI${C.reset}

${C.cyan}Setup (sekali saja):${C.reset}
  Isi ${C.bold}SUPABASE_DB_PASSWORD${C.reset} di .env, atau:
  npm run db:setup -- PASSWORD_DATABASE_ANDA

${C.cyan}Perintah:${C.reset}
  npm run db:migrate          Buat tabel/fungsi/RLS + data awal otomatis
  npm run db:status           Lihat migrasi yang sudah/pending
  npm run db:doctor           Diagnosa koneksi & database
  npm run db:seed             Isi ulang data awal (idempotent)
  npm run db:sql -- "SELECT count(*) FROM bookings"
  npm run db:new -- nama_perubahan
  npm run db:reset -- --force   ${C.red}(HATI-HATI: hapus semua data!)${C.reset}
`);
}

/* --------------------------- withClient ---------------------------- */

async function withClient(fn) {
  let resolved;
  try {
    resolved = await resolveConnection({ logger: info });
  } catch (err) {
    fail(err.message);
    process.exitCode = 1;
    return;
  }
  if (!resolved) {
    fail('Koneksi database belum dikonfigurasi.');
    log('');
    warn(`Isi ${C.bold}SUPABASE_DB_PASSWORD${C.reset} di .env (password ada di Supabase Dashboard > Project Settings > Database),`);
    log(`   atau jalankan: ${C.bold}npm run db:setup -- PASSWORD_ANDA${C.reset}`);
    process.exitCode = 1;
    return;
  }
  info(`Koneksi: ${maskUrl(resolved.url)} [${resolved.source}]`);
  const client = createClientFromUrl(resolved.url);
  await client.connect();
  try {
    await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

/* ----------------------------- perintah ---------------------------- */

async function cmdSetup(args) {
  const input = args.filter((a) => !a.startsWith('--')).join(' ').trim();
  if (!input) {
    fail('Cara pakai: npm run db:setup -- PASSWORD_ANDA');
    log('  atau:       npm run db:setup -- "postgresql://postgres.xxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"');
    process.exitCode = 1;
    return;
  }

  if (/^postgres(ql)?:\/\//i.test(input)) {
    // URI utuh: simpan sebagai DATABASE_URL dan bersihkan password terpisah.
    updateEnvFile('DATABASE_URL', input);
    ok('DATABASE_URL tersimpan ke .env');
  } else {
    updateEnvFile('SUPABASE_DB_PASSWORD', input);
    ok('SUPABASE_DB_PASSWORD tersimpan ke .env');
    const ref = getProjectRef();
    if (!ref) {
      warn('SUPABASE_URL tidak dikenali di .env — tidak bisa deteksi host otomatis.');
      process.exitCode = 1;
      return;
    }
  }

  // Deteksi + verifikasi koneksi sekarang juga.
  delete process.env.DATABASE_URL;
  delete process.env.SUPABASE_DB_URL;
  process.env.SUPABASE_DB_PASSWORD = /^postgres(ql)?:\/\//i.test(input) ? '' : input;

  try {
    const resolved = await resolveConnection({ logger: info });
    if (resolved) {
      await verifyOrExit(resolved.url);
    }
  } catch (err) {
    fail(err.message);
    warn('Perbaiki lalu jalankan ulang: npm run db:setup -- PASSWORD_ANDA');
    process.exitCode = 1;
  }
}

async function verifyOrExit(url) {
  const client = createClientFromUrl(url);
  process.stdout.write(`${C.cyan}→${C.reset} Menguji koneksi ... `);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT version() AS v;');
    log(`${C.green}berhasil${C.reset}`);
    ok(rows[0].v.split(',')[0]);
    log('');
    log(`${C.bold}Siap!${C.reset} Sekarang jalankan:  ${C.cyan}npm run db:migrate${C.reset}`);
  } catch (err) {
    log(`${C.red}gagal${C.reset}`);
    fail(err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

async function cmdMigrate() {
  try {
    const { applied, skipped } = await import('./db-lib.mjs').then((m) =>
      m.migratePending({ logger: (m) => log(m) })
    );
    if (applied.length === 0) {
      ok(`Database sudah mutakhir (${skipped} migrasi diterapkan). Tidak ada yang perlu dilakukan.`);
    } else {
      log('');
      ok(`Semua migrasi berhasil diterapkan (${applied.length} baru, total ${applied.length + skipped}). Database siap dipakai!`);
    }
  } catch (err) {
    fail(err.message);
    process.exitCode = 1;
  }
}

async function cmdStatus() {
  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    const files = listMigrationFiles();

    log(`\n${C.bold}Status Migrasi${C.reset}\n`);
    for (const f of files) {
      const isApplied = applied.includes(f);
      const mark = isApplied ? `${C.green}✔ applied${C.reset}` : `${C.yellow}○ pending${C.reset}`;
      log(`  ${mark}  ${f}`);
    }
    for (const m of applied.filter((a) => !files.includes(a))) {
      log(`  ${C.dim}? tercatat tapi filenya hilang: ${m}${C.reset}`);
    }
    const pendingCount = files.filter((f) => !applied.includes(f)).length;
    log('');
    if (pendingCount > 0) {
      warn(`${pendingCount} migrasi pending. Jalankan: npm run db:migrate`);
    } else {
      ok('Semua migrasi sudah diterapkan.');
    }
  });
}

async function cmdDoctor() {
  log(`\n${C.bold}🩺 Diagnosa Database Elegant Barbershop${C.reset}\n`);

  // 1. Environment
  const ref = getProjectRef();
  const hasPassword = Boolean(getDbPassword());
  const hasDirectUrl = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);
  const autoMigrate = (process.env.DB_AUTO_MIGRATE ?? 'true').toLowerCase();
  log(`  Project ref        : ${ref ? C.green + ref + C.reset : C.red + 'tidak ditemukan (cek SUPABASE_URL)' + C.reset}`);
  log(`  DATABASE_URL       : ${hasDirectUrl ? C.green + 'terisi' + C.reset : C.yellow + 'kosong (akan disusun otomatis)' + C.reset}`);
  log(`  SUPABASE_DB_PASSWORD: ${hasPassword ? C.green + 'terisi' + C.reset : C.red + 'kosong' + C.reset}`);
  log(`  Auto-migrate (dev) : ${autoMigrate === 'false' ? C.yellow + 'nonaktif' + C.reset : C.green + 'aktif' + C.reset}`);

  // 2. File migrasi
  const files = listMigrationFiles();
  log(`\n  File migrasi (${files.length}):`);
  for (const f of files) log(`    - ${f}`);

  // 3. Koneksi end-to-end
  log('');
  try {
    const resolved = await resolveConnection({ logger: info });
    if (!resolved) {
      fail('Koneksi belum bisa dibentuk: isi SUPABASE_DB_PASSWORD di .env.');
      process.exitCode = 1;
      return;
    }
    process.stdout.write('  Menguji koneksi end-to-end ... ');
    const client = createClientFromUrl(resolved.url);
    await client.connect();
    log(`${C.green}OK${C.reset}`);

    // 4. Isi database
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    const pending = files.filter((f) => !applied.includes(f));
    const { rows: tbl } = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `);
    log(`\n  Tabel public       : ${tbl.map((r) => r.tablename).join(', ') || C.red + '(belum ada)' + C.reset}`);
    log(`  Migrasi diterapkan : ${applied.length}, pending: ${pending.length}`);
    if (pending.length > 0) warn(`Jalankan npm run db:migrate untuk menerapkan ${pending.length} migrasi pending.`);
    else ok('Database siap digunakan.');
    await client.end();
  } catch (err) {
    fail(err.message);
    process.exitCode = 1;
  }
}

async function cmdSeed() {
  await withClient(async (client) => {
    const seedPath = path.join(MIGRATIONS_DIR, SEED_FILE);
    if (!fs.existsSync(seedPath)) {
      fail(`File seed tidak ditemukan: supabase/migrations/${SEED_FILE}`);
      process.exitCode = 1;
      return;
    }
    const sql = fs.readFileSync(seedPath, 'utf8');
    process.stdout.write(`${C.cyan}→${C.reset} Menjalankan ${C.bold}${SEED_FILE}${C.reset} ... `);
    try {
      await client.query(sql);
      log(`${C.green}berhasil${C.reset}`);
      ok('Data awal (kategori, pricelist, barber, sampel) sudah terisi.');
    } catch (err) {
      log(`${C.red}gagal${C.reset}`);
      fail(err.message);
      process.exitCode = 1;
    }
  });
}

async function cmdReset(args) {
  if (!args.includes('--force')) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(
      `${C.red}PERINGATAN: Semua tabel & data akan DIHAPUS permanen. Lanjutkan? (ketik YA):${C.reset} `
    );
    rl.close();
    if (answer.trim().toUpperCase() !== 'YA') {
      warn('Dibatalkan.');
      return;
    }
  }
  await withClient(async (client) => {
    process.stdout.write(`${C.cyan}→${C.reset} Menghapus skema public ... `);
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL ON SCHEMA public TO postgres, service_role;
    `);
    log(`${C.green}berhasil${C.reset}`);
  });
  if (process.exitCode) return;
  log('');
  await cmdMigrate();
}

async function cmdSql(args) {
  const query = args.join(' ').trim();
  if (!query) {
    fail('Cara pakai: npm run db:sql -- "SELECT * FROM services LIMIT 5;"');
    process.exitCode = 1;
    return;
  }
  await withClient(async (client) => {
    const result = await client.query(query);
    if (result.rows && result.rows.length > 0) {
      console.table(result.rows);
    } else {
      ok(`Query OK. Baris terpengaruh: ${result.rowCount ?? 0}`);
    }
  });
}

async function cmdNew(args) {
  const raw = args.filter((a) => !a.startsWith('--')).join('_').trim();
  const slug = (raw || 'perubahan_baru').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  const file = `${stamp}_${slug}.sql`;
  const full = path.join(MIGRATIONS_DIR, file);
  if (fs.existsSync(full)) {
    fail(`File sudah ada: ${file}`);
    process.exitCode = 1;
    return;
  }
  fs.writeFileSync(
    full,
    `-- Migrasi: ${slug}\n-- Dibuat: ${new Date().toISOString()}\n-- Tulis SQL Anda di bawah ini.\n\n`
  );
  ok(`Migrasi baru dibuat: supabase/migrations/${file}`);
  log(`  Edit file tersebut lalu jalankan ${C.cyan}npm run db:migrate${C.reset}`);
}

/* ------------------------------- main ------------------------------ */

const [cmd = 'migrate', ...rest] = process.argv.slice(2);

try {
  switch (cmd) {
    case 'setup': await cmdSetup(rest); break;
    case 'migrate': await cmdMigrate(); break;
    case 'status': await cmdStatus(); break;
    case 'doctor': await cmdDoctor(); break;
    case 'seed': await cmdSeed(); break;
    case 'reset': await cmdReset(rest); break;
    case 'sql': await cmdSql(rest); break;
    case 'new': await cmdNew(rest); break;
    case 'help':
    case '--help':
    case '-h': usage(); break;
    default:
      fail(`Perintah tidak dikenal: ${cmd}`);
      usage();
      process.exitCode = 1;
  }
} catch (err) {
  fail(err.message);
  process.exitCode = 1;
}
