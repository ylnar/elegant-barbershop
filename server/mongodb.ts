import { MongoClient, Db, Collection, Document } from 'mongodb';
import dns from 'node:dns';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { mongoConfig } from './config';

const execFileAsync = promisify(execFile);

// ── Connections ──────────────────────────────────────────────────────────────

type MongoRuntime = {
  client: MongoClient;
  db: Db;
};

let runtime: MongoRuntime | null = null;
let lastUri = '';
let lastDbName = '';

// Cache: URI `mongodb://` hasil resolusi SRV (dipakai bila resolver DNS in-process
// ditolak router/ISP — lihat resolveSrvViaChild).
let resolvedSrvUri: string | null = null;

// Circuit breaker: setelah koneksi gagal, operasi berikutnya diabaikan cepat
// dalam window ini agar path fallback in-memory tidak menunggu serverSelectionTimeout.
let lastFailAt = 0;
const FAIL_WINDOW_MS = 20_000;

// Health-check: koneksi pooled dapat mati diam-diam setelah itu (serverless /
// instance tidur / idle pool). Bila runtime sudah lama tidak terpakai, ping dulu
// sebelum dipakai; bila mati, koneksi dibangun ulang secara transparan.
let lastGoodAt = 0;
const IDLE_RECHECK_MS = 20_000;
const PING_TIMEOUT_MS = 2500;

async function pingRuntime(r: MongoRuntime): Promise<boolean> {
  try {
    await Promise.race([
      r.db.command({ ping: 1 }),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('MongoDB ping timeout')), PING_TIMEOUT_MS),
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

// Beberapa ISP/router menolak query DNS dari aplikasi (bukan dari Windows DNS
// Client). Akibatnya `mongodb+srv://...` gagal dengan ECONNREFUSED padahal
// server Atlas normal. Solusi: probe resolver default sekali, lalu fallback ke
// public DNS bila ditolak. Bisa dipaksa lewat variabel MONGODB_DNS_SERVERS.
const fallbackDnsServers = ['8.8.8.8', '1.1.1.1'];

function probeDns(host: string, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    dns.resolveSrv(host, (err) => {
      clearTimeout(timer);
      resolve(!err);
    });
  });
}

/** Temukan script resolve-srv.mjs relatif terhadap cwd / module. */
function resolveSrvScriptPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'scripts', 'resolve-srv.mjs'),
    path.join(__dirname, '..', 'scripts', 'resolve-srv.mjs'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

/**
 * Resolusi SRV lewat child process (scripts/resolve-srv.mjs).
 * Beberapa router menolak `dns.promises.resolve` dari dalam proses server
 * (c-ares), padahal child process baru dengan public DNS fallback berhasil.
 * Hasilnya di-cache sebagai URI `mongodb://` non-SRV yang memakai dns.lookup
 * (getaddrinfo Windows) yang terbukti normal.
 */
export async function resolveSrvViaChild(
  srvUri: string,
): Promise<string | null> {
  const script = resolveSrvScriptPath();
  const srvMatch = srvUri.match(/^mongodb\+srv:\/\/([^/]+)(.*)$/);
  if (!script || !srvMatch) return null;

  const [, authHost, rest] = srvMatch;
  const hostOnly = authHost.split('@').pop() ?? authHost;
  try {
    const { stdout } = await execFileAsync(process.execPath, [script, hostOnly], {
      timeout: 15_000,
      windowsHide: true,
    });
    const parsed = JSON.parse(stdout);
    if (!parsed.hosts?.length) return null;

    const params: Record<string, string> = {};
    new URLSearchParams(parsed.txt || '').forEach((v, k) => {
      if (k) params[k] = v;
    });
    const replicaSet = params.replicaSet;
    const authSource = params.authSource || 'admin';

    const query = new URLSearchParams();
    const split = (rest || '').split('?');
    const baseQuery = new URLSearchParams(split[1] || '');
    baseQuery.forEach((v, k) => query.set(k, v)); // pertahankan opsi asli (appName, dll.)
    query.set('ssl', 'true');
    query.set('authSource', authSource);
    if (replicaSet) query.set('replicaSet', replicaSet);

    const hostList = parsed.hosts.join(',');
    return `mongodb://${authHost.split('@')[0]}@${hostList}/elegant_barbershop?${query.toString()}`;
  } catch {
    return null;
  }
}

/**
 * Pastikan DNS yang dipakai Node bisa me-resolve host SRV MongoDB.
 * @param uri URI koneksi MongoDB
 * @returns true bila resolver in-process layak (probe sukses / bukan SRV).
 *          false bila dipastikan ditolak — pemanggil harus pakai jalur
 *          resolveSrvViaChild (child process).
 */
async function ensureUsableDns(uri: string): Promise<boolean> {
  try {
    const override = process.env.MONGODB_DNS_SERVERS;
    if (override) {
      dns.setServers(override.split(',').map((s) => s.trim()).filter(Boolean));
      return false;
    }

    const srvMatch = uri.match(/^mongodb\+srv:\/\/([^/]+)/);
    if (!srvMatch) return true; // non-SRV (mis. localhost) tidak butuh resolver eksternal
    const host = srvMatch[1];

    const ok = await probeDns(host);
    if (ok) return true;

    dns.setServers(fallbackDnsServers);
    console.warn(
      `⚠️ [MongoDB] Resolver DNS default menolak query, memakai public DNS (${fallbackDnsServers.join(', ')}).`,
    );
    return false;
  } catch {
    return false;
  }
}

async function connectOnce(uri: string, dbName: string): Promise<MongoRuntime | null> {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: mongoConfig.connectTimeoutMs,
    connectTimeoutMS: mongoConfig.connectTimeoutMs,
    appName: 'elegant-barbershop',
    maxPoolSize: 20,
    minPoolSize: 1,
  });
  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    return { client, db: client.db(dbName) };
  } catch {
    await client.close().catch(() => {});
    return null;
  }
}

