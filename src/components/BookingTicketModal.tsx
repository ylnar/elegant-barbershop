import React from 'react';
import {
  X,
  Scissors,
  Calendar,
  Clock,
  User,
  CheckCircle,
  MessageCircle,
  Download,
  Share2,
  MapPin,
  QrCode,
} from 'lucide-react';
import { Booking, SystemSettings } from '../types';
import { formatIDR, formatDateIndonesian, generateWhatsAppLink } from '../utils/formatters';

interface BookingTicketModalProps {
  booking: Booking | null;
  settings: SystemSettings;
  onClose: () => void;
}

export const BookingTicketModal: React.FC<BookingTicketModalProps> = ({
  booking,
  settings,
  onClose,
}) => {
  if (!booking) return null;

  const waLink = generateWhatsAppLink(
    booking.customerPhone,
    booking.customerName,
    booking.bookingCode,
    booking.serviceName,
    booking.barberName,
    booking.date,
    booking.timeSlot,
    booking.totalAmount,
    booking.status
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[#14141C] border border-[#D4AF37]/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#2B2313] via-[#1B1B24] to-[#2B2313] px-6 py-4 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.2em] text-[#D4AF37] uppercase font-semibold block">
                ELEGANT BARBERSHOP SOLOK
              </span>
              <h3 className="text-sm font-bold text-white font-serif">Tiket Reservasi Digital</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800/60 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Boarding Pass Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status & Booking Code Banner */}
          <div className="text-center p-4 rounded-2xl bg-[#0D0D12] border border-stone-800">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Reservasi Berhasil Dibuat</span>
            </div>
            <p className="text-xs text-stone-400 uppercase tracking-wider">Kode Reservasi Anda</p>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#D4AF37] font-mono tracking-widest my-1">
              {booking.bookingCode}
            </div>
            <p className="text-[11px] text-stone-400">
              Tunjukkan kode ini kepada concierge resepsionis saat tiba di outlet.
            </p>
          </div>

          {/* Ticket Details Grid */}
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400 flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" />
                Nama Tamu
              </span>
              <span className="font-bold text-white text-sm">{booking.customerName}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#D4AF37]" />
                Layanan
              </span>
              <span className="font-bold text-white text-right">{booking.serviceName}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400 flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" />
                Master Barber
              </span>
              <span className="font-semibold text-[#D4AF37]">{booking.barberName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-b border-stone-800">
              <div>
                <span className="text-stone-400 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Tanggal
                </span>
                <span className="font-medium text-white">{formatDateIndonesian(booking.date)}</span>
              </div>
              <div>
                <span className="text-stone-400 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Waktu Kedatangan
                </span>
                <span className="font-bold text-[#D4AF37] text-sm">{booking.timeSlot} WIB</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-400">Total Biaya Perawatan</span>
              <span className="font-extrabold text-white text-base font-serif">
                {formatIDR(booking.totalAmount)}
              </span>
            </div>
          </div>

          {/* Location note */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#181822] border border-stone-800 text-[11px] text-stone-300">
            <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">{settings.shopName}</span>
              <span>{settings.address}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
            >
              <MessageCircle className="w-4 h-4 fill-stone-950" />
              <span>Simpan & Buka Rincian di WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#1C1C28] hover:bg-[#252535] text-stone-300 font-semibold text-xs transition-colors border border-stone-700"
            >
              Tutup & Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
