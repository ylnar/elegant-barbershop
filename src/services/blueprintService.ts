import {
  DATABASE_SCHEMA_BLUEPRINT,
  SITEMAP_WORKFLOW_BLUEPRINT,
} from '../data/initialData';
import { checkDbConnection } from './dbClient';

export interface DatabaseStatusInfo {
  isConfigured: boolean;
  isConnected: boolean;
  dbName: string | null;
  uriMasked: string | null;
  mode: 'mongodb_live' | 'in_memory_fallback';
  tables: {
    categories: boolean;
    services: boolean;
    barbers: boolean;
    bookings: boolean;
    transactions: boolean;
    customers: boolean;
    admins: boolean;
    sessions: boolean;
  };
  message: string;
}

export const blueprintService = {
  async getDatabaseStatus(): Promise<DatabaseStatusInfo> {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const report = await res.json();
        return {
          isConfigured: Boolean(report?.isConfigured),
          isConnected: Boolean(report?.isConnected),
          dbName: report?.dbName || null,
          uriMasked: report?.uriMasked || null,
          mode: report?.mode === 'mongodb_live' ? 'mongodb_live' : 'in_memory_fallback',
          tables: {
            categories: !!(report?.collections?.services),
            services: !!(report?.collections?.services),
            barbers: !!(report?.collections?.barbers),
            bookings: !!(report?.collections?.bookings),
            transactions: !!(report?.collections?.transactions),
            customers: !!(report?.collections?.customers),
            admins: !!(report?.collections?.admins),
            sessions: !!(report?.collections?.sessions),
          },
          message: report?.message || '',
        };
      }
    } catch (e) {
      console.warn('Failed to fetch server database status, testing client-side:', e);
    }

    // Client-side fallback check
    const connCheck = await checkDbConnection();

    return {
      isConfigured: true,
      isConnected: connCheck.connected,
      dbName: null,
      uriMasked: null,
      mode: connCheck.connected ? 'mongodb_live' : 'in_memory_fallback',
      tables: {
        categories: connCheck.connected,
        services: connCheck.connected,
        barbers: connCheck.connected,
        bookings: connCheck.connected,
        transactions: connCheck.connected,
        customers: connCheck.connected,
        admins: connCheck.connected,
        sessions: connCheck.connected,
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