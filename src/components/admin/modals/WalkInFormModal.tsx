import React, { useState, useEffect } from 'react';
import { Service, Barber } from '../../../types';
import { formatIDR, sanitizePhoneInput, isValidWhatsAppNumber } from '../../../utils/formatters';
import { lookupCustomerByPhone } from '../../../services/customersService';

interface WalkInFormModalProps {
  isOpen: boolean;
  services: Service[];
  barbers: Barber[];
  onClose: () => void;
  onSave: (data: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    barberId: string;
  }) => Promise<void>;
}

export const WalkInFormModal: React.FC<WalkInFormModalProps> = ({
  isOpen,
  services,
  barbers,
  onClose,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [barberId, setBarberId] = useState('any');
  const [submitting, setSubmitting] = useState(false);
  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [customerFoundName, setCustomerFoundName] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [hasAutoFilled, setHasAutoFilled] = useState<boolean>(false);

  // Debounced phone lookup
  useEffect(() => {
    if (!customerPhone || customerPhone.length < 10 || !isValidWhatsAppNumber(customerPhone)) {
      setCustomerFound(null);
      setCustomerFoundName('');
      setHasAutoFilled(false);
      return;
    }
    if (hasAutoFilled) return;

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const result = await lookupCustomerByPhone(customerPhone);
        if (cancelled) return;
        if (result && result.name) {
          setCustomerFound(true);
          setCustomerFoundName(result.name);
          if (!customerName.trim()) {
            setCustomerName(result.name);
            setHasAutoFilled(true);
          }
        } else {
          setCustomerFound(false);
          setCustomerFoundName('');
          setHasAutoFilled(false);
        }
      } catch {
        if (!cancelled) {
          setCustomerFound(false);
          setCustomerFoundName('');
        }
      } finally {
        if (!cancelled) setIsLookingUp(false);
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [customerPhone, customerName, hasAutoFilled]);

  if (!isOpen) return null;

  const phoneValid = isValidWhatsAppNumber(customerPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !phoneValid) return;

    try {
      setSubmitting(true);
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceId: serviceId || services[0]?.id || '',
        barberId,
      });
      setCustomerName('');
      setCustomerPhone('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#14141C] border border-stone-800 p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white font-serif">Catat Tamu Walk-in Langsung</h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-stone-400 block mb-1">Nama Tamu Walk-In</label>
            <input
              type="text"
              required
              placeholder="e.g. Pak Hendra"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-stone-400 block mb-1">Nomor WhatsApp</label>
            <input
              type="tel"
              required
              inputMode="numeric"
              placeholder="e.g. 08123456789"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(sanitizePhoneInput(e.target.value))}
              className={`w-full px-3 py-2.5 rounded-lg bg-[#1B1B26] border text-white focus:outline-none transition-all ${
                customerPhone && !phoneValid
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-stone-700 focus:border-[#D4AF37]'
              }`}
            />
            {customerPhone && !phoneValid ? (
              <span className="text-[10px] text-rose-400 block mt-1">
                Format: 08xx / 628xx (10-13 digit).
              </span>
            ) : isLookingUp ? (
              <span className="text-[10px] text-sky-400 block mt-1">
                Mengecek data pelanggan...
              </span>
            ) : customerFound === true ? (
              <span className="text-[10px] text-emerald-400 block mt-1">
                ✓ Pelanggan dikenali: {customerFoundName}
              </span>
            ) : null}
          </div>

          <div>
            <label className="text-stone-400 block mb-1">Layanan</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#1B1B26] border border-stone-700 text-white focus:outline-none"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {formatIDR(s.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-stone-400 block mb-1">Pilih Barber</label>
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#1B1B26] border border-stone-700 text-white focus:outline-none"
            >
              <option value="any">Barber Siap Pertama</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || (!!customerPhone && !phoneValid)}
              className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Walk-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
