import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Track realtime subscription status
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use Promise.allSettled so one failing fetch doesn't break the rest
      const [settingsResult, servicesResult, barbersResult, bookingsResult, transactionsResult] =
        await Promise.allSettled([
          api.getSettings(),
          api.getServices(),
          api.getBarbers(),
          api.getBookings(),
          api.getTransactions(),
        ]);
      if (settingsResult.status === 'fulfilled') setSettings(settingsResult.value);
      if (servicesResult.status === 'fulfilled') setServices(servicesResult.value);
      if (barbersResult.status === 'fulfilled') setBarbers(barbersResult.value);
      if (bookingsResult.status === 'fulfilled') setBookings(bookingsResult.value);
      if (transactionsResult.status === 'fulfilled') setTransactions(transactionsResult.value);
      // Report first error if all failed
      const failures = [settingsResult, servicesResult, barbersResult, bookingsResult, transactionsResult]
        .filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some data loads failed:', failures.map((f) => (f as PromiseRejectedResult).reason?.message || f));
      }
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

    // Cleanup previous subscriptions
    subscriptionsRef.current.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        // ignore
      }
    });
    subscriptionsRef.current = [];

    // Listen to live booking additions or status changes
    const bookingsSub = subscribeToTable('bookings', (payload) => {
      console.log('[Realtime] Bookings event:', payload.eventType);
      api.getBookings().then((data) => setBookings(data)).catch(() => {});
    });

    // Listen to live transactions / POS checkout
    const transactionsSub = subscribeToTable('transactions', (payload) => {
      console.log('[Realtime] Transactions event:', payload.eventType);
      api.getTransactions().then((data) => setTransactions(data)).catch(() => {});
    });

    // Listen to live service/barber updates
    const servicesSub = subscribeToTable('services', (payload) => {
      console.log('[Realtime] Services event:', payload.eventType);
      api.getServices().then((data) => setServices(data)).catch(() => {});
    });

    const barbersSub = subscribeToTable('barbers', (payload) => {
      console.log('[Realtime] Barbers event:', payload.eventType);
      api.getBarbers().then((data) => setBarbers(data)).catch(() => {});
    });

    const settingsSub = subscribeToTable('system_settings', (payload) => {
      console.log('[Realtime] Settings event:', payload.eventType);
      api.getSettings().then((data) => setSettings(data)).catch(() => {});
    });

    // Store subscriptions for cleanup
    if (bookingsSub) subscriptionsRef.current.push(bookingsSub);
    if (transactionsSub) subscriptionsRef.current.push(transactionsSub);
    if (servicesSub) subscriptionsRef.current.push(servicesSub);
    if (barbersSub) subscriptionsRef.current.push(barbersSub);
    if (settingsSub) subscriptionsRef.current.push(settingsSub);

    return () => {
      window.removeEventListener('focus', handleFocus);
      subscriptionsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {
          // ignore
        }
      });
      subscriptionsRef.current = [];
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
