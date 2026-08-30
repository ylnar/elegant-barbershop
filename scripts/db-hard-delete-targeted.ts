/**
 * scripts/db-hard-delete-targeted.ts
 * ──────────────────────────────────
 * Hard delete permanen HANYA untuk bookings dan transactions.
 *
 * PERINGATAN: Operasi ini TIDAK BISA dibatalkan!
 *
 * Run: npx tsx scripts/db-hard-delete-targeted.ts
 */

import { MongoClient } from 'mongodb';
import dns from 'node:dns';
import readline from 'node:readline';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elegant_barbershop';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'elegant_barbershop';
const fallbackDnsServers = ['8.8.8.8', '1.1.1.1'];

const TARGET_COLLECTIONS = ['bookings', 'transactions'] as const;

function probeDns(host: string, timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    dns.resolveSrv(host, (err) => { clearTimeout(timer); resolve(!err); });
  });
}

async function connect(uri: string, dbName: string): Promise<MongoClient | null> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, appName: 'db-hard-delete-targeted' });
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

async function main() {
  console.log('🗑️  HARD DELETE — Hapus permanen data soft-deleted (bookings & transactions)\n');

  const client = await getConnectedClient();
  if (!client) {
    console.error('❌ Cannot connect to MongoDB.');
    process.exit(1);
  }

  try {
    const db = client.db(MONGODB_DB_NAME);

    console.log('📊 Menghitung data soft-deleted...\n');
    let totalToDelete = 0;
    const counts: Record<string, number> = {};

    for (const col of TARGET_COLLECTIONS) {
      const count = await db.collection(col).countDocuments({ isDeleted: true });
      counts[col] = count;
      totalToDelete += count;
      if (count > 0) {
        console.log(`   ${col}: ${count} dokumen akan dihapus permanen`);
      }
    }

    if (totalToDelete === 0) {
      console.log('\n✅ Tidak ada data soft-deleted di bookings & transactions.');
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

    for (const col of TARGET_COLLECTIONS) {
      if (counts[col] === 0) continue;
      const result = await db.collection(col).deleteMany({ isDeleted: true });
      console.log(`   ✅ ${col}: ${result.deletedCount} dokumen dihapus permanen`);
    }

    // Summary
    console.log('\n📊 Jumlah data tersisa (aktif):');
    for (const col of TARGET_COLLECTIONS) {
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