/**
 * Dapatkan koneksi MongoDB (singleton).
 * Lazy-init pada panggilan pertama; dibangun ulang jika URI/db berubah
 * (hot-reload friendly).
 */
export const getMongoRuntime = async (): Promise<MongoRuntime | null> => {
  if (!mongoConfig.isConfigured) return null;

  const { uri, dbName } = mongoConfig;

  if (Date.now() - lastFailAt < FAIL_WINDOW_MS) {
    return null;
  }

  const dnsOk = await ensureUsableDns(uri);

  // Health-check: bila koneksi cached sudah lama tidak dipakai, pastikan client
  // masih terhubung. Serverless sering menidurkan idle socket; tanpa cek ini
  // operasi pertama setelah idle bisa gagal (persisted=false) lalu sukses lagi.
  if (runtime && lastUri === uri && lastDbName === dbName) {
    if (Date.now() - lastGoodAt > IDLE_RECHECK_MS) {
      const alive = await pingRuntime(runtime);
      if (alive) {
        lastGoodAt = Date.now();
      } else {
        console.warn('[MongoDB] Koneksi idle sudah tidak hidup — membangun ulang.');
        runtime = null;
        resolvedSrvUri = resolvedSrvUri && resolvedSrvUri.startsWith('mongodb://') ? resolvedSrvUri : null;
        lastUri = '';
        lastDbName = '';
        lastFailAt = 0;
      }
    }
  }

  if (!runtime || lastUri !== uri || lastDbName !== dbName) {
    // Untuk `mongodb+srv://`, resolver c-ares in-process dapat ditolak router
    // (di proses Next.js selalu gagal walau setServers dipanggil — shim webpack).
    // Bila probe gagal, langsung pakai host hasil resolusi SRV lewat child
    // process; bila probe sukses, coba URI asli dulu.
    let connected: MongoRuntime | null = null;

    if (dnsOk || !/^mongodb\+srv:\/\//i.test(uri)) {
      connected = await connectOnce(uri, dbName);
    }

    if (!connected && /^mongodb\+srv:\/\//i.test(uri)) {
      if (dnsOk) {
        console.warn('[MongoDB] SRV mentok, mencoba host hasil resolusi SRV.');
      }
      resolvedSrvUri =
        resolvedSrvUri && resolvedSrvUri.startsWith('mongodb://')
          ? resolvedSrvUri
          : await resolveSrvViaChild(uri);
      if (resolvedSrvUri) {
        connected = await connectOnce(resolvedSrvUri, dbName);
      }
    }

    if (connected) {
      runtime = connected;
      lastUri = uri;
      lastDbName = dbName;
      lastFailAt = 0;
      lastGoodAt = Date.now();
      console.log(`✅ [MongoDB] Terhubung ke ${maskUri(uri)} (db: ${dbName})`);
    } else {
      console.warn(
        '⚠️ [MongoDB] Gagal terhubung. Periksa MONGODB_URI, IP Network Access Atlas, dan koneksi internet.',
      );
      runtime = null;
      lastFailAt = Date.now();
      return null;
    }
  }

  lastGoodAt = Date.now();
  return runtime;
};

let reconnectInFlight: Promise<MongoRuntime | null> | null = null;

/**
 * Bangun ulang koneksi MongoDB dari nol (dipakai untuk retry operasi yang gagal
 * karena koneksi sempat mati / token jaringan sementara). Menonaktifkan
 * circuit-breaker lama lalu membuka client baru. Dipakai bersama di mongoRepo
 * agar tulis yang gagal karena transisi cold-start/serverless tidak hilang.
 */
