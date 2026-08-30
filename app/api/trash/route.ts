import { NextRequest } from 'next/server';
import { json, apiError, queryOf, readBody, corsPreflightResponse } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** CORS preflight untuk Android app. */
export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * GET /api/trash?type=services|barbers|bookings|transactions|customers
 * Ambil semua data yang sudah di-soft-delete. Admin session required.
 */
export async function GET(req: Request) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang.', 401);
  }

  const sp = queryOf(req);
  const type = sp.get('type') || undefined;

  const items = await mongoRepo.fetchDeletedItems(type);
  return json(items);
}

/**
 * DELETE /api/trash?type=services  — Hapus permanen semua item soft-deleted tertentu
 * Body: { type: string }
 */
export async function DELETE(req: Request) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang.', 401);
  }

  const body = await readBody(req);
  const type = body.type as string | undefined;
  if (!type || !['services', 'barbers', 'bookings', 'transactions', 'customers'].includes(type)) {
    return apiError('Tipe tidak valid. Gunakan: services, barbers, bookings, transactions, atau customers.', 400);
  }

  const count = await mongoRepo.permanentDeleteAll(type);
  return json({ success: true, deleted: count, message: `${count} data ${type} dihapus permanen.` });
}
