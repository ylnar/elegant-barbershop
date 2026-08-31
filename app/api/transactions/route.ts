import { serverStore } from '@server/state';
import { Transaction } from '@/types';
import { json, apiError, queryOf, readBody, sanitizeString, normalizeNickname, normalizePhoneDigits } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';
import { isMongoAvailable } from '@server/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/transactions
export async function GET(req: Request) {
  const sp = queryOf(req);
  const date = sp.get('date');
  const paymentMethod = sp.get('paymentMethod');
  const search = sp.get('search');

  // Cek ketersediaan MongoDB SEBELUM query.
  // Bila MongoDB tersedia, tarik data live dari database (dan refresh cache memori).
  if (isMongoAvailable()) {
    try {
      const remote = await mongoRepo.queryTransactions({
        date: date || undefined,
        paymentMethod: paymentMethod && paymentMethod !== 'all' ? paymentMethod : undefined,
        search: search || undefined,
      });
      // Update cache in-memory supaya konsisten dengan database.
      if (!date && !paymentMethod && !search) {
        serverStore.setTransactions(
          await mongoRepo.queryTransactions({}),
        );
      }
      return json(remote);
    } catch (err) {
      console.warn('[MongoDB Transactions Error]:', err);
    }
  }

  // Fallback: MongoDB tidak tersedia / gagal. Kembalikan data dari store in-memory
  // (terisi seed + transaksi yang pernah dibuat/di-sync di instance ini) — BUKAN
  // list kosong / 503. Ini penting: aplikasi HP menarik dari endpoint ini dan tidak
  // punya fallback lokal seperti web (localStorage), sehingga bila server hanya
  // membalas 503, layar Riwayat Transaksi di HP tampak kosong padahal data ada.
  let cached = serverStore.getTransactions();
  if (date) cached = cached.filter((t) => t.createdAt?.slice(0, 10) === date);
  if (paymentMethod && paymentMethod !== 'all') cached = cached.filter((t) => t.paymentMethod === paymentMethod);
  if (search) {
    const q = search.toLowerCase();
    cached = cached.filter(
      (t) =>
        t.invoiceNumber?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        (t.customerPhone && t.customerPhone.includes(q)),
    );
  }
  return json(cached);
}

// POST /api/transactions
export async function POST(req: Request) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const body = await readBody(req);
  const {
    bookingId,
    customerName,
    customerPhone,
    barberId,
    items,
    subtotal,
    discount,
    totalAmount,
    paymentMethod,
    amountPaid,
    changeAmount,
    notes,
  } = body;

  // Idempotensi: request ulang (retry setelah timeout) dengan key yang sama
  // mengembalikan transaksi yang sudah tersimpan, bukan membuat duplikat.
  const idempotencyKey = body.idempotencyKey
    ? sanitizeString(body.idempotencyKey).slice(0, 120)
    : '';
  if (idempotencyKey) {
    try {
      const existing = await mongoRepo.findTransactionByIdempotencyKey(idempotencyKey);
      if (existing) {
        return json(
          {
            success: true,
            transaction: existing,
            message: `Transaksi ${existing.invoiceNumber} sudah tersimpan sebelumnya.`,
            duplicate: true,
          },
          200,
        );
      }
    } catch (err) {
      console.warn('[Transactions Route] Gagal cek idempotencyKey:', err);
    }
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return json({ error: 'Minimal pilih 1 layanan transaksi.' }, 400);
  }

  let barberName = '';
  if (barberId) {
    const b = serverStore.getBarberById(barberId);
    if (b) barberName = b.name;
    else if (body.barberName) barberName = body.barberName;
  } else if (body.barberName) {
    barberName = body.barberName;
  }

  // Invoice number: collision-safe dengan timestamp + random suffix
  const year = new Date().getFullYear();
  let invoiceNumber = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `TRX-${year}-${suffix}`;
    const existing = await mongoRepo.queryTransactions({ search: candidate });
    if (existing.length === 0 || !existing.some(t => t.invoiceNumber === candidate)) {
      invoiceNumber = candidate;
      break;
    }
  }
  if (!invoiceNumber) {
    invoiceNumber = `TRX-${year}-${Date.now().toString().slice(-4)}`;
  }

  // Nama panggilan: hanya satu kata tanpa spasi.
  let cleanCustomerName = normalizeNickname(customerName) || 'Tamu Umum (Walk-in)';
  const cleanCustomerPhone = customerPhone ? normalizePhoneDigits(customerPhone) : undefined;

  // Deduplikasi pelanggan by nomor: bila nomor sudah tersimpan, otomatis pakai
  // nama yang sudah dikenal (nama panggilan) meskipun yang diketik berbeda.
  let canonicalName: string | undefined;
  if (cleanCustomerPhone) {
    try {
      const existing = await mongoRepo.lookupCustomerByPhone(cleanCustomerPhone);
      if (existing && existing.name) canonicalName = existing.name;
    } catch (err) {
      console.warn('[Transactions Route] Gagal lookup pelanggan:', err);
    }
  }
  if (canonicalName) cleanCustomerName = canonicalName;

  const cleanNotes = notes ? sanitizeString(notes) : undefined;

  const newTransaction: Transaction = {
    id: `trx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    invoiceNumber,
    idempotencyKey: idempotencyKey || undefined,
    bookingId: bookingId ? sanitizeString(bookingId) : undefined,
    customerName: cleanCustomerName,
    customerPhone: cleanCustomerPhone,
    barberId: barberId || '',
    barberName,
    items,
    subtotal: Math.max(0, Number(subtotal) || Number(totalAmount)),
    discount: Math.max(0, Number(discount) || 0),
    totalAmount: Math.max(0, Number(totalAmount)),
    paymentMethod: paymentMethod || 'cash',
    amountPaid: Math.max(0, Number(amountPaid) || Number(totalAmount)),
    changeAmount: Math.max(0, Number(changeAmount) || 0),
    notes: cleanNotes,
    createdAt: new Date().toISOString(),
  };

  // Simpan ke MongoDB — kalau gagal, JANGAN klaim sukses. Di serverless data
  // hanya di memori instance → hilang saat instance di-recycle, dan aplikasi
  // HP percaya data sudah tersimpan. Lebih baik beri error agar klien
  // menyimpan ke antrean offline/retry.
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.insertTransaction(newTransaction);
    if (!persistedToDatabase) {
      console.error('[MongoDB Insert Transaction]: simpan gagal ke database');
    }
    // Tandai reservasi terkait selesai (completed) di MongoDB agar konsisten
    // dengan status internal — tidak hanya di memori.
    if (persistedToDatabase && newTransaction.bookingId) {
      await mongoRepo
        .updateBooking(newTransaction.bookingId, { status: 'completed' })
        .catch(() => {});
    }
    // Update customer data (non-blocking)
    if (persistedToDatabase) {
      await mongoRepo.upsertCustomer(cleanCustomerName, cleanCustomerPhone).catch(() => {});
    }
  } catch (err) {
    console.error('[MongoDB Insert Transaction Error]:', err);
  }

  if (!persistedToDatabase) {
    return apiError(
      'Transaksi belum tersimpan ke database. Silakan coba lagi; data sementara juga tersimpan di antrean aplikasi.',
      500,
      { success: false, persistedToDatabase: false },
    );
  }

  // Store in-memory hanya setelah benar-benar tersimpan di MongoDB
  const created = serverStore.addTransaction(newTransaction, false);
  return json(
    {
      success: true,
      transaction: created,
      message: `Transaksi kasir ${newTransaction.invoiceNumber} berhasil disimpan.`,
    },
    201,
  );
}
