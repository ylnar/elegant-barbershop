import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Calendar,
  User,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Radio,
  Search,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
  Navigation,
  MapPin,
} from 'lucide-react';
import { SystemSettings, Service, Barber, Booking } from '../types';
import { api } from '../services/api';
import { lookupCustomerByPhone } from '../services/customersService';
import { formatIDR, formatDateIndonesian, getStatusBadge, getLocalTodayStr, getLocalDateStr, sanitizePhoneInput, isValidWhatsAppNumber } from '../utils/formatters';

interface BookingSectionProps {
  settings: SystemSettings;
  services: Service[];
  barbers: Barber[];
  bookings: Booking[];
  selectedServiceId?: string | null;
  onSelectServiceId?: (id: string | null) => void;
  onBookingSuccess: (booking: Booking) => void;
  onTrackTicket?: (booking: Booking) => void;
}

/** Status reservasi yang masih dianggap aktif */
const ACTIVE_BOOKING_STATUSES: Booking['status'][] = ['pending', 'confirmed', 'in_service'];

/** Normalisasi nomor WA lokal untuk deteksi duplikat (08xx -> 628xx) */
function normalizePhoneLocal(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  settings,
  services,
  barbers,
  bookings,
  selectedServiceId: externalSelectedServiceId,
  onSelectServiceId,
  onBookingSuccess,
  onTrackTicket,
}) => {
  // Tabs: 'new_booking' | 'track_booking'
  const [activeTab, setActiveTab] = useState<'new_booking' | 'track_booking'>('new_booking');

  // Active services & barbers (default to active unless explicitly set to false)
  const activeServices = services.filter((s) => s.isActive !== false);
  const activeBarbers = barbers.filter((b) => b.isActive !== false);

  // Default date: today in YYYY-MM-DD (local timezone)
  const now = new Date();
  const todayStr = getLocalTodayStr();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const tomorrowStr = getLocalDateStr(1);
  const dayAfterTomorrowStr = getLocalDateStr(2);

  // Helper: check if a time slot is already past for today
  const isPastSlot = (slot: string, date: string): boolean => {
    if (date !== todayStr) return false;
    const [h, m] = slot.split(':').map(Number);
    if (h < currentHour) return true;
    if (h === currentHour && m <= currentMinute) return true;
    return false;
  };

  // Booking Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    externalSelectedServiceId || (activeServices[0]?.id ?? '')
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  // Auto select first service when dynamic services are loaded
  useEffect(() => {
    if (!selectedServiceId && activeServices.length > 0) {
      setSelectedServiceId(activeServices[0].id);
    }
  }, [activeServices, selectedServiceId]);

  // Customer lookup state
  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [customerFoundName, setCustomerFoundName] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [autoFilledPhone, setAutoFilledPhone] = useState<string>(''); // track which phone triggered auto-fill

  // UI status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deteksi nomor WhatsApp yang masih memiliki reservasi aktif (belum terlewat).
  // Aturan: 1 nomor = 1 reservasi aktif; setelah hari reservasi terlewat boleh pesan lagi.
  const duplicatePhoneBooking = customerPhone
    ? bookings.find(
        (b) =>
          normalizePhoneLocal(b.customerPhone) === normalizePhoneLocal(customerPhone) &&
          ACTIVE_BOOKING_STATUSES.includes(b.status) &&
          b.date >= todayStr,
      )
    : undefined;

  // Debounced phone lookup: auto-fill customer name when phone is entered
  useEffect(() => {
    if (!customerPhone || customerPhone.length < 10 || !isValidWhatsAppNumber(customerPhone)) {
      setCustomerFound(null);
      setCustomerFoundName('');
      setAutoFilledPhone('');
      return;
    }

    // Don't re-lookup if we already auto-filled for this exact phone
    if (autoFilledPhone === customerPhone) return;

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const result = await lookupCustomerByPhone(customerPhone);
        if (cancelled) return;

        if (result && result.name) {
          setCustomerFound(true);
          setCustomerFoundName(result.name);
          // Auto-fill name only if name field is empty
          if (!customerName.trim()) {
            setCustomerName(result.name);
            setAutoFilledPhone(customerPhone);
          }
        } else {
          setCustomerFound(false);
          setCustomerFoundName('');
          setAutoFilledPhone('');
        }
      } catch {
        if (!cancelled) {
          setCustomerFound(false);
          setCustomerFoundName('');
        }
      } finally {
        if (!cancelled) setIsLookingUp(false);
      }
    }, 600); // 600ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [customerPhone, customerName, autoFilledPhone]);

  // Tracking Ticket State
  const [searchCodeOrPhone, setSearchCodeOrPhone] = useState<string>('');
  const [searchedBookings, setSearchedBookings] = useState<Booking[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Sync external selected service when changed from price list
  useEffect(() => {
    if (externalSelectedServiceId) {
      setSelectedServiceId(externalSelectedServiceId);
      setActiveTab('new_booking');
    }
  }, [externalSelectedServiceId]);

  // Generate available time slots based on opening and closing hours
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const openHour = parseInt(settings.openTime?.split(':')[0] || '10', 10);
    const closeHour = parseInt(settings.closeTime?.split(':')[0] || '22', 10);

    for (let hour = openHour; hour < closeHour; hour++) {
      const hh = hour < 10 ? `0${hour}` : `${hour}`;
      slots.push(`${hh}:00`);
      slots.push(`${hh}:30`);
    }
    return slots;
  };

  const allTimeSlots = generateTimeSlots();

  // Filter: hide past slots when date is today
  const timeSlots = allTimeSlots.filter((slot) => !isPastSlot(slot, selectedDate));

  // Auto-select first available slot when date changes or slots are filtered
  useEffect(() => {
    if (timeSlots.length > 0 && !timeSlots.includes(selectedTimeSlot)) {
      setSelectedTimeSlot(timeSlots[0]);
    }
  }, [selectedDate, timeSlots.join(','), selectedTimeSlot]);

  // Find currently selected service & barber
  const currentService = activeServices.find((s) => s.id === selectedServiceId) || activeServices[0];
  const currentBarber = activeBarbers.find((b) => b.id === selectedBarberId);

  // Calculate existing bookings count on selected date & slot to avoid overbooking
  const getSlotBookingCount = (slot: string): number => {
    return bookings.filter(
      (b) =>
        b.date === selectedDate &&
        b.timeSlot === slot &&
        b.status !== 'cancelled'
    ).length;
  };

  // Handle Form Submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Silakan masukkan nama lengkap Anda.');
      return;
    }

    if (!customerPhone.trim() || !isValidWhatsAppNumber(customerPhone)) {
      setFormError('Nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx (10-13 digit), contoh: 081234567890.');
      return;
    }

    if (duplicatePhoneBooking) {
      setFormError(
        `Nomor WhatsApp ini sudah memiliki reservasi aktif (kode ${duplicatePhoneBooking.bookingCode} • ${formatDateIndonesian(duplicatePhoneBooking.date)}). ` +
          'Satu nomor hanya boleh satu reservasi aktif. Setelah hari reservasi terlewat, Anda bisa memesan lagi.',
      );
      return;
    }

    if (!selectedServiceId) {
      setFormError('Silakan pilih salah satu layanan pangkas / perawatan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = await api.createBooking({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceId: selectedServiceId,
        barberId: selectedBarberId === 'any' ? undefined : selectedBarberId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        isWalkIn: false,
      });

      // Clear input and trigger success modal
      setCustomerName('');
      setCustomerPhone('');
      if (onSelectServiceId) onSelectServiceId(null);

      onBookingSuccess(newBooking);
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan saat memproses booking. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Ticket Tracking Search
  const handleSearchTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCodeOrPhone.trim()) return;

    setIsSearching(true);
    try {
      const query = searchCodeOrPhone.trim();
      const results = await api.getBookings({ search: query });
      setSearchedBookings(results);
    } catch (err) {
      console.warn('Error searching bookings:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section
      id="booking"
      className="py-16 sm:py-24 bg-[#0A0A0F] border-t border-[#1C1C26] relative overflow-hidden"
    >
      {/* Decorative ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A1A26] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>SISTEM RESERVASI DIGITAL</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-serif tracking-tight">
            Booking Jadwal <span className="text-[#D4AF37]">Pangkas Rambut</span>
          </h2>

          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-2xl mx-auto">
            Pilih layanan, tentukan master barber favorit, dan amankan slot waktu Anda tanpa perlu menunggu lama di outlet.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CASE A: SISTEM BOOKING DITUTUP SEMENTARA (WALK-IN ONLY MODE) */}
        {/* ========================================================================= */}
        {!settings.isBookingOpen ? (
          <div className="max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl bg-[#12121C] border-2 border-amber-500/30 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                Pemberitahuan Operasional
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                Mode Kunjungan Langsung (Walk-In Only)
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 max-w-lg mx-auto leading-relaxed">
                {settings.walkInOnlyMessage ||
                  'Reservasi online saat ini sedang dialihkan. Anda dapat langsung datang ke outlet kami di Jl. Perwira Kota Solok.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <a
                href={`https://wa.me/6283826336104?text=${encodeURIComponent(
                  'Halo Elegant Barbershop Solok, saya ingin menanyakan ketersediaan kursi walk-in hari ini.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Hubungi Kasir via WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  const el = document.getElementById('location');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1A1A26] hover:bg-[#242436] text-stone-200 font-semibold text-xs sm:text-sm uppercase tracking-wider border border-stone-700 transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-[#D4AF37]" />
                <span>Lihat Peta Outlet Solok</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE B: SISTEM BOOKING AKTIF (FULL INTERACTIVE BOOKING ENGINE) */
          /* ========================================================================= */
          <div className="space-y-8">
            
            {/* Top Switcher: Form Reservasi Baru vs Lacak Tiket */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs sm:max-w-none sm:w-auto inline-flex flex-col sm:flex-row p-1 rounded-2xl bg-[#12121A] border border-stone-800 shadow-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('new_booking')}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'new_booking'
                      ? 'bg-[#D4AF37] text-stone-950 shadow-md shadow-[#D4AF37]/20'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Formulir Reservasi Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('track_booking')}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'track_booking'
                      ? 'bg-[#D4AF37] text-stone-950 shadow-md shadow-[#D4AF37]/20'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Lacak Tiket Reservasi</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FORMULIR RESERVASI INTERAKTIF */}
            {activeTab === 'new_booking' && (
              <form onSubmit={handleSubmitBooking} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left & Center: Multi-Step Interactive Form (2 Cols) */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* STEP 1: PILIH LAYANAN */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#12121A] border border-stone-800 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold font-mono">
                            1
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                            Pilih Layanan / Paket Pangkas
                          </h3>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          {activeServices.length} Pilihan Tersedia
                        </span>
                      </div>

                      <div className="pt-1">
                        <label htmlFor="booking-service" className="sr-only">
                          Pilih layanan
                        </label>
                        <select
                          id="booking-service"
                          value={selectedServiceId}
                          onChange={(event) => {
                            setSelectedServiceId(event.target.value);
                            if (onSelectServiceId) onSelectServiceId(event.target.value);
                          }}
                          disabled={activeServices.length === 0}
                          className="w-full rounded-2xl border border-stone-700 bg-[#0E0E14] px-4 py-3.5 text-sm font-semibold text-white outline-none transition-colors focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {activeServices.length === 0 ? (
                            <option value="">Belum ada layanan tersedia</option>
                          ) : (
                            activeServices.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - {formatIDR(service.price)}
                              </option>
                            ))
                          )}
                        </select>
                        {currentService && (
                          <div className="mt-2 flex items-center justify-between px-1 text-xs text-stone-400">
                            <span>Layanan dipilih</span>
                            <span className="font-bold text-[#D4AF37]">{formatIDR(currentService.price)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* STEP 2: PILIH MASTER BARBER */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#12121A] border border-stone-800 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold font-mono">
                            2
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                            Pilih Master Barber
                          </h3>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          Bebas pilih barber favorit
                        </span>
                      </div>

                      <div className="pt-1">
                        <label htmlFor="booking-barber" className="sr-only">
                          Pilih master barber
                        </label>
                        <select
                          id="booking-barber"
                          value={selectedBarberId}
                          onChange={(event) => setSelectedBarberId(event.target.value)}
                          className="w-full rounded-2xl border border-stone-700 bg-[#0E0E14] px-4 py-3.5 text-sm font-semibold text-white outline-none transition-colors focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                        >
                          <option value="any">Barber Siap Pertama - Paling Cepat Dilayani</option>
                          {activeBarbers.map((barber) => (
                            <option key={barber.id} value={barber.id}>
                              {barber.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 px-1 text-xs text-stone-400">
                          Pilih barber favorit atau serahkan ke barber yang siap lebih dulu.
                        </p>
                      </div>
                    </div>

                    {/* STEP 3: PILIH TANGGAL & SLOT JAM */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#12121A] border border-stone-800 shadow-xl space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold font-mono">
                            3
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                            Pilih Hari &amp; Jam Kedatangan
                          </h3>
                        </div>
                        <span className="text-[11px] text-[#D4AF37] font-semibold">
                          Buka 10.00 – 22.00 WIB
                        </span>
                      </div>

                      {/* Quick Date Selectors */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                          Pilihan Tanggal:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDate(todayStr)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedDate === todayStr
                                ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] font-bold shadow-md shadow-[#D4AF37]/20'
                                : 'bg-[#0E0E14] border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">Hari Ini</span>
                            <span className="text-[10px] opacity-80">{todayStr}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDate(tomorrowStr)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedDate === tomorrowStr
                                ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] font-bold shadow-md shadow-[#D4AF37]/20'
                                : 'bg-[#0E0E14] border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">Besok</span>
                            <span className="text-[10px] opacity-80">{tomorrowStr}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDate(dayAfterTomorrowStr)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedDate === dayAfterTomorrowStr
                                ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] font-bold shadow-md shadow-[#D4AF37]/20'
                                : 'bg-[#0E0E14] border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">Lusa</span>
                            <span className="text-[10px] opacity-80">{dayAfterTomorrowStr}</span>
                          </button>

                          <div className="relative">
                            <input
                              type="date"
                              aria-label="Pilih tanggal kunjungan tertentu"
                              value={selectedDate}
                              min={todayStr}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="w-full h-full p-2.5 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-200 text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Time Slots Grid */}
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                          Slot Jam Kedatangan:
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {timeSlots.length === 0 ? (
                            <div className="col-span-full text-center py-4">
                              <span className="text-sm text-stone-400 italic">
                                Semua jam hari ini sudah lewat. Silakan pilih tanggal lain.
                              </span>
                            </div>
                          ) : (
                            timeSlots.map((slot) => {
                              const isSelected = selectedTimeSlot === slot;
                              const count = getSlotBookingCount(slot);
                              const isFullyBooked = count >= (settings.maxSimultaneousBookingsPerSlot || 4);
                              const past = isPastSlot(slot, selectedDate);

                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={isFullyBooked || past}
                                  onClick={() => !past && setSelectedTimeSlot(slot)}
                                  className={`py-2.5 px-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                                    past
                                      ? 'bg-stone-900/20 border-stone-900/50 text-stone-700 line-through cursor-not-allowed'
                                      : isFullyBooked
                                      ? 'bg-stone-900/40 border-stone-900 text-stone-600 line-through cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 scale-105'
                                      : 'bg-[#0E0E14] border-stone-800 text-stone-300 hover:border-[#D4AF37]/50 hover:text-white'
                                  }`}
                                >
                                  <span>{slot}</span>
                                  {past ? (
                                    <span className="block text-[9px] font-normal text-stone-600 mt-0.5">
                                      lewat
                                    </span>
                                  ) : count > 0 && !isFullyBooked ? (
                                    <span className="block text-[9px] font-normal text-stone-400 mt-0.5">
                                      {count} dipesan
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STEP 4: DATA IDENTITAS PEMESAN */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#12121A] border border-stone-800 shadow-xl space-y-4">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-stone-800">
                        <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold font-mono">
                          4
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                          Data Pelanggan
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                          <label htmlFor="booking-customer-name" className="text-xs font-bold text-stone-300">
                            Nama Lengkap <span className="text-[#D4AF37]">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                            <input
                              id="booking-customer-name"
                              type="text"
                              required
                              autoComplete="name"
                              placeholder="Contoh: Rian Pratama"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-100 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-stone-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="booking-customer-phone" className="text-xs font-bold text-stone-300">
                            Nomor WhatsApp <span className="text-[#D4AF37]">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                            <input
                              id="booking-customer-phone"
                              type="tel"
                              required
                              inputMode="numeric"
                              autoComplete="tel"
                              placeholder="Contoh: 081234567890"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(sanitizePhoneInput(e.target.value))}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#0E0E14] border text-stone-100 text-xs sm:text-sm focus:outline-none transition-all placeholder:text-stone-400 ${
                                customerPhone && (!isValidWhatsAppNumber(customerPhone) || duplicatePhoneBooking)
                                  ? 'border-rose-500/60 focus:border-rose-500'
                                  : 'border-stone-800 focus:border-[#D4AF37]'
                              }`}
                            />
                          </div>
                          {customerPhone && !isValidWhatsAppNumber(customerPhone) ? (
                            <span className="text-[10px] text-rose-400 block">
                              Nomor belum valid. Format: 08xx / 628xx (10-13 digit).
                            </span>
                          ) : duplicatePhoneBooking ? (
                            <span className="text-[10px] text-amber-400 block flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0 mt-px" />
                              <span>
                                Nomor ini sudah punya reservasi aktif ({duplicatePhoneBooking.bookingCode} •{' '}
                                {formatDateIndonesian(duplicatePhoneBooking.date)}). Satu nomor hanya boleh satu
                                reservasi aktif.
                              </span>
                            </span>
                          ) : isLookingUp ? (
                            <span className="text-[10px] text-sky-400 block flex items-center gap-1.5">
                              <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                              <span>Mengecek data pelanggan...</span>
                            </span>
                          ) : customerFound === true ? (
                            <span className="text-[10px] text-emerald-400 block flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                Pelanggan dikenali! Nama <strong>{customerFoundName}</strong> sudah tersimpan.
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-500 block">
                              Tiket digital &amp; info konfirmasi dikirim ke nomor ini. 1 nomor = 1 reservasi aktif.
                            </span>
                          )}
                        </div>


                      </div>
                    </div>

                  </div>

                  {/* Right Column: Order Summary & Instant Confirmation Card (1 Col Sticky) */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="sticky top-28 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#14141E] to-[#0E0E14] border border-[#D4AF37]/40 shadow-2xl space-y-6">
                      
                      <div className="flex items-center gap-2 pb-4 border-b border-stone-800">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold block">
                            RINGKASAN PESANAN
                          </span>
                          <h3 className="text-base font-bold text-white font-serif">Tiket Reservasi</h3>
                        </div>
                      </div>

                      {/* Summary Breakdown */}
                      <div className="space-y-3.5 text-xs">
                        <div className="flex items-start justify-between">
                          <span className="text-stone-400">Layanan:</span>
                          <span className="font-bold text-white text-right font-serif max-w-[160px]">
                            {currentService?.name || 'Pangkas Rambut'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Master Barber:</span>
                          <span className="text-[#D4AF37] font-bold">
                            {currentBarber ? currentBarber.name : 'Barber Siap Pertama'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Jadwal:</span>
                          <span className="text-white font-medium">
                            {selectedDate}, {selectedTimeSlot} WIB
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Metode Bayar:</span>
                          <span className="text-emerald-400 font-semibold">
                            Bayar di Outlet (Cash/QRIS)
                          </span>
                        </div>

                        <div className="pt-4 border-t border-stone-800 flex items-baseline justify-between">
                          <span className="text-xs font-bold uppercase text-stone-300">Total Tarif:</span>
                          <span className="text-2xl font-extrabold text-[#D4AF37] font-serif">
                            {formatIDR(currentService?.price || 0)}
                          </span>
                        </div>
                      </div>

                      {formError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Main Submit Action Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-[#D4AF37]/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                            <span>Memproses Reservasi...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Konfirmasi &amp; Ambil Tiket</span>
                          </>
                        )}
                      </button>

                      <div className="text-center text-[11px] text-stone-500 space-y-1">
                        <p>✓ Tidak perlu kartu kredit atau DP di muka.</p>
                        <p>✓ Tiket langsung terbit dengan barcode / QR code.</p>
                      </div>

                    </div>
                  </div>

                </div>
              </form>
            )}

            {/* TAB 2: LACAK TIKET RESERVASI */}
            {activeTab === 'track_booking' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <form
                  onSubmit={handleSearchTickets}
                  className="p-6 sm:p-8 rounded-3xl bg-[#12121A] border border-stone-800 shadow-2xl space-y-4"
                >
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold text-white font-serif">
                      Cek Status Reservasi Anda
                    </h3>
                    <p className="text-xs text-stone-400">
                      Masukkan Kode Booking (contoh: <code className="text-[#D4AF37] font-mono">ELG-8821</code>) atau nomor WhatsApp Anda.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                      <input
                        type="text"
                        required
                        aria-label="Kode booking atau nomor WhatsApp"
                        placeholder="Ketik Kode Booking atau Nomor WhatsApp..."
                        value={searchCodeOrPhone}
                        onChange={(e) => setSearchCodeOrPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0E0E14] border border-stone-800 text-stone-100 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] placeholder:text-stone-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isSearching ? 'Mencari...' : 'Cari Tiket'}
                    </button>
                  </div>
                </form>

                {/* Search Results Display */}
                {searchedBookings && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between px-2 text-xs text-stone-400">
                      <span>Ditemukan {searchedBookings.length} tiket reservasi</span>
                    </div>

                    {searchedBookings.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#12121A] border border-stone-800 text-center text-stone-400 text-xs">
                        Tidak ditemukan tiket dengan kode atau nomor WhatsApp tersebut. Pastikan ejaan sudah sesuai.
                      </div>
                    ) : (
                      searchedBookings.map((bk) => {
                        const badge = getStatusBadge(bk.status);
                        return (
                          <div
                            key={bk.id}
                            className="p-5 sm:p-6 rounded-2xl bg-[#12121A] border border-stone-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-extrabold text-[#D4AF37]">
                                  {bk.bookingCode}
                                </span>
                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}
                                >
                                  {badge.label}
                                </span>
                              </div>

                              <div className="text-xs text-white font-bold font-serif">
                                {bk.serviceName}
                              </div>

                              <div className="text-[11px] text-stone-400 flex flex-wrap items-center gap-3">
                                <span>Tamu: <strong>{bk.customerName}</strong></span>
                                <span>Barber: <strong>{bk.barberName}</strong></span>
                                <span>Jadwal: <strong>{bk.date} ({bk.timeSlot} WIB)</strong></span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onTrackTicket?.(bk)}
                              className="px-4 py-2 rounded-xl bg-[#1E1E2E] hover:bg-[#28283C] text-stone-200 text-xs font-semibold border border-stone-700 transition-all cursor-pointer shrink-0"
                            >
                              Lihat Tiket Digital
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
};
