#!/usr/bin/env node
/**
 * Resolve SRV/TXT record sebuah host MongoDB Atlas.
 * Dipakai server (Next.js) sebagai child process karena sebagian lingkungan
 * (ISP/router) menolak query `dns.promises.resolve` dari dalam proses server,
 * padahal child process baru bisa memakai public DNS fallback dengan sukses.
 *
 * Pemakaian:
 *   node scripts/resolve-srv.mjs "cluster0.abcde.mongodb.net"
 * Output (JSON):
 *   { "hosts": ["ac-...-shard-00-00.abcde.mongodb.net:27017", ...],
 *     "txt": "replicaSet=...&authSource=..." | "" }
 */
import dns from 'node:dns';

const host = process.argv[2];
if (!host) {
  console.error('Usage: node scripts/resolve-srv.mjs <host>');
  process.exit(1);
}

const FALLBACK_DNS = ['8.8.8.8', '1.1.1.1'];
const TIMEOUT_MS = 8000;

function queryOnceTimeout(rrtype, address) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`dns ${rrtype} timeout`)), TIMEOUT_MS);
    dns.promises.resolve(address, rrtype).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function tryResolve() {
  const srv = await queryOnceTimeout('SRV', host);
  let txt = '';
  try {
    const records = await queryOnceTimeout('TXT', host);
    txt = (records[0] || []).join('');
  } catch {
    // TXT opsional
  }
  const hosts = srv.map((r) => `${r.name}:27017`);
  return { hosts, txt };
}

async function main() {
  try {
    process.stdout.write(JSON.stringify(await tryResolve()));
  } catch (firstErr) {
    // Coba sekali lagi dengan public DNS (beberapa router menolak query aplikasi)
    try {
      dns.setServers(FALLBACK_DNS);
      process.stdout.write(JSON.stringify(await tryResolve()));
    } catch {
      process.stderr.write(String(firstErr?.message || firstErr));
      process.exit(1);
    }
  }
}

main();