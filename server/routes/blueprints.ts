import { Router } from 'express';
import {
  DATABASE_SCHEMA_BLUEPRINT,
  SITEMAP_WORKFLOW_BLUEPRINT,
} from '../../src/data/initialData.ts';
import { checkServerSupabaseStatus } from '../supabase.ts';

export const blueprintsRouter = Router();

// GET /api/database/status
blueprintsRouter.get('/database/status', async (_req, res) => {
  const status = await checkServerSupabaseStatus();
  res.json(status);
});

// GET /api/database-schema
blueprintsRouter.get('/database-schema', (_req, res) => {
  res.json(DATABASE_SCHEMA_BLUEPRINT);
});

// GET /api/sitemap
blueprintsRouter.get('/sitemap', (_req, res) => {
  res.json(SITEMAP_WORKFLOW_BLUEPRINT);
});

