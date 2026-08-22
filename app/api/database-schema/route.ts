import { DATABASE_SCHEMA_BLUEPRINT } from '@/data/initialData';
import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/database-schema
export async function GET() {
  return json(DATABASE_SCHEMA_BLUEPRINT);
}
