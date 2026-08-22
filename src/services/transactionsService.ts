import { Transaction, TransactionItem } from '../types';
import { INITIAL_TRANSACTIONS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { toLocalDateStr } from '../utils/formatters';
import { fetchTransactionsLive, dbCreateTransaction, dbDeleteTransaction, getSupabaseClient } from './supabaseClient';

export const transactionsService = {
  async getTransactions(filters?: { date?: string; paymentMethod?: string; search?: string }): Promise<Transaction[]> {
    // 1. Direct Supabase client
    try {
      const liveTransactions = await fetchTransactionsLive();
      if (liveTransactions !== null) {
        setLocal(STORAGE_KEYS.TRANSACTIONS, liveTransactions);
        let list = liveTransactions;
        if (filters?.date) {
          list = list.filter((t) => toLocalDateStr(t.createdAt) === filters.date!);
        }
        if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
          list = list.filter((t) => t.paymentMethod === filters.paymentMethod);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (t) =>
              t.invoiceNumber.toLowerCase().includes(q) ||
              t.customerName.toLowerCase().includes(q) ||
              (t.customerPhone && t.customerPhone.includes(q))
          );
        }
        return list;
      }
    } catch {
      // Fall through to local cache
    }

    // 2. Local cache fallback
    let list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    if (filters?.date) {
      list = list.filter((t) => toLocalDateStr(t.createdAt) === filters.date!);
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      list = list.filter((t) => t.paymentMethod === filters.paymentMethod);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.invoiceNumber.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          (t.customerPhone && t.customerPhone.includes(q))
      );
    }
    return list;
  },

  async createTransaction(transactionData: {
    bookingId?: string;
    customerName: string;
    customerPhone?: string;
    barberId: string;
    items: TransactionItem[];
    subtotal: number;
    discount?: number;
    totalAmount: number;
    paymentMethod: 'cash' | 'qris' | 'transfer' | 'debit';
    amountPaid: number;
    changeAmount: number;
    notes?: string;
  }): Promise<Transaction> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase belum terkonfigurasi.');

    // Fetch barber name
    let barberName = 'Staff Barber';
    if (transactionData.barberId && transactionData.barberId.length > 10) {
      const { data: barberData } = await client
        .from('barbers')
        .select('name')
        .eq('id', transactionData.barberId)
        .single();
      if (barberData) barberName = barberData.name;
    }

    // Generate invoice number
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `TRX-${new Date().getFullYear()}-${randomSuffix}`;

    const created = await dbCreateTransaction({
      invoiceNumber,
      bookingId: transactionData.bookingId,
      customerName: transactionData.customerName || 'Tamu Umum (Walk-in)',
      customerPhone: transactionData.customerPhone,
      barberId: transactionData.barberId,
      barberName,
      items: transactionData.items,
      subtotal: Math.max(0, transactionData.subtotal || transactionData.totalAmount),
      discount: Math.max(0, transactionData.discount || 0),
      totalAmount: Math.max(0, transactionData.totalAmount),
      paymentMethod: transactionData.paymentMethod || 'cash',
      amountPaid: Math.max(0, transactionData.amountPaid || transactionData.totalAmount),
      changeAmount: Math.max(0, transactionData.changeAmount || 0),
      notes: transactionData.notes,
    });

    // Update local cache
    const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    list.unshift(created);
    setLocal(STORAGE_KEYS.TRANSACTIONS, list);

    return created;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    // Try Supabase first — only if ID is a valid UUID (length > 20)
    if (id.length > 20) {
      try {
        await dbDeleteTransaction(id);
      } catch (e: any) {
        console.error('[Supabase Delete Transaction]:', e.message);
        throw e;
      }
      // ✅ Update local cache after successful Supabase delete
      const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS).filter((t) => t.id !== id);
      setLocal(STORAGE_KEYS.TRANSACTIONS, list);
      return true;
    }

    // Local-only fallback when Supabase is not configured
    const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS).filter((t) => t.id !== id);
    setLocal(STORAGE_KEYS.TRANSACTIONS, list);
    return true;
  },
};
