import { serverStore } from '@server/state';
import { Transaction } from '@/types';
import { json, apiError, queryOf, readBody, sanitizeString } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/transactions
export async function GET(req: Request) {
  const sp = queryOf(req);
  const date = sp.get('date');
  const paymentMethod = sp.get('paymentMethod');
  const search = sp.get('search');

  try {
    const remote = await mongoRepo.queryTransactions({
      date: date || undefined,
      paymentMethod: paymentMethod && paymentMethod !== 'all' ? paymentMethod : undefined,
      search: search || undefined,
    });
    if (remote.length > 0) {
      return json(remote);
    }
  } catch (err) {
    console.warn('[MongoDB Transactions Error]:', err);
  }

  let filtered = serverStore.getTransactions();

  if (date) {
    // Compare using local WIB date range converted to UTC for timezone safety
    const startUTC = new Date(`${date}T00:00:00+07:00`).toISOString();
    const endUTC = new Date(`${date}T23:59:59+07:00`).toISOString();
    filtered = filtered.filter((t) => t.createdAt >= startUTC && t.createdAt <= endUTC);
  }
  if (paymentMethod && paymentMethod !== 'all') {
    filtered = filtered.filter((t) => t.paymentMethod === paymentMethod);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.invoiceNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        (t.customerPhone && t.customerPhone.includes(q)) ||
        t.barberName.toLowerCase().includes(q),
    );
  }

  return json(filtered);
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

  if (!items || !Array.isArray(items) || items.length === 0) {
    return json({ error: 'Minimal pilih 1 layanan transaksi.' }, 400);
  }

  let barberName = 'Staff Barber';
  if (barberId) {
    const b = serverStore.getBarberById(barberId);
    if (b) barberName = b.name;
    else if (body.barberName) barberName = body.barberName;
  }

  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const invoiceNumber = `TRX-${new Date().getFullYear()}-${randomSuffix}`;

  const cleanCustomerName = sanitizeString(customerName) || 'Tamu Umum (Walk-in)';
  const cleanCustomerPhone = customerPhone ? sanitizeString(customerPhone) : undefined;
  const cleanNotes = notes ? sanitizeString(notes) : undefined;

  const newTransaction: Transaction = {
    id: `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    invoiceNumber,
    bookingId: bookingId ? sanitizeString(bookingId) : undefined,
    customerName: cleanCustomerName,
    customerPhone: cleanCustomerPhone,
    barberId: barberId || 'barber-1',
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
      await mongoRepo.upsertCustomer(cleanCustomerName, cleanCustomerPhone, undefined).catch(() => {});
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
      persistedToDatabase,
    },
    201,
  );
}
