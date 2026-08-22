import { serverStore } from '@server/state';
import { Transaction } from '@/types';
import { json, queryOf, readBody, sanitizeString } from '@lib/api';
import { getServerSupabase } from '@server/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/transactions
export async function GET(req: Request) {
  const sp = queryOf(req);
  const date = sp.get('date');
  const paymentMethod = sp.get('paymentMethod');
  const search = sp.get('search');
  const supabase = getServerSupabase();

  if (supabase) {
    try {
      let query = supabase.from('transactions').select('*').eq('is_deleted', false).order('created_at', { ascending: false });

      if (date) {
        // Convert local WIB date (UTC+7) to UTC range for proper comparison
        const startUTC = new Date(`${date}T00:00:00+07:00`).toISOString();
        const endUTC = new Date(`${date}T23:59:59+07:00`).toISOString();
        query = query.gte('created_at', startUTC).lte('created_at', endUTC);
      }
      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('payment_method', String(paymentMethod));
      }
      if (search) {
        const q = String(search);
        query = query.or(`invoice_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,barber_name.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const formatted: Transaction[] = data.map((t: any) => ({
          id: t.id,
          invoiceNumber: t.invoice_number,
          bookingId: t.booking_id || undefined,
          customerName: t.customer_name,
          customerPhone: t.customer_phone || undefined,
          barberId: t.barber_id || 'barber-1',
          barberName: t.barber_name,
          items: Array.isArray(t.items) ? t.items : [],
          subtotal: Number(t.subtotal) || 0,
          discount: Number(t.discount) || 0,
          totalAmount: Number(t.total_amount) || 0,
          paymentMethod: t.payment_method || 'cash',
          amountPaid: Number(t.amount_paid) || 0,
          changeAmount: Number(t.change_amount) || 0,
          notes: t.notes || undefined,
          createdAt: t.created_at,
        }));
        return json(formatted);
      }
    } catch (err) {
      console.warn('[Supabase Transactions Error]:', err);
    }
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
    id: `trx-${Date.now()}`,
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

  // Try Supabase first, fall back to in-memory
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      // Direct insert with full data (items JSONB, barber_id, etc.)
      const { data: insData, error: insertError } = await supabase.from('transactions').insert({
        invoice_number: invoiceNumber,
        customer_name: cleanCustomerName,
        customer_phone: cleanCustomerPhone || null,
        barber_id: barberId && barberId.length > 20 ? barberId : null,
        barber_name: barberName,
        items: items || [],
        subtotal: newTransaction.subtotal,
        discount: newTransaction.discount,
        total_amount: newTransaction.totalAmount,
        payment_method: newTransaction.paymentMethod,
        payment_status: 'paid',
        amount_paid: newTransaction.amountPaid,
        change_amount: newTransaction.changeAmount,
        notes: cleanNotes || null,
      }).select().single();

      if (!insertError && insData) {
        newTransaction.id = insData.id;
        persistedToDatabase = true;
      } else {
        console.error('[Supabase Insert Transaction Error]:', insertError?.message);
        // Fallback: try RPC
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('fn_create_pos_transaction', {
            p_invoice_number: invoiceNumber,
            p_booking_id: bookingId && bookingId.length > 20 ? bookingId : null,
            p_customer_name: cleanCustomerName,
            p_customer_phone: cleanCustomerPhone || null,
            p_barber_id: barberId && barberId.length > 20 ? barberId : null,
            p_barber_name: barberName,
            p_items: items,
            p_subtotal: newTransaction.subtotal,
            p_discount: newTransaction.discount,
            p_total_amount: newTransaction.totalAmount,
            p_payment_method: newTransaction.paymentMethod,
            p_amount_paid: newTransaction.amountPaid,
            p_change_amount: newTransaction.changeAmount,
            p_notes: cleanNotes || null,
          });
          if (!rpcError && rpcData) {
            newTransaction.id = rpcData.id;
            newTransaction.invoiceNumber = rpcData.invoice_number || invoiceNumber;
            persistedToDatabase = true;
            // Ensure items are saved (RPC may not handle p_items correctly)
            await supabase.from('transactions').update({ items: items || [] }).eq('id', rpcData.id);
          }
        } catch {
          // RPC also failed, will use in-memory
        }
      }
    } catch (err) {
      console.error('[Supabase Insert Transaction Error]:', err);
    }
  }

  // Always store in-memory (persist=false since route already handled Supabase)
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