export const reconnectMongoRuntime = (): Promise<MongoRuntime | null> => {
  if (reconnectInFlight) return reconnectInFlight;
  reconnectInFlight = (async () => {
    const old = runtime;
    runtime = null;
    resolvedSrvUri = resolvedSrvUri && resolvedSrvUri.startsWith('mongodb://') ? resolvedSrvUri : null;
    lastUri = '';
    lastDbName = '';
    lastFailAt = 0;
    if (old) {
      await old.client.close().catch(() => {});
    }
    try {
      return await getMongoRuntime();
    } finally {
      reconnectInFlight = null;
    }
  })();
  return reconnectInFlight;
};

/** Ambil Database object */
export const getMongoDb = (): Promise<Db | null> =>
  getMongoRuntime().then((r) => r?.db ?? null);

/** Ambil Collection tertentu */
export const getMongoCollection = async <T extends Document = Document>(
  name: string,
): Promise<Collection<T> | null> => {
  const db = await getMongoDb();
  return db ? db.collection<T>(name) : null;
};

/** Tutup koneksi (dipakai saat graceful shutdown / test) */
export const closeMongoConnection = async (): Promise<void> => {
  if (runtime) {
    await runtime.client.close().catch(() => {});
    runtime = null;
    lastUri = '';
    lastDbName = '';
  }
  lastFailAt = 0;
};

// ── Indexes & Collections ────────────────────────────────────────────────────

/** Daftar koleksi yang dipakai aplikasi beserta index yang diinginkan */
export const COLLECTIONS = {
  SETTINGS: 'settings',
  SERVICES: 'services',
  BARBERS: 'barbers',
  BOOKINGS: 'bookings',
  TRANSACTIONS: 'transactions',
  CUSTOMERS: 'customers',
  ADMINS: 'admins',
  SESSIONS: 'sessions',
} as const;

export type SupportedCollection = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Pastikan semua koleksi ada + buat index yang diperlukan.
 * Dipanggil saat server boot dan oleh CLI `db:migrate`.
 */
