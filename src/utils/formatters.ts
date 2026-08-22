/** Get today's date string in local timezone (YYYY-MM-DD) */
export function getLocalTodayStr(): string {
  return getLocalDateStr(0);
}

/** Get a local-timezone date string offset by N days from today (avoids UTC bugs of toISOString) */
export function getLocalDateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Sanitasi input nomor WhatsApp: angka saja, maksimal 16 digit */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^0-9]/g, '').slice(0, 16);
}

/**
 * Validasi nomor WhatsApp Indonesia.
 * Format valid: 08xxxxxxxxxx (10–13 digit) atau 62xxxxxxxxxx (10–14 digit).
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, '');
  return /^(08\d{8,11}|628\d{7,11})$/.test(digits);
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndonesian(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeSlot(time: string): string {
  return `${time} WIB`;
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'confirmed':
      return { label: 'Terkonfirmasi', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'in_service':
      return { label: 'Sedang Dilayani', bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' };
    case 'completed':
      return { label: 'Selesai', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'cancelled':
      return { label: 'Dibatalkan', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'pending':
    default:
      return { label: 'Menunggu Konfirmasi', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
  }
}

/** Normalisasi nomor Indonesia ke format internasional (08xx -> 628xx) */
export function normalizePhoneForWa(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

/**
 * Generate link WhatsApp KONFIRMASI BOOKING dari sisi pelanggan ke admin outlet.
 * Pesan ditulis dari sudut pandang pelanggan yang menyampaikan tiket reservasinya.
 */
export function generateBookingConfirmationLink(
  shopPhone: string,
  customerName: string,
  bookingCode: string,
  serviceName: string,
  barberName: string,
  date: string,
  timeSlot: string,
  totalPrice: number
): string {
  let message = `Halo min, saya mau booking 🙏\n\n`;
  message += `Saya sudah membuat tiket reservasi dengan rincian berikut:\n\n`;
  message += `🔖 *Kode Reservasi:* ${bookingCode}\n`;
  message += `👤 *Nama:* ${customerName}\n`;
  message += `✂️ *Layanan:* ${serviceName}\n`;
  message += `💈 *Master Barber:* ${barberName}\n`;
  message += `📅 *Jadwal:* ${formatDateIndonesian(date)}\n`;
  message += `⏰ *Jam Datang:* ${timeSlot} WIB\n`;
  message += `💵 *Total Biaya:* ${formatIDR(totalPrice)}\n\n`;
  message += `Mohon dikonfirmasi ya min, terima kasih! 💈`;

  return `https://wa.me/${normalizePhoneForWa(shopPhone)}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link for barber notification (internal message)
 */
export function generateBarberWhatsAppLink(
  barberPhone: string,
  customerName: string,
  bookingCode: string,
  serviceName: string,
  date: string,
  timeSlot: string,
  status: string
): string {
  const cleanPhone = barberPhone.replace(/[^0-9]/g, '').replace(/^0/, '62');

  const statusLabel = status === 'confirmed' ? '✅ TERKONFIRMASI'
    : status === 'in_service' ? '💇 SEDANG DILAYANI'
    : status === 'completed' ? '✔️ SELESAI'
    : status === 'cancelled' ? '❌ DIBATALKAN'
    : '⏳ PENDING';

  let message = `📋 *Info Booking Baru*\n\n`;
  message += `Kode: *${bookingCode}*\n`;
  message += `Tamu: *${customerName}*\n`;
  message += `Layanan: ${serviceName}\n`;
  message += `Jadwal: ${formatDateIndonesian(date)}, ${timeSlot} WIB\n`;
  message += `Status: ${statusLabel}\n\n`;
  message += `_Siapkan diri sebelum jadwal ya!_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link for customer status notification
 */
export function generateCustomerWhatsAppLink(
  customerPhone: string,
  customerName: string,
  bookingCode: string,
  serviceName: string,
  barberName: string,
  date: string,
  timeSlot: string,
  status: string
): string {
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62');

  let greeting = '';
  let body = '';

  switch (status) {
    case 'confirmed':
      greeting = `Halo Kak *${customerName}* 👋`;
      body = `Reservasi Anda sudah *TERKONFIRMASI* ✅\n\n`;
      body += `🔖 *Kode:* ${bookingCode}\n`;
      body += `✂️ *Layanan:* ${serviceName}\n`;
      body += `💈 *Barber:* ${barberName}\n`;
      body += `📅 *Jadwal:* ${formatDateIndonesian(date)}, ${timeSlot} WIB\n\n`;
      body += `📍 *Lokasi:* Jl. Perwira, VI Suku, Kota Solok\n`;
      body += `_Silakan hadir 5-10 menit sebelum jadwal ya! Sampai jumpa 💈✨_`;
      break;
    case 'in_service':
      greeting = `Halo Kak *${customerName}* 👋`;
      body = `Saat ini Anda *SEDANG DILAYANI* 💇\n\n`;
      body += `🔖 *Kode:* ${bookingCode}\n`;
      body += `✂️ *Layanan:* ${serviceName}\n`;
      body += `💈 *Barber:* ${barberName}\n\n`;
      body += `_Mohon menunggu dengan sabar. Terima kasih 🙏_`;
      break;
    case 'completed':
      greeting = `Halo Kak *${customerName}* 👋`;
      body = `Reservasi Anda sudah *SELESAI* ✔️\n\n`;
      body += `🔖 *Kode:* ${bookingCode}\n`;
      body += `✂️ *Layanan:* ${serviceName}\n`;
      body += `💈 *Barber:* ${barberName}\n\n`;
      body += `Terima kasih sudah berkunjung ke *Elegant Barbershop Solok*! 🙏\n`;
      body += `Semoga puas dengan hasilnya. Sampai jumpa lagi! 💈✨`;
      break;
    case 'cancelled':
      greeting = `Halo Kak *${customerName}* 👋`;
      body = `Reservasi Anda *DIBATALKAN* ❌\n\n`;
      body += `🔖 *Kode:* ${bookingCode}\n`;
      body += `✂️ *Layanan:* ${serviceName}\n\n`;
      body += `Jika ada yang salah, silakan buat reservasi baru. Terima kasih 🙏`;
      break;
    default: // pending
      greeting = `Halo Kak *${customerName}* 👋`;
      body = `Reservasi Anda sedang *MENUNGGU KONFIRMASI* ⏳\n\n`;
      body += `🔖 *Kode:* ${bookingCode}\n`;
      body += `✂️ *Layanan:* ${serviceName}\n`;
      body += `💈 *Barber:* ${barberName}\n`;
      body += `📅 *Jadwal:* ${formatDateIndonesian(date)}, ${timeSlot} WIB\n\n`;
      body += `_Kami akan segera mengkonfirmasi reservasi Anda. Mohon tunggu 🙏_`;
      break;
  }

  const message = `${greeting}\n\n${body}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
