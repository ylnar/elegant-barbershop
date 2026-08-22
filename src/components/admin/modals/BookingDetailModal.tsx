import React from 'react';
import { Booking, BookingStatus } from '../../../types';
import { formatIDR, formatDateIndonesian, getStatusBadge } from '../../../utils/formatters';
import {
  X,
  CalendarCheck,
  User,
  Phone,
  Scissors,
  Clock,
  Hash,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface BookingDetailModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onStatusChange?: (bookingId: string, status: BookingStatus) => void;
}

const formatDateTime = (isoStr: string) => {
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(d) + ' WIB';
  } catch {
    return isoStr;
  }
};

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  booking,
  onClose,
  onStatusChange,
}) => {
  if (!isOpen || !booking) return null;

  const b = booking;
  const badge = getStatusBadge(b.status);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F0F16] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#141420] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                Detail Reservasi
              </h3>
              <p className="text-[11px] text-stone-400">
                Rincian lengkap tiket reservasi pelanggan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white bg-stone-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Booking Code & Status Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A13] border border-[#D4AF37]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                  Kode Reservasi
                </span>
                <span className="text-base font-extrabold font-mono text-[#D4AF37] block">
                  {b.bookingCode}
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{badge.label}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#12121A] border border-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
                <User className="w-3 h-3" />
                <span>Pelanggan</span>
              </div>
              <span className="text-sm font-bold text-white block">
                {b.customerName}
              </span>
              {b.customerPhone && (
                <div className="flex items-center gap-1 text-[11px] text-stone-400">
                  <Phone className="w-3 h-3" />
                  <span className="font-mono">{b.customerPhone}</span>
                </div>
              )}
              {b.isWalkIn && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5 mt-1">
                  Walk-in
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#12121A] border border-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
                <Scissors className="w-3 h-3" />
                <span>Barber</span>
              </div>
              <span className="text-sm font-bold text-white block">
                {b.barberName}
              </span>
              <span className="text-[10px] text-stone-500 block">
                Master Barber
              </span>
            </div>
          </div>

          {/* Service & Schedule */}
          <div className="p-4 rounded-2xl bg-[#12121A] border border-stone-800 space-y-3">
            <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
              <FileText className="w-3 h-3" />
              <span>Layanan & Jadwal</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Layanan</span>
                <span className="font-semibold text-white">{b.serviceName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Harga Layanan</span>
                <span className="font-mono font-bold text-[#D4AF37]">{formatIDR(b.servicePrice)}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800">
                <span className="text-stone-400">Tanggal Kedatangan</span>
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>{formatDateIndonesian(b.date)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Jam Kedatangan</span>
                <span className="font-mono font-bold text-[#D4AF37]">{b.timeSlot} WIB</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800">
                <span className="font-bold text-white text-sm">Total Bayar</span>
                <span className="font-mono font-extrabold text-[#D4AF37] text-lg">{formatIDR(b.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Status Change */}
          {onStatusChange && (
            <div className="p-4 rounded-2xl bg-[#12121A] border border-stone-800 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                Ubah Status
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { value: 'pending' as BookingStatus, label: 'Menunggu', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' },
                  { value: 'confirmed' as BookingStatus, label: 'Konfirmasi', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25' },
                  { value: 'in_service' as BookingStatus, label: 'Dilayani', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25' },
                  { value: 'completed' as BookingStatus, label: 'Selesai', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' },
                  { value: 'cancelled' as BookingStatus, label: 'Batal', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25' },
                ]).map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      onStatusChange(b.id, s.value);
                      onClose();
                    }}
                    className={`px-1.5 py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${s.color} ${
                      b.status === s.value ? 'ring-1 ring-current' : ''
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Dibuat: {formatDateTime(b.createdAt)}</span>
            </div>
            {b.updatedAt && b.updatedAt !== b.createdAt && (
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Diperbarui: {formatDateTime(b.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-[#141420] shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
};