export const ensureMongoIndexes = async (): Promise<void> => {
  const db = await getMongoDb();
  if (!db) return;

  const services = db.collection(COLLECTIONS.SERVICES);
  const barbers = db.collection(COLLECTIONS.BARBERS);
  const bookings = db.collection(COLLECTIONS.BOOKINGS);
  const transactions = db.collection(COLLECTIONS.TRANSACTIONS);
  const customers = db.collection(COLLECTIONS.CUSTOMERS);
  const settings = db.collection(COLLECTIONS.SETTINGS);
  const admins = db.collection(COLLECTIONS.ADMINS);
  const sessions = db.collection(COLLECTIONS.SESSIONS);

  await Promise.all([
    services.createIndex({ id: 1 }, { unique: true }),
    services.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
    services.createIndex({ category: 1 }),
    services.createIndex({ isActive: 1 }),
    services.createIndex({ isDeleted: 1 }),
    barbers.createIndex({ id: 1 }, { unique: true }),
    barbers.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
    barbers.createIndex({ isActive: 1 }),
    barbers.createIndex({ isDeleted: 1 }),
    bookings.createIndex({ bookingCode: 1 }, { unique: true }),
    bookings.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
    bookings.createIndex({ customerPhone: 1 }),
    bookings.createIndex({ date: 1, timeSlot: 1 }),
    bookings.createIndex({ date: 1, status: 1 }),
    bookings.createIndex({ status: 1, isDeleted: 1 }),
    bookings.createIndex({ createdAt: -1 }),
    bookings.createIndex({ isDeleted: 1 }),
    transactions.createIndex({ invoiceNumber: 1 }, { unique: true }),
    transactions.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
    transactions.createIndex({ createdAt: -1 }),
    transactions.createIndex({ paymentMethod: 1 }),
    transactions.createIndex({ bookingId: 1 }),
    transactions.createIndex({ customerPhone: 1 }),
    transactions.createIndex({ isDeleted: 1 }),
    customers.createIndex({ phone: 1 }, { unique: true }),
    customers.createIndex({ name: 1 }),
    customers.createIndex({ isDeleted: 1 }),
    settings.createIndex({ key: 1 }, { unique: true }),
    admins.createIndex({ id: 1 }, { unique: true }),
    admins.createIndex({ username: 1 }, { unique: true }),
    admins.createIndex({ isActive: 1 }),
    sessions.createIndex({ token: 1 }, { unique: true }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function maskUri(uri: string): string {
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'mongodb://'));
    if (u.username) u.username = '****';
    if (u.password) u.password = '****';
    return String(u);
  } catch {
    return uri.slice(0, 12) + '****';
  }
}

// ── Availability Check ──────────────────────────────────────────────────────

/**
 * Cek apakah MongoDB sedang terhubung tanpa melakukan ping.
 * Dipakai oleh route handler GET untuk membedakan "DB down → return 503"
 * dari "DB up, koleksi kosong → return []".
 * Bila MongoDB tidak dikonfigurasi, kembalikan false (mode in-memory).
 */
export function isMongoAvailable(): boolean {
  if (!mongoConfig.isConfigured) return false;
  // Bila dalam FAIL_WINDOW_MS terakhir gagal, anggap masih down
  if (Date.now() - lastFailAt < FAIL_WINDOW_MS) return false;
  // Ada runtime aktif → pasti terhubung
  return runtime !== null;
}

// ── Status Report ────────────────────────────────────────────────────────────

export interface DatabaseStatusReport {
  isConfigured: boolean;
  isConnected: boolean;
  dbName: string | null;
  uriMasked: string | null;
  mode: 'mongodb_live' | 'in_memory_fallback';
  collections: {
    settings: boolean;
    services: boolean;
    barbers: boolean;
    bookings: boolean;
    transactions: boolean;
    customers: boolean;
    admins: boolean;
    sessions: boolean;
  };
  counts: Record<string, number>;
  message: string;
}

export const checkMongoStatus = async (): Promise<DatabaseStatusReport> => {
  const emptyCollections = {
    settings: false,
    services: false,
    barbers: false,
    bookings: false,
    transactions: false,
    customers: false,
    admins: false,
    sessions: false,
  };

  if (!mongoConfig.isConfigured) {
    return {
      isConfigured: false,
      isConnected: false,
      dbName: null,
      uriMasked: null,
      mode: 'in_memory_fallback',
      collections: emptyCollections,
      counts: {},
      message:
        'Variabel MONGODB_URI belum terisi. Server beroperasi dalam mode In-Memory (data hilang saat restart).',
    };
  }

  const runtimeNow = await getMongoRuntime();
  if (!runtimeNow) {
    return {
      isConfigured: true,
      isConnected: false,
      dbName: mongoConfig.dbName,
      uriMasked: maskUri(mongoConfig.uri),
      mode: 'in_memory_fallback',
      collections: emptyCollections,
      counts: {},
      message:
        'Gagal menghubungkan MongoDB dengan kredensial yang diberikan. Periksa MONGODB_URI dan pastikan server database aktif.',
    };
  }

  try {
    const names = await runtimeNow.db.listCollections({}, { nameOnly: true }).toArray();
    const index = new Set(names.map((n) => n.name));

    const counts = {
      settings: await runtimeNow.db.collection(COLLECTIONS.SETTINGS).countDocuments(),
      services: await runtimeNow.db.collection(COLLECTIONS.SERVICES).countDocuments(),
      barbers: await runtimeNow.db.collection(COLLECTIONS.BARBERS).countDocuments(),
      bookings: await runtimeNow.db.collection(COLLECTIONS.BOOKINGS).countDocuments(),
      transactions: await runtimeNow.db.collection(COLLECTIONS.TRANSACTIONS).countDocuments(),
      customers: await runtimeNow.db.collection(COLLECTIONS.CUSTOMERS).countDocuments(),
      admins: await runtimeNow.db.collection(COLLECTIONS.ADMINS).countDocuments(),
      sessions: await runtimeNow.db.collection(COLLECTIONS.SESSIONS).countDocuments(),
    };

    const collections = {
      settings: index.has(COLLECTIONS.SETTINGS),
      services: index.has(COLLECTIONS.SERVICES),
      barbers: index.has(COLLECTIONS.BARBERS),
      bookings: index.has(COLLECTIONS.BOOKINGS),
      transactions: index.has(COLLECTIONS.TRANSACTIONS),
      customers: index.has(COLLECTIONS.CUSTOMERS),
      admins: index.has(COLLECTIONS.ADMINS),
      sessions: index.has(COLLECTIONS.SESSIONS),
    };

    return {
      isConfigured: true,
      isConnected: true,
      dbName: mongoConfig.dbName,
      uriMasked: maskUri(mongoConfig.uri),
      mode: 'mongodb_live',
      collections,
      counts,
      message: `Koneksi MongoDB aktif. Database "${mongoConfig.dbName}" terhubung secara real-time!`,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      dbName: mongoConfig.dbName,
      uriMasked: maskUri(mongoConfig.uri),
      mode: 'in_memory_fallback',
      collections: emptyCollections,
      counts: {},
      message: `Gagal membaca koleksi MongoDB: ${err?.message || 'Network error'}`,
    };
  }
};