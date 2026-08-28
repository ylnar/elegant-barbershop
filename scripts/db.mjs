#!/usr/bin/env node
/**
 * ============================================================
 * ELEGANT BARBERSHOP SOLOK — MongoDB CLI
 * ============================================================
 * Kelola database MongoDB langsung dari terminal.
 * Tidak perlu buka MongoDB Compass / mongo shell lagi.
 *
 * Perintah:
 *   npm run db:setup -- "mongodb://localhost:27017/elegant_barbershop"
 *                      -- "mongodb+srv://user:pass@cluster.mongodb.net/elegant_barbershop"
 *   npm run db:status    Lihat koneksi, koleksi & jumlah dokumen
 *   npm run db:doctor    Diagnosa lengkap koneksi & database
 *   npm run db:seed      Isi data awal (idempotent) — alternatif auto-seed boot
 *   npm run db:reset -- --force   HAPUS semua koleksi & data (HATI-HATI!)
 * ============================================================
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import dns from 'node:dns';
import { MongoClient } from 'mongodb';
import { INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_SETTINGS, DEFAULT_ADMIN, hashPassword } from './seed-data.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ENV_FILE = path.join(ROOT, '.env');

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

const DEFAULT_URI = 'mongodb://localhost:27017/elegant_barbershop';

// Beberapa ISP/router menolak query DNS dari Node (padahal Windows DNS Client
// normal). Bila `mongodb+srv://` gagal resolusi, pakai public DNS.
const FALLBACK_DNS = ['8.8.8.8', '1.1.1.1'];
let dnsChecked = false;
async function ensureUsableDns() {
  if (dnsChecked) return;
  dnsChecked = true;
  const override = (process.env.MONGODB_DNS_SERVERS || '').trim();
  if (override) {
    dns.setServers(override.split(',').map((s) => s.trim()).filter(Boolean));
    return;
  }
  const uri = getUri();
  const m = uri.match(/^mongodb\+srv:\/\/([^/]+)/);
  if (!m) return;
  const host = m[1];
  const probe = () =>
    new Promise((resolve) => {
      const t = setTimeout(() => resolve(true), 2500);
      dns.resolveSrv(host, (err) => {
        clearTimeout(t);
        resolve(!!err);
      });
    });
  if (await probe()) {
    dns.setServers(FALLBACK_DNS);
    warn(`Resolver DNS default menolak query, memakai public DNS (${FALLBACK_DNS.join(', ')}).`);
  }
}

const COLLECTIONS = {
  settings: 'settings',
  services: 'services',
  barbers: 'barbers',
  bookings: 'bookings',
  transactions: 'transactions',
  customers: 'customers',
  admins: 'admins',
  sessions: 'sessions',
};

/** Mask URI: sembunyikan kredensial user/password */
function maskUri(uri) {
  try {
    const u = new URL(String(uri).replace('mongodb+srv://', 'mongodb://'));
    if (u.username) u.username = '****';
    if (u.password) u.password = '****';
    return String(u).replace(/^mongodb:\/\//, 'mongodb+srv://');
  } catch {
    return String(uri).slice(0, 14) + '****';
  }
}

function getUri() {
  const explicit = (process.env.MONGODB_URI || '').trim();
  return explicit || DEFAULT_URI;
}

function getDbName(uri) {
  const explicit = (process.env.MONGODB_DB_NAME || '').trim();
  if (explicit) return explicit;
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'mongodb://'));
    return (u.pathname.split('/')[1] || 'elegant_barbershop').split('?')[0];
  } catch {
    return 'elegant_barbershop';
  }
}

function updateEnvFile(key, value) {
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

async function withClient(fn) {
  await ensureUsableDns();
  const uri = getUri();
  const dbName = getDbName(uri);
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '8000', 10),
  });
  try {
    await client.connect();
    const db = client.db(dbName);
    info(`Koneksi : ${maskUri(uri)}`);
    info(`Database: ${dbName}`);
    return await fn({ client, db });
  } finally {
    await client.close().catch(() => {});
  }
}

