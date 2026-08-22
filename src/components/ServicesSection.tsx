import React from 'react';
import { Service, SystemSettings } from '../types';
import { Store, Phone, Calendar, ArrowRight, Check } from 'lucide-react';

interface ServicesSectionProps {
  services: Service[];
  settings?: SystemSettings;
  onSelectServiceAndBook?: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  settings,
  onSelectServiceAndBook,
}) => {
  const activeServices = services.filter((s) => s.isActive !== false);

  // Format price into simple 'k' format (e.g. 45000 -> 45k, 250000 -> 250k)
  const formatPriceK = (price: number): string => {
    if (price >= 1000) {
      return `${Math.round(price / 1000)}k`;
    }
    return `${price}`;
  };

  const handleServiceClick = (serviceId: string) => {
    if (onSelectServiceAndBook) {
      onSelectServiceAndBook(serviceId);
    } else {
      const el = document.getElementById('booking');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-16 sm:py-24 bg-[#0A0A0F] border-t border-[#1C1C26] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Authentic Barbershop Price List Board with Image Overlay Background */}
        <div className="relative rounded-3xl overflow-hidden border border-stone-800 shadow-2xl bg-[#0F0F16]">
          
          {/* Atmospheric Background Overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Deep atmospheric gradient overlay for maximum readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F]/95 via-[#0F0F16]/90 to-[#0A0A0F]/95" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent" />
          </div>

          {/* Board Content */}
          <div className="relative z-10 p-6 sm:p-12">
            
            {/* Board Header */}
            <div className="text-center mb-8 sm:mb-10">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.3em] text-[#D4AF37] uppercase block mb-1">
                ELEGANT BARBERSHOP SOLOK
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif tracking-wider">
                PRICE LIST &amp; MENU
              </h2>

              {/* Decorative Gold Trim Divider */}
              <div className="flex items-center justify-center gap-3 mt-3.5">
                <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <div className="w-2 h-2 rotate-45 border border-[#D4AF37] bg-[#D4AF37]/30" />
                <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              
              <p className="text-xs text-stone-400 mt-2.5">
                Klik salah satu menu layanan di bawah untuk langsung memesan jadwal reservasi Anda.
              </p>
            </div>

            {/* Price List Items Table */}
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {activeServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service.id)}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-transparent hover:border-[#D4AF37]/40 hover:bg-[#14141E]/80 transition-all group cursor-pointer"
                >
                  <div className="flex items-baseline gap-2.5 sm:gap-3 pr-2">
                    <span className="text-[#D4AF37] text-sm leading-none group-hover:scale-125 transition-transform">•</span>
                    <span className="text-base sm:text-lg font-serif text-stone-100 group-hover:text-[#D4AF37] font-medium transition-colors block">
                      {service.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-3">
                    <span className="text-base sm:text-lg font-bold font-serif text-[#D4AF37] tracking-wider">
                      {formatPriceK(service.price)}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 group-hover:bg-[#D4AF37] text-[#D4AF37] group-hover:text-stone-950 font-bold transition-all">
                      <span>Pilih</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Board Footer */}
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-stone-800/90 text-center">
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-20 sm:w-28 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
                <div className="w-1.5 h-1.5 rotate-45 border border-[#D4AF37]" />
                <div className="h-px w-20 sm:w-28 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
              </div>

              <div className="flex items-center justify-center gap-2 text-stone-200 text-xs sm:text-sm font-semibold tracking-wider">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>+62 83826336104</span>
              </div>
              
              <p className="text-[11px] text-stone-400 tracking-[0.25em] uppercase mt-1">
                EST.2024
              </p>
              
              <p className="text-xs sm:text-sm text-[#D4AF37] font-serif italic tracking-widest mt-2">
                " MASUAK CAYAH KALUA COGAH "
              </p>

              {/* Call to Action Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('booking');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4AF37]/20 active:scale-95 cursor-pointer"
                >
                  {settings?.isBookingOpen ? (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Booking Jadwal Sekarang</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>Kunjungi Outlet &amp; Jam Buka</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
