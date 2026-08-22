import { serverStore } from '@server/state';
import { json, readBody, sanitizeString } from '@lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/settings
export async function GET() {
  return json(serverStore.getSettings());
}

// PUT /api/settings
export async function PUT(req: Request) {
  const updates = await readBody(req);
  if (updates.shopName) updates.shopName = sanitizeString(updates.shopName);
  if (updates.tagline) updates.tagline = sanitizeString(updates.tagline);
  if (updates.address) updates.address = sanitizeString(updates.address);
  if (updates.phone) updates.phone = sanitizeString(updates.phone);
  if (updates.whatsappNumber) updates.whatsappNumber = sanitizeString(updates.whatsappNumber);

  const newSettings = serverStore.updateSettings(updates);
  return json({
    success: true,
    settings: newSettings,
    message: 'Pengaturan sistem berhasil diperbarui.',
  });
}