/** Buat index yang dipakai aplikasi (paralel dengan server/mongodb.ts) */
async function ensureIndexes(db) {
  await db.collection(COLLECTIONS.services).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.services).createIndex({ category: 1 });
  await db.collection(COLLECTIONS.services).createIndex({ isDeleted: 1 });
  await db.collection(COLLECTIONS.barbers).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.barbers).createIndex({ isDeleted: 1 });
  await db.collection(COLLECTIONS.bookings).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.bookings).createIndex({ bookingCode: 1 }, { unique: true });
  await db.collection(COLLECTIONS.bookings).createIndex({ customerPhone: 1 });
  await db.collection(COLLECTIONS.bookings).createIndex({ date: 1, timeSlot: 1 });
  await db.collection(COLLECTIONS.bookings).createIndex({ status: 1 });
  await db.collection(COLLECTIONS.bookings).createIndex({ isDeleted: 1 });
  await db.collection(COLLECTIONS.transactions).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.transactions).createIndex({ invoiceNumber: 1 }, { unique: true });
  await db.collection(COLLECTIONS.transactions).createIndex({ createdAt: -1 });
  await db.collection(COLLECTIONS.transactions).createIndex({ paymentMethod: 1 });
  await db.collection(COLLECTIONS.transactions).createIndex({ isDeleted: 1 });
  await db.collection(COLLECTIONS.customers).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.customers).createIndex({ phone: 1 }, { unique: true });
  await db.collection(COLLECTIONS.customers).createIndex({ isDeleted: 1 });
  await db.collection(COLLECTIONS.admins).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.admins).createIndex({ username: 1 }, { unique: true });
  await db.collection(COLLECTIONS.admins).createIndex({ isActive: 1 });
  await db.collection(COLLECTIONS.sessions).createIndex({ token: 1 }, { unique: true });
  await db.collection(COLLECTIONS.sessions).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

/* ----------------------------- perintah ---------------------------- */

function usage() {
  log(`
${C.bold}Elegant Barbershop — MongoDB CLI${C.reset}

${C.cyan}Setup (sekali saja):${C.reset}
  Isi ${C.bold}MONGODB_URI${C.reset} di .env, atau:
  npm run db:setup -- "mongodb://localhost:27017/elegant_barbershop"
  npm run db:setup -- "mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/elegant_barbershop"

${C.cyan}Perintah:${C.reset}
  npm run db:status           Lihat koneksi, koleksi & jumlah dokumen
  npm run db:doctor           Diagnosa lengkap koneksi & database
  npm run db:seed             Isi data awal (idempotent)
  npm run db:reset -- --force   ${C.red}(HATI-HATI: hapus semua data!)${C.reset}
`);
}

