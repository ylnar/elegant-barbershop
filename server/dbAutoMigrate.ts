/**
 * Auto-migrate: menjalankan migrasi pending secara otomatis setiap
 * kali server start (`npm run dev` / produksi). Aman:
 *  - Tidak pernah membuat server gagal boot (error hanya di-log).
 *  - Migrasi dilacak di tabel app_migrations sehingga idempotent.
 *  - Bisa dimatikan dengan DB_AUTO_MIGRATE="false" di .env.
 */
import { dbConfig } from './config.ts';

export async function runAutoMigrate(): Promise<{ applied: string[]; skipped: number } | null> {
  if (!dbConfig.autoMigrate) {
    console.log('ℹ️  [DB Auto-Migrate] Dinonaktifkan (DB_AUTO_MIGRATE=false)');
    return null;
  }

  try {
    const lib = await import('../scripts/db-lib.mjs');
    const result = await lib.migratePending({
      logger: (msg: string) => console.log(`[DB Auto-Migrate] ${msg}`),
    });
    if (result.applied.length > 0) {
      console.log(
        `✅ [DB Auto-Migrate] ${result.applied.length} migrasi diterapkan: ${result.applied.join(', ')}`,
      );
    } else {
      console.log('✅ [DB Auto-Migrate] Skema database sudah mutakhir.');
    }
    return result;
  } catch (err) {
    console.warn('⚠️ [DB Auto-Migrate] Dilewati:', err instanceof Error ? err.message : err);
    console.warn(
      '   Jalankan "npm run db:doctor" untuk diagnosa, atau isi SUPABASE_DB_PASSWORD di .env lalu "npm run db:migrate".',
    );
    return null;
  }
}
