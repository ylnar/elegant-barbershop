import { useState, useEffect, useCallback } from 'react';
import { SystemSettings, Service, Barber, Booking, Transaction } from '../types';
import { api } from '../services/api';
import { subscribeToTable, isSupabaseConfigured } from '../services/supabaseClient';

export function useBarbershopData() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedSettings, fetchedServices, fetchedBarbers, fetchedBookings, fetchedTransactions] =
        await Promise.all([
          api.getSettings(),
          api.getServices(),
          api.getBarbers(),
          api.getBookings(),
          api.getTransactions(),
        ]);
      setSettings(fetchedSettings);
      setServices(fetchedServices);
      setBarbers(fetchedBarbers);
      setBookings(fetchedBookings);
      setTransactions(fetchedTransactions);
    } catch (err: any) {
      console.error('Failed to load barbershop data:', err);
      setError(err?.message || 'Gagal memuat data barbershop');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime Supabase PostgreSQL listeners & auto-refocus refresh
  useEffect(() => {
    // Re-fetch when user switches back to this browser tab
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    if (!isSupabaseConfigured()) {
      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }

    // Listen to live booking additions or status changes
    const bookingsSub = subscribeToTable('bookings', () => {
      api.getBookings().then((data) => setBookings(data)).catch(() => {});
    });

    // Listen to live transactions / POS checkout
    const transactionsSub = subscribeToTable('transactions', () => {
      api.getTransactions().then((data) => setTransactions(data)).catch(() => {});
    });

    // Listen to live service/barber updates
    const servicesSub = subscribeToTable('services', () => {
      api.getServices().then((data) => setServices(data)).catch(() => {});
    });

    const barbersSub = subscribeToTable('barbers', () => {
      api.getBarbers().then((data) => setBarbers(data)).catch(() => {});
    });

    const settingsSub = subscribeToTable('system_settings', () => {
      api.getSettings().then((data) => setSettings(data)).catch(() => {});
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      bookingsSub?.unsubscribe();
      transactionsSub?.unsubscribe();
      servicesSub?.unsubscribe();
      barbersSub?.unsubscribe();
      settingsSub?.unsubscribe();
    };
  }, [loadData]);

  const addBooking = useCallback((newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
  }, []);

  const addTransaction = useCallback((newTransaction: Transaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
  }, []);

  return {
    settings,
    services,
    barbers,
    bookings,
    transactions,
    loading,
    error,
    refreshData: loadData,
    addBooking,
    addTransaction,
    setSettings,
    setServices,
    setBarbers,
    setBookings,
    setTransactions,
  };
}

