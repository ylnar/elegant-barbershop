export interface ResolvedConnection {
  url: string;
  source: string;
}

export interface MigrateResult {
  applied: string[];
  skipped: number;
}

export declare function maskUrl(url: string): string;
export declare function getProjectRef(): string | null;
export declare function getDbPassword(): string | null;
export declare function updateEnvFile(key: string, value: string): void;
export declare function resolveConnection(opts?: {
  persist?: boolean;
  logger?: (...args: unknown[]) => void;
}): Promise<ResolvedConnection | null>;
export declare function listMigrationFiles(): string[];
export declare function createClientFromUrl(url: string): import('pg').Client;
export declare function ensureMigrationsTable(client: import('pg').Client): Promise<void>;
export declare function getApplied(client: import('pg').Client): Promise<string[]>;
export declare function applyOne(
  client: import('pg').Client,
  file: string,
  opts?: { logger?: (...args: unknown[]) => void }
): Promise<boolean>;
export declare function migratePending(opts?: {
  logger?: (...args: unknown[]) => void;
}): Promise<MigrateResult>;
