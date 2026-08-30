import { serverStore } from '@server/state';
import { json, apiError } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// DELETE /api/transactions/:id
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang. Silakan login sebagai admin.', 401);
  }
  const { id } = await params;

  // Try MongoDB first, fall back to in-memory
  let persistedToDatabase = false;
  try {
    persistedToDatabase = await mongoRepo.deleteTransaction(id);
    if (!persistedToDatabase) {
      console.warn('[MongoDB Soft Delete Transaction] tidak cocok dengan data di database');
    }
  } catch (err) {
    console.warn('[MongoDB Soft Delete Transaction Error]:', err);
  }

  // Always delete from in-memory (persist=false since route already handled MongoDB)
  const deletedInMemory = serverStore.deleteTransaction(id, false);

  // Sukses bila salah satu berhasil. Instance serverless bisa kehilangan
  // state in-memory (cold start / recycle) padahal data ada di MongoDB —
  // JANGAN lapor 404 hanya karena memory tidak punya id-nya.
  if (!persistedToDatabase && !deletedInMemory) {
    return json({ error: 'Transaksi tidak ditemukan.' }, 404);
  }
  return json({
    success: true,
    message: persistedToDatabase
      ? 'Transaksi berhasil dihapus dari MongoDB.'
      : 'Transaksi berhasil dihapus (mode lokal).',
  });
}
