import {
  DATABASE_SCHEMA_BLUEPRINT,
  SITEMAP_WORKFLOW_BLUEPRINT,
} from '../data/initialData';
import { checkSupabaseConnection, isSupabaseConfigured } from './supabaseClient';

export interface DatabaseStatusInfo {
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

export const blueprintService = {
  async getDatabaseStatus(): Promise<DatabaseStatusInfo> {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch server database status, testing client-side:', e);
    }

    // Client-side fallback check
    const isConfig = isSupabaseConfigured();
    const connCheck = await checkSupabaseConnection();

    return {
      isConfigured: isConfig,
      isConnected: connCheck.connected,
      supabaseUrlMasked: isConfig ? 'https://****.supabase.co' : null,
      mode: connCheck.connected ? 'supabase_live' : 'in_memory_fallback',
      tables: {
        categories: connCheck.connected,
        services: connCheck.connected,
        barbers: connCheck.connected,
        bookings: connCheck.connected,
        transactions: connCheck.connected,
      },
      message: connCheck.message,
    };
  },

  async getDatabaseSchema() {
    try {
      const res = await fetch('/api/database-schema');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using local schema blueprint:', e);
    }
    return DATABASE_SCHEMA_BLUEPRINT;
  },

  async getSitemap() {
    try {
      const res = await fetch('/api/sitemap');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using local sitemap blueprint:', e);
    }
    return SITEMAP_WORKFLOW_BLUEPRINT;
  },
};

