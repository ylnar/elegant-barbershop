import { serverStore } from '@server/state';
import { json } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// DELETE /api/transactions/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase && id.length > 20) {
    try {
      const { error } = await supabase.from('transactions').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.warn('[Supabase Soft Delete Transaction Error]:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase Soft Delete Transaction Error]:', err);
    }
  }

  // Always delete from in-memory (persist=false since route already handled Supabase)
  const deleted = serverStore.deleteTransaction(id, false);
  if (!deleted) {
    return json({ error: 'Transaksi tidak ditemukan.' }, 404);
  }
  return json({ success: true, message: 'Transaksi berhasil dihapus.' });
}
