import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient } = await import('mongodb');
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'elegant_barbershop';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30000 });
await client.connect();
const db = client.db(dbName);
const trx = db.collection('transactions');
const ids = process.argv.slice(2);
if (ids.length) {
  for (const id of ids) {
    const found = await trx.findOne({ id });
    console.log(`${id} -> ${found ? 'ADA di Mongo, isDeleted=' + found.isDeleted : 'TIDAK ADA di Mongo'}`);
  }
}
const total = await trx.countDocuments();
const notDeleted = await trx.countDocuments({ $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }] });
console.log(`[transactions] total=${total} notDeleted=${notDeleted}`);
await client.close();