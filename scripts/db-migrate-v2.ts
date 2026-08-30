/**
 * scripts/db-migrate-v2.ts
 * ───────────────────────
 * Migration v2 with DNS SRV fallback (same strategy as mongodb.ts):
 * 1. Hapus field email dari customers
 * 2. Clean orphan transactions
 * 3. Clean duplicate transactions per bookingId
 * 4. Verify FK integrity
 *
 * Run: npx tsx scripts/db-migrate-v2.ts
 */

import { MongoClient } from 'mongodb';
import dns from 'node:dns';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elegant_barbershop';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'elegant_barbershop';

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

async function resolveSrvViaChild(srvUri: string): Promise<string | null> {
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
    new URLSearchParams(parsed.txt || '').forEach((v, k) => { if (k) params[k] = v; });
    const replicaSet = params.replicaSet;
    const authSource = params.authSource || 'admin';
    const query = new URLSearchParams();
    const split = (rest || '').split('?');
    const baseQuery = new URLSearchParams(split[1] || '');
    baseQuery.forEach((v, k) => query.set(k, v));
    query.set('ssl', 'true');
    query.set('authSource', authSource);
    if (replicaSet) query.set('replicaSet', replicaSet);
    const hostList = parsed.hosts.join(',');
    return `mongodb://${authHost.split('@')[0]}@${hostList}/elegant_barbershop?${query.toString()}`;
  } catch {
    return null;
  }
}

async function connect(uri: string, dbName: string): Promise<MongoClient | null> {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    appName: 'db-migrate-v2',
  });
  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    return client;
  } catch {
    await client.close().catch(() => {});
    return null;
  }
}

async function getConnectedClient(): Promise<MongoClient | null> {
  // Try direct connection first
  const direct = await connect(MONGODB_URI, MONGODB_DB_NAME);
  if (direct) return direct;

  // If SRV, try DNS fallback + child process resolution
  if (/^mongodb\+srv:\/\//i.test(MONGODB_URI)) {
    const srvMatch = MONGODB_URI.match(/^mongodb\+srv:\/\/([^/]+)/);
    if (srvMatch) {
      const host = srvMatch[1];
      const ok = await probeDns(host);
      if (!ok) {
        dns.setServers(fallbackDnsServers);
        const retry = await connect(MONGODB_URI, MONGODB_DB_NAME);
        if (retry) return retry;
      }
      // Try child process resolution
      const resolvedUri = await resolveSrvViaChild(MONGODB_URI);
      if (resolvedUri) {
        const fromChild = await connect(resolvedUri, MONGODB_DB_NAME);
        if (fromChild) return fromChild;
      }
    }
  }
  return null;
}

async function migrate() {
  console.log('🔧 Migration v2 — Starting...\n');

  const client = await getConnectedClient();
  if (!client) {
    console.error('❌ Cannot connect to MongoDB. Check MONGODB_URI and network.');
    process.exit(1);
  }

  try {
    console.log('✅ Connected to MongoDB\n');
    const db = client.db(MONGODB_DB_NAME);

    // ── Step 1: Hapus field email dari customers ─────────────────────
    console.log('📋 Step 1: Removing email field from customers...');
    const emailResult = await db.collection('customers').updateMany(
      { email: { $exists: true } },
      { $unset: { email: '' } },
    );
    console.log(`   Customers cleaned: ${emailResult.modifiedCount}`);

    // ── Step 2: Clean orphan transactions ────────────────────────────
    console.log('\n📋 Step 2: Cleaning orphan transactions...');
    const activeBookingIds = await db.collection('bookings')
      .find({ $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }] })
      .project({ id: 1 })
      .toArray();
    const activeSet = new Set(activeBookingIds.map((b: any) => b.id));

    const orphanResult = await db.collection('transactions').updateMany(
      {
        bookingId: { $exists: true, $ne: null, $ne: '' },
        $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }],
      },
      [{
        $set: {
          isDeleted: {
            $cond: {
              if: { $not: [{ $in: ['$bookingId', Array.from(activeSet)] }] },
              then: true,
              else: { $ifNull: ['$isDeleted', false] },
            },
          },
        },
      }],
    );
    console.log(`   Orphan transactions soft-deleted: ${orphanResult.modifiedCount}`);

    // ── Step 3: Clean duplicate transactions per bookingId ───────────
    console.log('\n📋 Step 3: Cleaning duplicate transactions...');
    const txGroups = await db.collection('transactions').aggregate([
      {
        $match: {
          bookingId: { $exists: true, $ne: null, $ne: '' },
          $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }],
        },
      },
      { $group: { _id: '$bookingId', txs: { $push: '$$ROOT' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    let dupsFixed = 0;
    for (const group of txGroups) {
      const sorted = group.txs.sort((a: any, b: any) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      );
      for (const tx of sorted.slice(1)) {
        await db.collection('transactions').updateOne(
          { _id: tx._id },
          { $set: { isDeleted: true, deletedAt: new Date().toISOString() } },
        );
        dupsFixed++;
      }
    }
    console.log(`   Duplicate transactions soft-deleted: ${dupsFixed}`);

    // ── Step 4: Verify FK integrity ──────────────────────────────────
    console.log('\n📋 Step 4: Verifying foreign key integrity...');
    const nonDeletedTx = await db.collection('transactions').find({
      bookingId: { $exists: true, $ne: null, $ne: '' },
      $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }],
    }).toArray();

    let brokenFks = 0;
    for (const tx of nonDeletedTx) {
      const booking = await db.collection('bookings').findOne({ id: tx.bookingId });
      if (!booking || booking.isDeleted === true) {
        await db.collection('transactions').updateOne(
          { _id: tx._id },
          { $set: { isDeleted: true, deletedAt: new Date().toISOString() } },
        );
        brokenFks++;
      }
    }
    console.log(`   Broken FKs fixed: ${brokenFks}`);

    // ── Step 5: Summary ──────────────────────────────────────────────
    console.log('\n📋 Step 5: Final counts...');
    const nd = { $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }] };
    console.log(`   Bookings (active): ${await db.collection('bookings').countDocuments(nd)}`);
    console.log(`   Bookings (deleted): ${await db.collection('bookings').countDocuments({ isDeleted: true })}`);
    console.log(`   Transactions (active): ${await db.collection('transactions').countDocuments(nd)}`);
    console.log(`   Transactions (deleted): ${await db.collection('transactions').countDocuments({ isDeleted: true })}`);
    console.log(`   Customers: ${await db.collection('customers').countDocuments(nd)}`);

    console.log('\n✅ Migration v2 completed!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
