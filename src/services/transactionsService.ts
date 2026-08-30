import { Transaction, TransactionItem } from '../types';
import { INITIAL_TRANSACTIONS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { toLocalDateStr } from '../utils/formatters';
import { fetchTransactionsLive, fetchBarbersLive, dbCreateTransaction, dbDeleteTransaction } from './dbClient';

export const transactionsService = {
  async getTransactions(filters?: { date?: string; paymentMethod?: string; search?: string }): Promise<Transaction[]> {
    // 1. Ambil dari server (MongoDB via API routes)
    try {
      const liveTransactions = await fetchTransactionsLive(filters);
      if (liveTransactions !== null && liveTransactions.length > 0) {
        setLocal(STORAGE_KEYS.TRANSACTIONS, liveTransactions);
        return liveTransactions;
      }
    } catch {
      // Aksi lanjut ke cache lokal
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
          (t.customerPhone && t.customerPhone.includes(q)),
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
    paymentMethod: 'cash' | 'qris' | 'transfer';
    amountPaid: number;
    changeAmount: number;
    notes?: string;
  }): Promise<Transaction> {
    // Ambil nama barber dari server API
    let barberName = 'Staff Barber';
    if (transactionData.barberId && transactionData.barberId !== 'barber-1') {
      try {
        const barbers = await fetchBarbersLive();
        const barber = barbers?.find((b) => b.id === transactionData.barberId);
        if (barber) barberName = barber.name;
      } catch {
        // pakai default
      }
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
    try {
      await dbDeleteTransaction(id);
    } catch (e: any) {
      // 404 = data sudah tidak ada di server (instance serverless di-recycle /
      // data hanya hidup di cache lokal). Anggap sudah terhapus agar cache
      // lokal ikut dibersihkan dan UI tidak berhenti "tidak berubah apa-apa".
      if (e?.status === 404) {
        // fall through — bersihkan cache lokal
      } else {
        console.error('[DB Delete Transaction]:', e?.message || e);
        throw e;
      }
    }
    // Update local cache
    const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS).filter((t) => t.id !== id);
    setLocal(STORAGE_KEYS.TRANSACTIONS, list);
    return true;
  },
};