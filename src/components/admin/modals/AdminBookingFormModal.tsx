import React, { useEffect, useState } from 'react';
import { Barber, Service } from '../../../types';
import { formatIDR, getLocalTodayStr, isValidWhatsAppNumber } from '../../../utils/formatters';
import { lookupCustomerByPhone } from '../../../services/customersService';

interface AdminBookingFormModalProps {
  isOpen: boolean;
  services: Service[];
  barbers: Barber[];
  onClose: () => void;
  onSave: (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceId: string;
    barberId: string;
    date: string;
    timeSlot: string;
  }) => Promise<void>;
}

export const AdminBookingFormModal: React.FC<AdminBookingFormModalProps> = ({
  isOpen,
  services,
  barbers,
  onClose,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('any');
  const [date, setDate] = useState(getLocalTodayStr());
  const [timeSlot, setTimeSlot] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [customerFoundName, setCustomerFoundName] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [hasAutoFilled, setHasAutoFilled] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setServiceId(services[0]?.id || '');
      setDate(getLocalTodayStr());
      setTimeSlot('10:00');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setBarberId('any');
      setError(null);
      setCustomerFound(null);
      setCustomerFoundName('');
      setIsLookingUp(false);
      setHasAutoFilled(false);
    }
  }, [isOpen, services]);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !serviceId || !date || !timeSlot) {
      setError('Nama, nomor WhatsApp, layanan, tanggal, dan jam wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        serviceId,
        barberId,
        date,
        timeSlot,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking gagal disimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#14141C] border border-stone-800 p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white font-serif">Buat Booking Customer</h3>
          <p className="text-xs text-stone-400 mt-1">Admin dapat mencatat reservasi telepon atau WhatsApp customer.</p>
        </div>

        {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-stone-400">Nama Customer
              <input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]" />
            </label>
            <label className="text-stone-400">Nomor WhatsApp
              <input required type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]" />
              {isLookingUp && (
                <span className="text-[10px] text-sky-400 block mt-1">Mengecek data pelanggan...</span>
              )}
              {customerFound === true && !isLookingUp && (
                <span className="text-[10px] text-emerald-400 block mt-1">
                  ✓ Pelanggan dikenali: {customerFoundName}
                </span>
              )}
            </label>
          </div>

          <label className="text-stone-400">Email (opsional)
            <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]" />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-stone-400">Layanan
              <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none">
                {services.map((service) => <option key={service.id} value={service.id}>{service.name} - {formatIDR(service.price)}</option>)}
              </select>
            </label>
            <label className="text-stone-400">Barber
              <select value={barberId} onChange={(event) => setBarberId(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none">
                <option value="any">Barber Siap Pertama</option>
                {barbers.filter((barber) => barber.isActive !== false).map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-stone-400">Tanggal
              <input required type="date" min={getLocalTodayStr()} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]" />
            </label>
            <label className="text-stone-400">Jam Kedatangan
              <input required type="time" value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]" />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer">Batal</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold cursor-pointer disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Simpan Booking'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
