import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Service, Barber, PaymentMethod, Transaction } from '../../../types';
import { api } from '../../../services/api';
import {
  X,
  CreditCard,
  Scissors,
  Check,
  Search,
  DollarSign,
  QrCode,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  services: Service[];
  barbers: Barber[];
  onClose: () => void;
  onSuccess: (transaction: Transaction) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  services,
  barbers,
  onClose,
  onSuccess,
}) => {
  // Use ref to track if we've already initialized for current open
  const initializedRef = useRef(false);

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active services & barbers
  const activeServices = useMemo(() => services.filter((s) => s.isActive), [services]);
  const activeBarbers = useMemo(() => barbers.filter((b) => b.isActive), [barbers]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      initializedRef.current = false;
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      setDiscount(0);
      setAmountPaid(0);
      setNotes('');
      setSearchQuery('');
      setErrorMessage(null);
      setIsSubmitting(false);

      // Auto-select first barber and service
      if (activeBarbers.length > 0) {
        setSelectedBarberId(activeBarbers[0].id);
      }
      if (activeServices.length > 0) {
        setSelectedServiceId(activeServices[0].id);
      }
    }
  }, [isOpen, activeBarbers.length, activeServices.length]);

  // Update selectedBarberId if active barbers change and current selection is invalid
  React.useEffect(() => {
    if (activeBarbers.length > 0 && !activeBarbers.find((b) => b.id === selectedBarberId)) {
      setSelectedBarberId(activeBarbers[0].id);
    }
  }, [activeBarbers, selectedBarberId]);

  // Update selectedServiceId if active services change and current selection is invalid
  React.useEffect(() => {
    if (activeServices.length > 0 && !activeServices.find((s) => s.id === selectedServiceId)) {
      setSelectedServiceId(activeServices[0].id);
    }
  }, [activeServices, selectedServiceId]);

  const selectedService = useMemo(
    () => activeServices.find((s) => s.id === selectedServiceId),
    [activeServices, selectedServiceId]
  );

  const subtotal = selectedService ? selectedService.price : 0;
  const totalAmount = Math.max(0, subtotal - discount);
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, amountPaid - totalAmount) : 0;

  // Auto-set amountPaid when totalAmount changes
  React.useEffect(() => {
    if (paymentMethod !== 'cash' || amountPaid === 0 || amountPaid < totalAmount) {
      setAmountPaid(totalAmount);
    }
  }, [totalAmount, paymentMethod, amountPaid]);

  const formatRupiah = useCallback((val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return activeServices;
    return activeServices.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeServices, searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedService) {
      setErrorMessage('Silakan pilih minimal 1 layanan pangkas / perawatan.');
      return;
    }

    if (!selectedBarberId) {
      setErrorMessage('Silakan pilih barber yang melayani.');
      return;
    }

    if (paymentMethod === 'cash' && amountPaid < totalAmount) {
      setErrorMessage('Nominal uang tunai yang diterima kurang dari total bayar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalPaid = paymentMethod === 'cash' ? amountPaid : totalAmount;
      const finalChange = paymentMethod === 'cash' ? changeAmount : 0;

      const created = await api.createTransaction({
        customerName: customerName.trim() || 'Tamu Walk-in',
        customerPhone: customerPhone.trim() || undefined,
        barberId: selectedBarberId,
        items: [
          {
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            price: selectedService.price,
            qty: 1,
          },
        ],
        subtotal,
        discount,
        totalAmount,
        paymentMethod,
        amountPaid: finalPaid,
        changeAmount: finalChange,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setNotes('');
      setIsSubmitting(false);

      onSuccess(created);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Gagal memproses transaksi kasir.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F0F16] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#141420] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                Input Transaksi Kasir Baru
              </h3>
              <p className="text-[11px] text-stone-400">
                Pilih layanan, barber, dan proses pembayaran instan.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Pilih 1 Layanan (Single Select) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <span>1. Pilih Layanan</span>
              </label>

              {selectedService && (
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {selectedService.name} — {formatRupiah(selectedService.price)}
                </span>
              )}
            </div>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama layanan pangkas, perming, cat..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#141420] border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredServices.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1D1B13] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-sm'
                        : 'bg-[#12121A] border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="pr-2">
                      <span className={`text-xs font-bold block ${isSelected ? 'text-[#D4AF37]' : 'text-white'}`}>
                        {srv.name}
                      </span>
                      <span className="text-[11px] font-mono text-stone-400">
                        {formatRupiah(srv.price)}
                      </span>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-stone-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-stone-800/80 text-stone-500 flex items-center justify-center shrink-0">
                        <Scissors className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Pilih Barber Stylist */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
              2. Barber Stylist
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeBarbers.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <div
                    key={barber.id}
                    onClick={() => setSelectedBarberId(barber.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#1D1B13] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                        : 'bg-[#12121A] border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#1A1912] border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0">
                      <Scissors className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white block truncate">
                        {barber.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Data Pelanggan (Opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#12121A] border border-stone-800">
            <div>
              <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                Nama Pelanggan (Opsional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tamu Walk-in"
                className="w-full px-3 py-2 rounded-xl bg-[#171722] border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                Nomor WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2 rounded-xl bg-[#171722] border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* 4. Pembayaran, Diskon & Metode */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#12121A] border border-stone-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-stone-200 block mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37]'
                        : 'bg-[#181824] text-stone-300 border-stone-700'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'qris'
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37]'
                        : 'bg-[#181824] text-stone-300 border-stone-700'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37]'
                        : 'bg-[#181824] text-stone-300 border-stone-700'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>

              {/* Discount Input */}
              <div className="sm:w-44">
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  Potongan Diskon (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#181824] border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === 'cash' && (
              <div className="pt-3 border-t border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300 font-medium">Uang Diterima:</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={amountPaid === 0 ? '' : amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    placeholder="Nominal uang"
                    className="w-36 px-2.5 py-1 text-right rounded-lg bg-[#181824] border border-stone-700 text-xs font-mono font-bold text-white focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(totalAmount)}
                    className="px-2 py-1 rounded bg-[#1C1C2A] hover:bg-[#D4AF37] hover:text-stone-950 text-[10px] font-bold text-stone-300 transition-colors cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(50000)}
                    className="px-2 py-1 rounded bg-[#1C1C2A] hover:bg-[#D4AF37] hover:text-stone-950 text-[10px] font-bold text-stone-300 transition-colors cursor-pointer"
                  >
                    50k
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(100000)}
                    className="px-2 py-1 rounded bg-[#1C1C2A] hover:bg-[#D4AF37] hover:text-stone-950 text-[10px] font-bold text-stone-300 transition-colors cursor-pointer"
                  >
                    100k
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-stone-800 text-xs">
                  <span className="text-stone-400">Kembalian:</span>
                  <span className={`font-mono font-bold ${changeAmount >= 0 ? 'text-emerald-400 text-sm' : 'text-rose-400'}`}>
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Total & Submit Button */}
          <div className="p-4 rounded-2xl bg-[#141420] border border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                Total Tagihan Pembayaran
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-[#D4AF37]">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !selectedService}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses...' : 'Simpan Transaksi'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
