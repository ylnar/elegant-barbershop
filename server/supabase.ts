import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

// ── Singleton Client ─────────────────────────────────────────────────────────

let serverSupabaseInstance: SupabaseClient | null = null;
let lastUsedKey = '';

/**
 * Dapatkan Supabase client untuk server-side.
 * Menggunakan service role key (full access).
 * Singleton — hanya dibuat sekali per kombinasi key.
 */
export const getServerSupabase = (): SupabaseClient | null => {
  if (!supabaseConfig.isConfigured) return null;

  const { url, serverKey } = supabaseConfig;

  // Re-init jika key berubah (hot-reload friendly)
  if (!serverSupabaseInstance || lastUsedKey !== serverKey) {
    try {
      serverSupabaseInstance = createClient(url, serverKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      lastUsedKey = serverKey;
      const masked = url.replace(/^(https?:\/\/[^/]{6})[^/]+/, '$1****');
      console.log(`✅ [Supabase Server] Client initialized for ${masked}`);
    } catch (err) {
      console.warn('⚠️ Failed to initialize Supabase server client:', err);
      return null;
    }
  }

  return serverSupabaseInstance;
};

// ── Status Check ─────────────────────────────────────────────────────────────

export interface DatabaseStatusReport {
  isConfigured: boolean;
  isConnected: boolean;
  supabaseUrlMasked: string | null;
  mode: 'supabase_live' | 'in_memory_fallback';
  tables: {
    categories: boolean;
    services: boolean;
    barbers: boolean;
    bookings: boolean;
    transactions: boolean;
  };
  message: string;
}

export const checkServerSupabaseStatus = async (): Promise<DatabaseStatusReport> => {
  const mask = (s: string) => s.replace(/^(https?:\/\/[^/]{4})[^/]+/, '$1****');

  if (!supabaseConfig.isConfigured) {
    return {
      isConfigured: false,
      isConnected: false,
      supabaseUrlMasked: null,
      mode: 'in_memory_fallback',
      tables: {
        categories: false,
        services: false,
        barbers: false,
        bookings: false,
        transactions: false,
      },
      message:
        'Variabel SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum terisi. Server beroperasi dalam mode In-Memory.',
    };
  }

  const client = getServerSupabase();
  if (!client) {
    return {
      isConfigured: true,
      isConnected: false,
      supabaseUrlMasked: mask(supabaseConfig.url),
      mode: 'in_memory_fallback',
      tables: {
        categories: false,
        services: false,
        barbers: false,
        bookings: false,
        transactions: false,
      },
      message: 'Gagal menginisialisasi Supabase Client dengan kredensial yang diberikan.',
    };
  }

  try {
    const [catRes, srvRes, brbRes, bkgRes, trxRes] = await Promise.all([
      client.from('categories').select('id').limit(1),
      client.from('services').select('id').limit(1),
      client.from('barbers').select('id').limit(1),
      client.from('bookings').select('id').limit(1),
      client.from('transactions').select('id').limit(1),
    ]);

    const tables = {
      categories: !catRes.error,
      services: !srvRes.error,
      barbers: !brbRes.error,
      bookings: !bkgRes.error,
      transactions: !trxRes.error,
    };

    const hasAnyTable = Object.values(tables).some(Boolean);
    const firstError = [catRes, srvRes, brbRes, bkgRes, trxRes].find((result) => result.error)?.error;

    if (hasAnyTable) {
      return {
        isConfigured: true,
        isConnected: true,
        supabaseUrlMasked: mask(supabaseConfig.url),
        mode: 'supabase_live',
        tables,
        message: 'Koneksi ke Supabase PostgreSQL aktif dan tabel terdeteksi secara real-time!',
      };
    } else {
      return {
        isConfigured: true,
        isConnected: false,
        supabaseUrlMasked: mask(supabaseConfig.url),
        mode: 'in_memory_fallback',
        tables,
        message:
          firstError?.code === 'PGRST301' || firstError?.message?.toLowerCase().includes('jwt')
            ? 'Supabase API menolak key server (401). Ganti SUPABASE_SERVICE_ROLE_KEY dengan secret/service_role key yang valid dari Project Settings > API.'
            : `Supabase API tidak dapat membaca tabel. ${firstError?.message || 'Periksa kredensial dan RLS.'}`,
      };
    }
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      supabaseUrlMasked: mask(supabaseConfig.url),
      mode: 'in_memory_fallback',
      tables: {
        categories: false,
        services: false,
        barbers: false,
        bookings: false,
        transactions: false,
      },
      message: `Gagal menghubungi Supabase: ${err?.message || 'Network error'}`,
    };
  }
};
