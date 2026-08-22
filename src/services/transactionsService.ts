import { Transaction, TransactionItem, Barber } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_BARBERS } from '../data/initialData';
import { STORAGE_KEYS, getLocal, setLocal } from './storage';
import { fetchTransactionsLive } from './supabaseClient';

export const transactionsService = {
  async getTransactions(filters?: { date?: string; paymentMethod?: string; search?: string }): Promise<Transaction[]> {
    // 1. Try direct live client Supabase SDK
    try {
      const liveTransactions = await fetchTransactionsLive();
      if (liveTransactions && liveTransactions.length > 0) {
        setLocal(STORAGE_KEYS.TRANSACTIONS, liveTransactions);
        let list = liveTransactions;
        if (filters?.date) {
          list = list.filter((t) => t.createdAt.startsWith(filters.date!));
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
      // Fall through to server API
    }

    // 2. Fetch from backend server API
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocal(STORAGE_KEYS.TRANSACTIONS, data);
          return data;
        }
      }
    } catch {
      // Fall through to local cache
    }

    let list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    if (filters?.date) {
      list = list.filter((t) => t.createdAt.startsWith(filters.date!));
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
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
      if (res.ok) {
        const data = await res.json();
        const created = data.transaction;
        const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
        list.unshift(created);
        setLocal(STORAGE_KEYS.TRANSACTIONS, list);
        return created;
      }
    } catch {
      // Offline fallback
    }

    const barbers = getLocal<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
    const barber = barbers.find((b) => b.id === transactionData.barberId);
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    const newTx: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber: `TRX-${new Date().getFullYear()}-${randomSuffix}`,
      bookingId: transactionData.bookingId,
      customerName: transactionData.customerName || 'Tamu Umum (Walk-in)',
      customerPhone: transactionData.customerPhone,
      barberId: transactionData.barberId,
      barberName: barber ? barber.name : 'Staff Barber',
      items: transactionData.items,
      subtotal: transactionData.subtotal,
      discount: transactionData.discount || 0,
      totalAmount: transactionData.totalAmount,
      paymentMethod: transactionData.paymentMethod,
      amountPaid: transactionData.amountPaid,
      changeAmount: transactionData.changeAmount,
      notes: transactionData.notes,
      createdAt: new Date().toISOString(),
    };

    const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    list.unshift(newTx);
    setLocal(STORAGE_KEYS.TRANSACTIONS, list);
    return newTx;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS).filter((t) => t.id !== id);
        setLocal(STORAGE_KEYS.TRANSACTIONS, list);
        return true;
      }
    } catch {
      // Offline fallback
    }
    const list = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS).filter((t) => t.id !== id);
    setLocal(STORAGE_KEYS.TRANSACTIONS, list);
    return true;
  },
};

