import { SITEMAP_WORKFLOW_BLUEPRINT } from '@/data/initialData';
import { json } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/sitemap
export async function GET() {
  return json(SITEMAP_WORKFLOW_BLUEPRINT);
}
