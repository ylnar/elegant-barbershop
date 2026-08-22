import React from 'react';
import { Store, ArrowRight, Clock, Scissors, MapPin, Calendar } from 'lucide-react';
import { SystemSettings } from '../types';
import heroInteriorImg from '../assets/images/atmosphere.webp';

interface HeroSectionProps {
  settings: SystemSettings;
  onOpenBooking: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  onOpenBooking,
}) => {
  const scrollToServices = () => {
    const el = document.getElementById('services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative overflow-hidden bg-[#0A0A0E] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
      {/* Authentic Local Hero Background with Premium Dark Scrim for 100% Text Readability */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={heroInteriorImg}
          alt="Suasana Ruang Pangkas Elegant Barbershop Solok Sumatera Barat"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.12] saturate-[1.20]"
        />
        {/* Layered Gradient & Darkening Overlay */}
        <div className="absolute inset-0 bg-[#0A0A0E]/60 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] via-transparent to-[#0A0A0E]/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0E]/90 via-transparent to-[#0A0A0E]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
        
        {/* Location & Tag Pill with Minangkabau / Solok Identity */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12121A]/90 backdrop-blur-md border border-[#D4AF37]/50 text-stone-200 text-xs font-semibold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Jl. Perwira, VI Suku, Kota Solok, Sumatera Barat</span>
          </div>
        </div>

        {/* Main Branding & Typography with High Contrast Drop Shadows */}
        <div className="space-y-2.5">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-serif leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            ELEGANT <span className="text-[#D4AF37] drop-shadow-[0_4px_20px_rgba(212,175,55,0.45)]">BARBERSHOP</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-xl font-bold tracking-widest text-[#D4AF37] font-serif italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            “ MASUAK CAYAH KALUA COGAH ”
          </p>
        </div>

        {/* Description with Subtle Contrast Shield */}
        <div className="max-w-2xl mx-auto px-4 py-2.5 rounded-2xl bg-[#0A0A0E]/50 backdrop-blur-sm border border-stone-800/40">
          <p className="text-stone-200 text-xs sm:text-sm md:text-base leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] font-medium">
            Sentuhan pangkas presisi dan perawatan rambut modern di Kota Solok. Nikmati suasana yang nyaman, barber berpengalaman, dan hasil potongan yang selalu rapi maksimal.
          </p>
        </div>

        {/* Operating Hours Pill */}
        <div className="flex items-center justify-center pt-1">
          <div className="flex items-center gap-2 bg-[#12121A]/90 backdrop-blur-md border border-stone-700/80 px-4 py-2 rounded-xl shadow-md text-xs text-stone-200">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">Buka Setiap Hari: 10.00 - 22.00 WIB</span>
          </div>
        </div>

        {/* Direct Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          <button
            type="button"
            onClick={onOpenBooking}
            className="flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/40 transition-all active:scale-95 cursor-pointer"
          >
            {settings.isBookingOpen ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>Booking Jadwal Sekarang</span>
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                <span>Info Kunjungan &amp; Jam Buka</span>
              </>
            )}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={scrollToServices}
            className="flex items-center gap-2 px-5 sm:px-7 py-3.5 rounded-xl bg-[#14141E]/90 hover:bg-[#1E1E2A] border border-stone-700/90 hover:border-[#D4AF37]/50 text-stone-100 font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md shadow-lg"
          >
            <Scissors className="w-4 h-4 text-[#D4AF37]" />
            <span>Lihat Price List</span>
          </button>
        </div>

      </div>
    </section>
  );
};
