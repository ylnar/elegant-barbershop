import React from 'react';
import { Transaction } from '../../../types';
import {
  X,
  ReceiptText,
  CreditCard,
  User,
  Scissors,
  Clock,
  Hash,
  Phone,
  DollarSign,
  FileText,
  CheckCircle2,
  Banknote,
  QrCode,
  Building,
} from 'lucide-react';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);
};

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
    }).format(d);
  } catch {
    return isoStr;
  }
};

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return <Banknote className="w-4 h-4" />;
    case 'qris':
      return <QrCode className="w-4 h-4" />;
    case 'transfer':
      return <Building className="w-4 h-4" />;
    default:
      return <CreditCard className="w-4 h-4" />;
  }
};

const getPaymentLabel = (method: string) => {
  switch (method) {
    case 'cash':
      return 'Tunai (Cash)';
    case 'qris':
      return 'QRIS';
    case 'transfer':
      return 'Transfer Bank';
    case 'debit':
      return 'Kartu Debit';
    default:
      return method.toUpperCase();
  }
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const t = transaction;
  const hasItems = t.items && t.items.length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F0F16] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#141420] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                Detail Transaksi
              </h3>
              <p className="text-[11px] text-stone-400">
                Rincian lengkap bukti transaksi kasir
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
          
          {/* Invoice Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A13] border border-[#D4AF37]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                  Nomor Invoice
                </span>
                <span className="text-base font-extrabold font-mono text-[#D4AF37] block">
                  {t.invoiceNumber}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>Lunas</span>
            </div>
          </div>

          {/* Customer & Barber Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#12121A] border border-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
                <User className="w-3 h-3" />
                <span>Pelanggan</span>
              </div>
              <span className="text-sm font-bold text-white block">
                {t.customerName || 'Tamu Walk-in'}
              </span>
              {t.customerPhone && (
                <div className="flex items-center gap-1 text-[11px] text-stone-400">
                  <Phone className="w-3 h-3" />
                  <span className="font-mono">{t.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#12121A] border border-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
                <Scissors className="w-3 h-3" />
                <span>Barber</span>
              </div>
              <span className="text-sm font-bold text-white block">
                {t.barberName}
              </span>
              <span className="text-[10px] text-stone-500 block">
                Master Barber
              </span>
            </div>
          </div>

          {/* Items / Layanan */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
              <FileText className="w-3 h-3" />
              <span>Rincian Layanan</span>
            </div>
            
            {hasItems ? (
              <div className="rounded-xl bg-[#12121A] border border-stone-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#0E0E16] text-[10px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                    <tr>
                      <th className="py-2.5 px-3.5 text-left font-semibold">Layanan</th>
                      <th className="py-2.5 px-3.5 text-center font-semibold">Qty</th>
                      <th className="py-2.5 px-3.5 text-right font-semibold">Harga</th>
                      <th className="py-2.5 px-3.5 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {t.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#1A1A28] transition-colors">
                        <td className="py-2.5 px-3.5 font-semibold text-white">
                          {item.serviceName}
                        </td>
                        <td className="py-2.5 px-3.5 text-center text-stone-300 font-mono">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-stone-300 font-mono">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#D4AF37]">
                          {formatRupiah(item.price * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#12121A] border border-dashed border-stone-800 text-center">
                <p className="text-xs text-stone-500">
                  Detail item tidak tersedia. Total transaksi: <strong className="text-[#D4AF37]">{formatRupiah(t.totalAmount)}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="p-4 rounded-2xl bg-[#12121A] border border-stone-800 space-y-3">
            <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
              <DollarSign className="w-3 h-3" />
              <span>Ringkasan Pembayaran</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Subtotal</span>
                <span className="font-mono text-stone-200">{formatRupiah(t.subtotal)}</span>
              </div>
              
              {t.discount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Diskon</span>
                  <span className="font-mono text-rose-400">-{formatRupiah(t.discount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800">
                <span className="font-bold text-white text-sm">Total Bayar</span>
                <span className="font-mono font-extrabold text-[#D4AF37] text-lg">{formatRupiah(t.totalAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800">
                <div className="flex items-center gap-1.5 text-stone-300">
                  {getPaymentIcon(t.paymentMethod)}
                  <span className="font-medium">{getPaymentLabel(t.paymentMethod)}</span>
                </div>
                <span className="font-mono text-stone-200">{formatRupiah(t.amountPaid)}</span>
              </div>

              {t.changeAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Kembalian</span>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(t.changeAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {t.notes && (
            <div className="p-3.5 rounded-xl bg-[#12121A] border border-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
                <FileText className="w-3 h-3" />
                <span>Catatan</span>
              </div>
              <p className="text-xs text-stone-300">{t.notes}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-stone-800/50">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDateTime(t.createdAt)}</span>
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
