/**
 * scripts/db-hard-delete.ts
 * ─────────────────────────
 * Hard delete: Hapus PERMANEN semua dokumen yang sudah soft-deleted
 * (isDeleted: true) dari semua koleksi.
 *
 * PERINGATAN: Operasi ini TIDAK BISA dibatalkan!
 *
 * Run: npx tsx scripts/db-hard-delete.ts
 */

import { MongoClient } from 'mongodb';
import dns from 'node:dns';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import readline from 'node:readline';

const execFileAsync = promisify(execFile);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elegant_barbershop';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'elegant_barbershop';
const fallbackDnsServers = ['8.8.8.8', '1.1.1.1'];

function probeDns(host: string, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    dns.resolveSrv(host, (err) => { clearTimeout(timer); resolve(!err); });
  });
}

function resolveSrvScriptPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'scripts', 'resolve-srv.mjs'),
    path.join(__dirname, '..', 'scripts', 'resolve-srv.mjs'),
  ];
  for (const cand of candidates) { if (fs.existsSync(cand)) return cand; }
  return null;
}

async function resolveSrvViaChild(srvUri: string): Promise<string | null> {
  const script = resolveSrvScriptPath();
  const srvMatch = srvUri.match(/^mongodb\+srv:\/\/([^/]+)(.*)$/);
  if (!script || !srvMatch) return null;
  const [, authHost, rest] = srvMatch;
  const hostOnly = authHost.split('@').pop() ?? authHost;
  try {
    const { stdout } = await execFileAsync(process.execPath, [script, hostOnly], { timeout: 15000, windowsHide: true });
    const parsed = JSON.parse(stdout);
    if (!parsed.hosts?.length) return null;
    const params: Record<string, string> = {};
    new URLSearchParams(parsed.txt || '').forEach((v, k) => { if (k) params[k] = v; });
    const query = new URLSearchParams();
    const split = (rest || '').split('?');
    new URLSearchParams(split[1] || '').forEach((v, k) => query.set(k, v));
    query.set('ssl', 'true');
    query.set('authSource', params.authSource || 'admin');
    if (params.replicaSet) query.set('replicaSet', params.replicaSet);
    return `mongodb://${authHost.split('@')[0]}@${parsed.hosts.join(',')}/elegant_barbershop?${query.toString()}`;
  } catch { return null; }
}

async function connect(uri: string, dbName: string): Promise<MongoClient | null> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, appName: 'db-hard-delete' });
  try { await client.connect(); await client.db(dbName).command({ ping: 1 }); return client; }
  catch { await client.close().catch(() => {}); return null; }
}

async function getConnectedClient(): Promise<MongoClient | null> {
  const direct = await connect(MONGODB_URI, MONGODB_DB_NAME);
  if (direct) return direct;
  if (/^mongodb\+srv:\/\//i.test(MONGODB_URI)) {
    const srvMatch = MONGODB_URI.match(/^mongodb\+srv:\/\/([^/]+)/);
    if (srvMatch) {
      if (!(await probeDns(srvMatch[1]))) {
        dns.setServers(fallbackDnsServers);
        const retry = await connect(MONGODB_URI, MONGODB_DB_NAME);
        if (retry) return retry;
      }
      const resolvedUri = await resolveSrvViaChild(MONGODB_URI);
      if (resolvedUri) {
        const fromChild = await connect(resolvedUri, MONGODB_DB_NAME);
        if (fromChild) return fromChild;
      }
    }
  }
  return null;
}

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim() === '');
    });
  });
}

const COLLECTIONS = ['services', 'barbers', 'bookings', 'transactions', 'customers', 'sessions'] as const;

async function main() {
  console.log('🗑️  HARD DELETE — Hapus permanen semua data soft-deleted\n');

  const client = await getConnectedClient();
  if (!client) {
    console.error('❌ Cannot connect to MongoDB.');
    process.exit(1);
  }

  try {
    const db = client.db(MONGODB_DB_NAME);

    // Hitung dulu berapa yang akan dihapus
    console.log('📊 Menghitung data soft-deleted...\n');
    let totalToDelete = 0;
    const counts: Record<string, number> = {};

    for (const col of COLLECTIONS) {
      const count = await db.collection(col).countDocuments({ isDeleted: true });
      counts[col] = count;
      totalToDelete += count;
      if (count > 0) {
        console.log(`   ${col}: ${count} dokumen akan dihapus permanen`);
      }
    }

    if (totalToDelete === 0) {
      console.log('\n✅ Tidak ada data soft-deleted. Database sudah bersih!');
      return;
    }

    console.log(`\n⚠️  TOTAL: ${totalToDelete} dokumen akan dihapus PERMANEN!`);
    console.log('   Operasi ini TIDAK BISA dibatalkan!\n');

    const confirmed = await askConfirmation('Ketik Y atau Enter untuk melanjutkan: ');
    if (!confirmed) {
      console.log('❌ Dibatalkan oleh user.');
      return;
    }

    console.log('\n🗑️  Menghapus permanen...\n');

    for (const col of COLLECTIONS) {
      if (counts[col] === 0) continue;
      const result = await db.collection(col).deleteMany({ isDeleted: true });
      console.log(`   ✅ ${col}: ${result.deletedCount} dokumen dihapus permanen`);
    }

    // Summary
    console.log('\n📊 Jumlah data tersisa (aktif):');
    for (const col of COLLECTIONS) {
      const count = await db.collection(col).countDocuments({
        $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }],
      });
      console.log(`   ${col}: ${count}`);
    }

    console.log('\n✅ Hard delete selesai!');

  } catch (err) {
    console.error('\n❌ Gagal:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
