import { NextRequest } from 'next/server';
import { json, apiError, corsPreflightResponse } from '@lib/api';
import { mongoRepo } from '@server/mongoRepo';
import { requireAdminSession } from '@server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** CORS preflight untuk Android app. */
export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * PUT /api/trash/[type]/[id] — Restore item dari soft-delete
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang.', 401);
  }

  const { type, id } = params;
  if (!['services', 'barbers', 'bookings', 'transactions', 'customers'].includes(type)) {
    return apiError('Tipe tidak valid.', 400);
  }

  const restored = await mongoRepo.restoreItem(type, id);
  if (!restored) {
    return apiError('Data tidak ditemukan atau gagal di-restore.', 404);
  }
  return json({ success: true, message: `Data berhasil dipulihkan.` });
}

/**
 * DELETE /api/trash/[type]/[id] — Hapus permanen satu item
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  if (!(await requireAdminSession(req))) {
    return apiError('Anda tidak berwenang.', 401);
  }

  const { type, id } = params;
  if (!['services', 'barbers', 'bookings', 'transactions', 'customers'].includes(type)) {
    return apiError('Tipe tidak valid.', 400);
  }

  const deleted = await mongoRepo.permanentDeleteItem(type, id);
  if (!deleted) {
    return apiError('Data tidak ditemukan.', 404);
  }
  return json({ success: true, message: `Data berhasil dihapus permanen.` });
}
