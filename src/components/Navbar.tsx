import React, { useState } from 'react';
import {
  ShieldCheck,
  Menu,
  X,
  MapPin,
  Clock,
  Store,
  Calendar,
} from 'lucide-react';
import { SystemSettings } from '../types';
import logoImg from '../assets/images/logo.webp';

interface NavbarProps {
  settings: SystemSettings;
  onOpenBooking: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenBooking,
  onOpenAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0D0D12]/95 backdrop-blur-md border-b border-[#1E1E28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Solok Identity */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            className="flex items-center gap-3.5 group text-left"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/50 shadow-lg bg-black flex-shrink-0 group-hover:border-[#D4AF37] transition-all">
              <img
                src={logoImg}
                alt="Logo Elegant Barbershop Solok"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-wider text-white font-serif">
                ELEGANT <span className="text-[#D4AF37]">BARBERSHOP</span>
              </div>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-stone-300">
            <button
              onClick={() => scrollToSection('services')}
              className="hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
            >
              Price List
            </button>
            <button
              onClick={() => scrollToSection('booking')}
              className="hover:text-[#D4AF37] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
            >
              {settings.isBookingOpen ? (
                <>
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Reservasi Online</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Info Kunjungan</span>
                </>
              )}
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
            >
              Lokasi &amp; Kontak
            </button>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenBooking}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs tracking-wider uppercase shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {settings.isBookingOpen ? (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Booking Jadwal</span>
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5" />
                  <span>Info Kunjungan</span>
                </>
              )}
            </button>

            {/* Admin / Staff Access Button */}
            <button
              onClick={onOpenAdmin}
              className="p-2.5 rounded-lg bg-[#14141C] hover:bg-[#1E1E28] text-stone-400 hover:text-[#D4AF37] border border-stone-800 transition-colors cursor-pointer ml-1"
              title="Portal Admin / Kasir"
              aria-label="Admin Portal"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button (tampil sampai breakpoint lg agar nav tetap bisa diakses di tablet) */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onOpenBooking}
              className="hidden sm:block px-3 py-1.5 rounded-md bg-[#D4AF37] text-stone-950 text-xs font-bold whitespace-nowrap"
            >
              {settings.isBookingOpen ? 'Booking' : 'Kunjungan'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#181822] text-stone-300 hover:text-white border border-stone-800"
              aria-label="Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111116] border-b border-[#242430] px-4 pt-3 pb-6 space-y-3 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="space-y-1">
            <button
              onClick={() => scrollToSection('services')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-stone-200 hover:bg-[#1A1A24] hover:text-[#D4AF37]"
            >
              Price List
            </button>
            <button
              onClick={() => scrollToSection('booking')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-stone-200 hover:bg-[#1A1A24] hover:text-[#D4AF37] flex items-center justify-between"
            >
              <span>{settings.isBookingOpen ? 'Reservasi Jadwal Online' : 'Info Kunjungan & Jam Buka'}</span>
              <span className="text-[11px] text-emerald-400 font-semibold whitespace-nowrap ml-3">
                {settings.openTime || '10:00'} - {settings.closeTime || '22:00'}
              </span>
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-stone-200 hover:bg-[#1A1A24] hover:text-[#D4AF37]"
            >
              Lokasi &amp; Kontak
            </button>
          </div>

          <div className="pt-3 border-t border-stone-800 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D4AF37] text-stone-950 font-bold text-xs uppercase tracking-wider shadow-md"
            >
              {settings.isBookingOpen ? (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Booking Jadwal Sekarang</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  <span>Info Kunjungan Outlet</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#15151E] border border-stone-800 text-stone-400 hover:text-stone-200 text-xs font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              Portal Admin / Kasir
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
