import crypto from 'node:crypto';

/**
 * Data awal untuk CLI MongoDB (scripts/db.mjs).
 *
 * NOTE: Sumber kebenaran data awal aplikasi adalah `src/data/initialData.ts`
 * (dipakai oleh server/mongoRepo.seedIfEmpty saat boot). Salinan di sini hanya
 * untuk CLI supaya bisa dijalankan tanpa boot server. Jaga agar tetap sinkron.
 */

export const INITIAL_SERVICES = [
  { id: 'srv-1', name: 'Premium', category: 'haircut', price: 45000, durationMinutes: 40, description: '', isActive: true },
  { id: 'srv-2', name: 'Premium kids', category: 'haircut', price: 30000, durationMinutes: 30, description: '', isActive: true },
  { id: 'srv-3', name: 'Kids ( SD Kebawah )', category: 'haircut', price: 20000, durationMinutes: 25, description: '', isActive: true },
  { id: 'srv-4', name: 'Basic Colour', category: 'treatment', price: 50000, durationMinutes: 45, description: '', isActive: true },
  { id: 'srv-5', name: 'Perming', category: 'treatment', price: 250000, durationMinutes: 90, description: '', isActive: true },
  { id: 'srv-6', name: 'Full Colour', category: 'treatment', price: 350000, durationMinutes: 120, description: '', isActive: true },
  { id: 'srv-7', name: 'Higtlight', category: 'treatment', price: 200000, durationMinutes: 75, description: '', isActive: true },
  { id: 'srv-8', name: 'full Bleching', category: 'treatment', price: 200000, durationMinutes: 90, description: '', isActive: true },
];

export const INITIAL_BARBERS = [
  { id: 'barber-1', name: 'Rian Pratama', isActive: true, workingDays: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'barber-2', name: 'Dimas Saputra', isActive: true, workingDays: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'barber-3', name: 'Aldi Wijaya', isActive: true, workingDays: [0, 1, 2, 3, 4, 5, 6] },
];

export const INITIAL_SETTINGS = {
  isBookingOpen: true,
  walkInOnlyMessage:
    'Saat ini kami memprioritaskan antrean langsung (Walk-in) di outlet Jl. Perwira Solok.',
  maintenanceMessage:
    'Sistem booking online sedang pemeliharaan. Silakan hubungi WhatsApp kami.',
  currentWalkInQueue: 2,
  estimatedWalkInWaitMinutes: 20,
  shopName: 'ELEGANT BARBERSHOP SOLOK',
  tagline: 'MASUAK CAYAH KALUA COGAH',
  address:
    '6J6W+VR7, Jl. Perwira, VI Suku, Kec. Lubuk Sikarah, Kota Solok, Sumatera Barat 27313',
  googleMapsUrl: 'https://maps.app.goo.gl/QRDFBXn7vS76o5f19',
  phone: '+62 838-2633-6104',
  whatsappNumber: '6283826336104',
  email: 'elegantbarbersolok@gmail.com',
  instagramHandle: '@elegantbarber.id',
  openTime: '10:00',
  closeTime: '22:00',
  slotIntervalMinutes: 30,
  maxSimultaneousBookingsPerSlot: 2,
  currency: 'IDR',
};

/**
 * Akun admin default untuk CLI. Password dipakai HANYA untuk membuat hash
 * saat seed — tidak pernah disimpan plaintext. Segerakkan nilainya dengan
 * server/adminAuth.ts (DEFAULT_ADMIN).
 */
export const DEFAULT_ADMIN = {
  id: 'admin-owner',
  username: 'owner',
  password: 'owner123',
  displayName: 'Owner',
  role: 'owner',
};

/** Hash password scrypt (sama dengan server/adminAuth.ts). */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { hash: crypto.scryptSync(String(password), salt, 64).toString('hex'), salt };
}