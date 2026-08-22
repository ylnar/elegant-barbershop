import { Router } from 'express';
import { serverStore } from '../state.ts';
import { sanitizeString } from '../middleware/security.ts';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', (_req, res) => {
  res.json(serverStore.getSettings());
});

// PUT /api/settings
settingsRouter.put('/', (req, res) => {
  const updates = req.body;
  if (updates.shopName) updates.shopName = sanitizeString(updates.shopName);
  if (updates.tagline) updates.tagline = sanitizeString(updates.tagline);
  if (updates.address) updates.address = sanitizeString(updates.address);
  if (updates.phone) updates.phone = sanitizeString(updates.phone);
  if (updates.whatsappNumber) updates.whatsappNumber = sanitizeString(updates.whatsappNumber);

  const newSettings = serverStore.updateSettings(updates);
  res.json({
    success: true,
    settings: newSettings,
    message: 'Pengaturan sistem berhasil diperbarui.',
  });
});

// POST /api/settings/toggle-booking
settingsRouter.post('/toggle-booking', (req, res) => {
  const { isOpen } = req.body;
  const result = serverStore.toggleBookingSwitch(typeof isOpen === 'boolean' ? isOpen : undefined);
  res.json({
    success: true,
    isBookingOpen: result.isBookingOpen,
    message: result.message,
  });
});
