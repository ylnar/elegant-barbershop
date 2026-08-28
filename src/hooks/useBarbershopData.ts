import { useState, useEffect, useCallback } from 'react';
import { SystemSettings, Service, Barber, Booking, Transaction } from '../types';
import { api } from '../services/api';
import { clearStaleCacheIfNeeded } from '../services/storage';

// Clear stale localStorage cache on first load
if (typeof window !== 'undefined') clearStaleCacheIfNeeded();

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

  // Polling (MongoDB tidak punya realtime client-side) + auto-refresh saat tab fokus
  useEffect(() => {
    // Re-fetch when user switches back to this browser tab
    const handleFocus = () => {
      loadData();
    };
    // Also handle visibility change (mobile tab switch, minimize, etc.)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Lightweight polling sebagai pengganti realtime subscription
    const pollingInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollingInterval);
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