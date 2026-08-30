import { serverStore } from '@server/state';
import { Transaction } from '@/types';
import { json, apiError, readBody, sanitizeString, normalizeNickname, normalizePhoneDigits } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/bookings/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;
  const updates = await readBody(req);
  if (updates.customerName) updates.customerName = sanitizeString(updates.customerName);
  if (updates.customerPhone) updates.customerPhone = sanitizeString(updates.customerPhone);
  if (updates.notes) updates.notes = sanitizeString(updates.notes);

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.updateBooking(id, updates);
    if (!persistedToDatabase) {
      console.warn('[MongoDB Update Booking] tidak cocok dengan data di database');
    }
  } catch (err) {
    console.error('[MongoDB Update Booking Error]:', err);
  }

  // Always update in-memory (persist=false since route already handled MongoDB)
  const updated = serverStore.updateBooking(id, updates, false);
  if (!updated) {
    return json({ error: 'Data booking tidak ditemukan.' }, 404);
  }

  // Alur "Selesai": buat transaksi otomatis bila belum ada untuk reservasi ini,
  // sehingga laporan keuangan selalu mencatat penjualan meskipun mengubah status
  // lewat dropdown (tanpa lewat modal pembayaran).
  if (updated.status === 'completed') {
    const alreadyHasTransaction = serverStore
      .getTransactions()
      .some((t) => t.bookingId === updated.id || t.bookingId === updated.bookingCode);
    if (!alreadyHasTransaction) {
      const nowIso = new Date().toISOString();
      const newTransaction: Transaction = {
        id: `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        invoiceNumber: `TRX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        bookingId: updated.id,
        customerName: updated.customerName,
        customerPhone: updated.customerPhone || undefined,
        barberId: updated.barberId || 'barber-1',
        barberName: updated.barberName || 'Staff Barber',
        items: [
          {
            serviceId: updated.serviceId,
            serviceName: updated.serviceName,
            price: updated.servicePrice,
            qty: 1,
          },
        ],
        subtotal: updated.totalAmount,
        discount: 0,
        totalAmount: updated.totalAmount,
        paymentMethod: 'cash',
        amountPaid: updated.totalAmount,
        changeAmount: 0,
        notes: `Auto dari reservasi ${updated.bookingCode}`,
        createdAt: nowIso,
      };

      let txPersisted = false;
      try {
        txPersisted = await mongoRepo.insertTransaction(newTransaction);
        if (!txPersisted) {
          console.error('[MongoDB Insert Auto Transaction] simpan gagal ke database');
        }
      } catch (err) {
        console.error('[MongoDB Insert Auto Transaction Error]:', err);
      }

      if (txPersisted) {
        serverStore.addTransaction(newTransaction, false);
        // Perbarui data pelanggan (dedupe by nomor) — hanya angka & nama digabung ulang
        if (updated.customerPhone) {
          mongoRepo
            .upsertCustomer(
              normalizeNickname(updated.customerName),
              normalizePhoneDigits(updated.customerPhone),
              updated.customerEmail,
            )
            .catch(() => {});
        }
        console.log(`[Booking] Transaksi auto dibuat untuk ${updated.bookingCode}`);
      }
    }
  }

  return json({ success: true, booking: updated });
}

// DELETE /api/bookings/:id - Hapus data reservasi (soft delete di MongoDB)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;

  try {
    await mongoRepo.deleteBooking(id);
  } catch (err) {
    console.error('[MongoDB Delete Booking Error]:', err);
  }

  const removed = serverStore.deleteBooking(id, false);
  if (!removed) {
    return json({ error: 'Data booking tidak ditemukan.' }, 404);
  }

  return json({ success: true, message: 'Data reservasi berhasil dihapus.' });
}