async function cmdSetup(args) {
  const input = args.filter((a) => !a.startsWith('--')).join(' ').trim();
  if (!input) {
    fail('Cara pakai: npm run db:setup -- "mongodb://...atau mongodb+srv://..."');
    process.exitCode = 1;
    return;
  }
  if (!/^mongodb(\+srv)?:\/\//i.test(input)) {
    fail('Connection string harus diawali mongodb:// atau mongodb+srv://');
    process.exitCode = 1;
    return;
  }

  updateEnvFile('MONGODB_URI', input);
  ok('MONGODB_URI tersimpan ke .env');

  // Verifikasi koneksi sekarang juga.
  delete process.env.MONGODB_URI;
  process.env.MONGODB_URI = input;
  const uri = input;
  const dbName = getDbName(uri);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  process.stdout.write(`${C.cyan}→${C.reset} Menguji koneksi ... `);
  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    log(`${C.green}berhasil${C.reset}`);
    ok(`Terhubung ke database "${dbName}".`);
    log('');
    log(`${C.bold}Siap!${C.reset} Jalankan:  ${C.cyan}npm run dev${C.reset}  (auto-seed otomatis bila database kosong)`);
  } catch (err) {
    log(`${C.red}gagal${C.reset}`);
    fail(err.message);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

async function cmdStatus() {
  await withClient(async ({ db }) => {
    await ensureIndexes(db);
    log(`\n${C.bold}Status Database MongoDB${C.reset}\n`);

    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((n) => n.name);
    for (const key of Object.keys(COLLECTIONS)) {
      const name = COLLECTIONS[key];
      if (names.includes(name)) {
        const count = await db.collection(name).countDocuments();
        log(`  ${C.green}✔${C.reset} ${name.padEnd(14)} ${count} dokumen`);
      } else {
        log(`  ${C.yellow}○${C.reset} ${name.padEnd(14)} belum dibuat (dibuat otomatis saat dipakai)`);
      }
    }
    log('');
    ok('Koneksi MongoDB sehat.');
  });
}

async function cmdDoctor() {
  log(`\n${C.bold}🩺 Diagnosa Database Elegant Barbershop${C.reset}\n`);

  const uri = (process.env.MONGODB_URI || '').trim();
  const dbName = (process.env.MONGODB_DB_NAME || '').trim();
  const autoSeed = (process.env.MONGODB_AUTO_SEED ?? 'true').toLowerCase();
  log(`  MONGODB_URI          : ${uri ? C.green + maskUri(uri) + C.reset : C.yellow + 'kosong (memakai default localhost)' + C.reset}`);
  log(`  MONGODB_DB_NAME      : ${dbName ? C.green + dbName + C.reset : C.yellow + 'default (diambil dari URI)' + C.reset}`);
  log(`  MONGODB_AUTO_SEED    : ${autoSeed === 'false' ? C.yellow + 'nonaktif' + C.reset : C.green + 'aktif' + C.reset}`);

  log('');
  process.stdout.write('  Menguji koneksi end-to-end ... ');
  try {
    await withClient(async ({ db }) => {
      log(`${C.green}OK${C.reset}`);
      await ensureIndexes(db);
      const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((n) => n.name);
      log(`\n  Koleksi (${names.length}):`);
      for (const key of Object.keys(COLLECTIONS)) {
        const name = COLLECTIONS[key];
        log(`    - ${name}${names.includes(name) ? ` (${await db.collection(name).countDocuments()} dokumen)` : C.dim + ' (belum dibuat)' + C.reset}`);
      }
      log('');
      ok('Database siap digunakan.');
    });
  } catch (err) {
    log(`${C.red}gagal${C.reset}`);
    fail(err.message);
    warn('Pastikan MongoDB berjalan (local: mongod) atau periksa URI Atlas Anda.');
    process.exitCode = 1;
  }
}

async function cmdSeed() {
  await withClient(async ({ db }) => {
    await ensureIndexes(db);
    const now = new Date().toISOString();
    let seeded = false;

    const servicesCol = db.collection(COLLECTIONS.services);
    if ((await servicesCol.countDocuments()) === 0) {
      await servicesCol.insertMany(
        INITIAL_SERVICES.map((s) => ({ ...s, isDeleted: false, createdAt: now, updatedAt: now })),
        { ordered: false },
      );
      seeded = true;
      ok(`Seed ${servicesCol.collectionName}: ${INITIAL_SERVICES.length} layanan`);
    } else {
      info(`${COLLECTIONS.services} sudah terisi, dilewati.`);
    }

    const barbersCol = db.collection(COLLECTIONS.barbers);
    if ((await barbersCol.countDocuments()) === 0) {
      await barbersCol.insertMany(
        INITIAL_BARBERS.map((b) => ({ ...b, isDeleted: false, createdAt: now, updatedAt: now })),
        { ordered: false },
      );
      seeded = true;
      ok(`Seed ${barbersCol.collectionName}: ${INITIAL_BARBERS.length} barber`);
    } else {
      info(`${COLLECTIONS.barbers} sudah terisi, dilewati.`);
    }

    const settingsCol = db.collection(COLLECTIONS.settings);
    if ((await settingsCol.countDocuments()) === 0) {
      await settingsCol.insertOne({
        key: 'default_settings',
        ...INITIAL_SETTINGS,
        createdAt: now,
      });
      seeded = true;
      ok(`Seed ${settingsCol.collectionName}: pengaturan default`);
    } else {
      info(`${COLLECTIONS.settings} sudah terisi, dilewati.`);
    }

    const adminsCol = db.collection(COLLECTIONS.admins);
    const existingAdmin = await adminsCol.findOne({
      $or: [{ username: DEFAULT_ADMIN.username }, { id: DEFAULT_ADMIN.id }],
    });
    if (!existingAdmin) {
      const { hash, salt } = hashPassword(DEFAULT_ADMIN.password);
      await adminsCol.insertOne({
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
      seeded = true;
      ok(`Seed ${adminsCol.collectionName}: akun admin "${DEFAULT_ADMIN.username}" (role ${DEFAULT_ADMIN.role})`);
    } else {
      info(`${COLLECTIONS.admins} sudah ada akun "${DEFAULT_ADMIN.username}", dilewati.`);
    }

    log('');
    if (seeded) ok('Seed data awal berhasil. Jalankan npm run dev untuk memuat.');
    else ok('Tidak ada yang perlu di-seed (semua koleksi sudah berisi).');
  });
}

async function cmdReset(args) {
  if (!args.includes('--force')) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(
      `${C.red}PERINGATAN: Semua koleksi & data akan DIHAPUS permanen. Lanjutkan? (ketik YA):${C.reset} `,
    );
    rl.close();
    if (answer.trim().toUpperCase() !== 'YA') {
      warn('Dibatalkan.');
      return;
    }
  }
  await withClient(async ({ db }) => {
    for (const key of Object.keys(COLLECTIONS)) {
      const name = COLLECTIONS[key];
      try {
        await db.collection(name).drop();
        info(`${name} dihapus.`);
      } catch {
        // koleksi belum ada — skip
      }
    }
  });
  log('');
  ok('Semua koleksi dihapus. Jalankan seed (npm run db:seed) atau boot server untuk mengisi ulang.');
}

/* ------------------------------- main ------------------------------ */

const [cmd = 'status', ...rest] = process.argv.slice(2);

try {
  switch (cmd) {
    case 'setup': await cmdSetup(rest); break;
    case 'status': await cmdStatus(); break;
    case 'doctor': await cmdDoctor(); break;
    case 'seed': await cmdSeed(); break;
    case 'reset': await cmdReset(rest); break;
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