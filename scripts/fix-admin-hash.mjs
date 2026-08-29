#!/usr/bin/env node
/**
 * Cek & perbaiki password hash akun admin "owner" di MongoDB.
 * Jalankan: node scripts/fix-admin-hash.mjs
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

const DEFAULT_ADMIN = {
  id: 'admin-owner',
  username: 'owner',
  password: 'owner123',
  displayName: 'Owner',
  role: 'owner',
};

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  try {
    const candidate = crypto.scryptSync(String(password), String(salt), 64);
    const expected = Buffer.from(String(hash), 'hex');
    return candidate.length === expected.length &&
      crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

function getUri() {
  return (process.env.MONGODB_URI || '').trim() || 'mongodb://localhost:27017/elegant_barbershop';
}

function getDbName(uri) {
  const name = (process.env.MONGODB_DB_NAME || '').trim();
  if (name) return name;
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'mongodb://'));
    return (u.pathname.split('/')[1] || 'elegant_barbershop').split('?')[0];
  } catch { return 'elegant_barbershop'; }
}

async function main() {
  const uri = getUri();
  const dbName = getDbName(uri);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('admins');

    const row = await col.findOne({ username: DEFAULT_ADMIN.username });
    if (!row) {
      console.log('❌ Admin "owner" TIDAK DITEMUKAN di koleksi admins.');
      console.log('   Menyisipkan akun baru...');
      const { hash, salt } = hashPassword(DEFAULT_ADMIN.password);
      await col.insertOne({
        id: DEFAULT_ADMIN.id,
        username: DEFAULT_ADMIN.username,
        passwordHash: hash,
        passwordSalt: salt,
        displayName: DEFAULT_ADMIN.displayName,
        role: DEFAULT_ADMIN.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✔ Akun admin "owner" berhasil dibuat.');
      return;
    }

    console.log('📋 Admin ditemukan:');
    console.log(`   id          : ${row.id}`);
    console.log(`   username    : ${row.username}`);
    console.log(`   displayName : ${row.displayName}`);
    console.log(`   role        : ${row.role}`);
    console.log(`   isActive    : ${row.isActive}`);
    console.log(`   hash (awal) : ${(row.passwordHash || '').slice(0, 12)}...`);
    console.log(`   salt (awal) : ${(row.passwordSalt || '').slice(0, 12)}...`);
    console.log('');

    // Verifikasi password
    const ok = verifyPassword(DEFAULT_ADMIN.password, row.passwordHash, row.passwordSalt);
    if (ok) {
      console.log('✔ Password "owner123" VERIFIKASI BERHASIL — hash cocok.');
      console.log('  Masalah BUKAN di hash. Kemungkinan:');
      console.log('  - Android app terhubung ke server/v URL yang salah');
      console.log('  - Rate limiting aktif (terlalu banyak percobaan)');
      console.log('  - Ada spasi/char tersembunyi di username/password');
      return;
    }

    console.log('❌ Password "owner123" VERIFIKASI GAGAL — hash TIDAK cocok!');
    console.log('   Memperbarui hash dengan yang benar...');

    const { hash, salt } = hashPassword(DEFAULT_ADMIN.password);
    await col.updateOne(
      { username: DEFAULT_ADMIN.username },
      { $set: { passwordHash: hash, passwordSalt: salt, updatedAt: new Date().toISOString() } }
    );

    // Verifikasi ulang
    const recheck = verifyPassword(DEFAULT_ADMIN.password, hash, salt);
    console.log(`✔ Hash diperbarui. Verifikasi ulang: ${recheck ? 'BERHASIL ✅' : 'GAGAL ❌'}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

main();
