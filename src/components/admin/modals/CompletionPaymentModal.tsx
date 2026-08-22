import React, { useState, useEffect, useMemo } from 'react';
import { Booking, PaymentMethod } from '../../../types';
import { formatIDR } from '../../../utils/formatters';
import {
  X,
  CheckCircle2,
  Banknote,
  QrCode,
  Building,
  User,
  Scissors,
  Clock,
} from 'lucide-react';

interface CompletionPaymentModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (paymentMethod: PaymentMethod, amountPaid: number) => Promise<void>;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote; color: string }[] = [
  { value: 'cash', label: 'Tunai', icon: Banknote, color: 'border-amber-500/50 bg-amber-500/10 text-amber-300' },
  { value: 'qris', label: 'QRIS', icon: QrCode, color: 'border-blue-500/50 bg-blue-500/10 text-blue-300' },
  { value: 'transfer', label: 'Transfer', icon: Building, color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
];

export const CompletionPaymentModal: React.FC<CompletionPaymentModalProps> = ({
  isOpen,
  booking,
  onClose,
  onConfirm,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset when modal opens with new booking
  useEffect(() => {
    if (isOpen && booking) {
      setPaymentMethod('cash');
      setAmountPaid(booking.totalAmount);
    }
  }, [isOpen, booking]);

  const changeAmount = useMemo(() => {
    if (!booking) return 0;
    return Math.max(0, amountPaid - booking.totalAmount);
  }, [amountPaid, booking]);

  const isValid = useMemo(() => {
    if (!booking) return false;
    return amountPaid >= booking.totalAmount;
  }, [amountPaid, booking]);

  // Quick-fill amount buttons for cash
  const quickAmounts = useMemo(() => {
    if (!booking) return [];
    const total = booking.totalAmount;
    const amounts: number[] = [total];
    // Add common round amounts above total
    if (total <= 50000) amounts.push(50000, 100000);
    else if (total <= 100000) amounts.push(100000, 200000);
    else if (total <= 200000) amounts.push(200000, 500000);
    else if (total <= 500000) amounts.push(500000);
    // Deduplicate and sort
    return [...new Set(amounts)].sort((a, b) => a - b);
  }, [booking?.totalAmount]);

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(paymentMethod, amountPaid);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F0F16] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 bg-[#141420] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-serif">Selesaikan Reservasi</h3>
              <p className="text-[11px] text-stone-400">Pilih metode bayar & input jumlah bayar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-white bg-stone-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Booking Info Card */}
          <div className="p-4 rounded-2xl bg-[#1A1A13] border border-[#D4AF37]/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Kode Reservasi</span>
              <span className="text-xs font-mono font-bold text-[#D4AF37]">{booking.bookingCode}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-medium">{booking.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <Scissors className="w-3.5 h-3.5 text-stone-400" />
              <span>{booking.serviceName}</span>
              <span className="text-stone-500">•</span>
              <span className="font-medium">{booking.barberName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{booking.date} • {booking.timeSlot} WIB</span>
            </div>
            <div className="pt-2.5 border-t border-[#D4AF37]/15 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Total Bayar</span>
              <span className="text-lg font-extrabold font-mono text-[#D4AF37]">{formatIDR(booking.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Metode Pembayaran</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const selected = paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? pm.color + ' border-current shadow-md'
                        : 'border-stone-800 bg-[#12121A] text-stone-400 hover:border-stone-600 hover:text-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Paid Input */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Jumlah Bayar</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-500 font-mono">Rp</span>
              <input
                type="number"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1B1B26] border border-stone-700 text-white text-sm font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                placeholder="0"
              />
            </div>

            {/* Quick amount buttons (for cash) */}
            {paymentMethod === 'cash' && (
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPaid(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                      amountPaid === amt
                        ? 'bg-[#D4AF37] text-stone-950'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {formatIDR(amt)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Change Amount */}
          {changeAmount > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Kembalian</span>
              <span className="text-sm font-extrabold font-mono text-emerald-400">{formatIDR(changeAmount)}</span>
            </div>
          )}

          {amountPaid > 0 && amountPaid < booking.totalAmount && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300">Kurang</span>
              <span className="text-sm font-extrabold font-mono text-rose-400">{formatIDR(booking.totalAmount - amountPaid)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-800 bg-[#141420] flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            className="flex-[2] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            {isSubmitting ? 'Memproses...' : `Bayar & Selesaikan`}
          </button>
        </div>
      </div>
    </div>
  );
};
