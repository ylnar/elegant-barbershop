import { checkMongoStatus } from '@server/mongodb';
import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/database/status
export async function GET() {
  const status = await checkMongoStatus();
  return json(status);
}