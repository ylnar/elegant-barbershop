import React, { useState, useEffect, useMemo } from 'react';
import { CalendarPlus, User, Phone, Calendar, Clock, Scissors } from 'lucide-react';
import { Service, Barber, Booking, SystemSettings } from '../../../types';
import { formatIDR, getLocalTodayStr, sanitizePhoneInput, isValidWhatsAppNumber } from '../../../utils/formatters';

interface AdminBookingModalProps {
  isOpen: boolean;
  services: Service[];
  barbers: Barber[];
  settings?: SystemSettings | null;
  bookings?: Booking[];
  onClose: () => void;
  onSave: (data: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    barberId: string;
    date: string;
    timeSlot: string;
  }) => Promise<void>;
}

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
  isOpen,
  services,
  barbers,
  settings,
  bookings = [],
  onClose,
  onSave,
}) => {
  const activeServices = services.filter((s) => s.isActive !== false);
  const activeBarbers = barbers.filter((b) => b.isActive !== false);

  const todayStr = getLocalTodayStr();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceId, setServiceId] = useState(activeServices[0]?.id || '');
  const [barberId, setBarberId] = useState('any');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Generate time slots dari jam buka/tutup di pengaturan (bukan hardcoded)
  const allTimeSlots = useMemo(() => {
    const slots: string[] = [];
    const openHour = parseInt(settings?.openTime?.split(':')[0] || '10', 10);
    const closeHour = parseInt(settings?.closeTime?.split(':')[0] || '22', 10);
    for (let h = openHour; h < closeHour; h++) {
      const hh = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${hh}:00`);
      slots.push(`${hh}:30`);
    }
    return slots;
  }, [settings?.openTime, settings?.closeTime]);

  // Filter past slots for today
  const isPastSlot = (slot: string): boolean => {
    if (selectedDate !== todayStr) return false;
    const [h, m] = slot.split(':').map(Number);
    if (h < currentHour) return true;
    if (h === currentHour && m <= currentMinute) return true;
    return false;
  };

  // Hitung okupansi slot agar admin tidak membuat reservasi melebihi kapasitas
  const maxPerSlot = settings?.maxSimultaneousBookingsPerSlot || 4;
  const getSlotCount = (slot: string): number =>
    bookings.filter(
      (b) =>
        b.date === selectedDate &&
        b.timeSlot === slot &&
        b.status !== 'cancelled' &&
        b.status !== 'completed'
    ).length;

  const timeSlots = allTimeSlots.filter((s) => !isPastSlot(s));

  // Auto-select first available (belum penuh) slot
  useEffect(() => {
    if (timeSlots.length === 0) return;
    if (!timeSlots.includes(selectedTimeSlot) || getSlotCount(selectedTimeSlot) >= maxPerSlot) {
      const firstFree = timeSlots.find((s) => getSlotCount(s) < maxPerSlot);
      setSelectedTimeSlot(firstFree || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, timeSlots.join(','), selectedTimeSlot]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setCustomerPhone('');
      setServiceId(activeServices[0]?.id || '');
      setBarberId('any');
      setSelectedDate(todayStr);
      setSelectedTimeSlot('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const phoneValid = isValidWhatsAppNumber(customerPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !serviceId || !selectedTimeSlot) return;
    if (!phoneValid) return;

    try {
      setSubmitting(true);
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceId,
        barberId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = activeServices.find((s) => s.id === serviceId);
  const hasFreeSlot = timeSlots.some((s) => getSlotCount(s) < maxPerSlot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-[#14141C] border border-stone-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-stone-800">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-serif">Booking Customer</h3>
            <p className="text-[11px] text-stone-400">Admin membuat reservasi untuk pelanggan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                <User className="w-3 h-3" /> Nama Pelanggan <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ahmad Fadli"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-100 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> WhatsApp <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                inputMode="numeric"
                placeholder="08123456789"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(sanitizePhoneInput(e.target.value))}
                className={`w-full px-3 py-2.5 rounded-xl bg-[#0E0E14] border text-stone-100 focus:outline-none transition-all ${
                  customerPhone && !phoneValid
                    ? 'border-rose-500/60 focus:border-rose-500'
                    : 'border-stone-800 focus:border-[#D4AF37]'
                }`}
              />
              {customerPhone && !phoneValid && (
                <span className="text-[10px] text-rose-400 block">
                  Format: 08xx / 628xx (10-13 digit).
                </span>
              )}
            </div>
          </div>

          {/* Service & Barber */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                <Scissors className="w-3 h-3" /> Layanan <span className="text-rose-400">*</span>
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-100 focus:outline-none"
              >
                {activeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatIDR(s.price)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                <User className="w-3 h-3" /> Barber
              </label>
              <select
                value={barberId}
                onChange={(e) => setBarberId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-100 focus:outline-none"
              >
                <option value="any">Barber Siap Pertama</option>
                {activeBarbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Tanggal <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                min={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-100 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Jam <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-100 focus:outline-none"
              >
                {timeSlots.length === 0 ? (
                  <option value="">Semua jam sudah lewat</option>
                ) : (
                  timeSlots.map((slot) => {
                    const count = getSlotCount(slot);
                    const full = count >= maxPerSlot;
                    return (
                      <option key={slot} value={slot} disabled={full}>
                        {slot} WIB{full ? ' — penuh' : count > 0 ? ` — ${count}/${maxPerSlot}` : ''}
                      </option>
                    );
                  })
                )}
              </select>
              {!hasFreeSlot && (
                <span className="text-[10px] text-amber-400 block">
                  Semua slot pada tanggal ini sudah penuh. Coba tanggal lain.
                </span>
              )}
            </div>
          </div>

          {/* Price Preview */}
          {selectedService && (
            <div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between">
              <span className="text-[#D4AF37] font-semibold">Total yang akan ditagih:</span>
              <span className="text-[#D4AF37] font-bold text-sm">{formatIDR(selectedService.price)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer hover:bg-stone-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !hasFreeSlot || (!!customerPhone && !phoneValid)}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              {submitting ? 'Menyimpan...' : 'Buat Reservasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
