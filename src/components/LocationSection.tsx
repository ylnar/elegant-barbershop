import React from 'react';
import { MapPin, Clock, Phone, Instagram, Navigation, ExternalLink, Store } from 'lucide-react';
import { SystemSettings } from '../types';
import storefrontImg from '../assets/images/storefront.webp';

interface LocationSectionProps {
  settings: SystemSettings;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ settings }) => {
  return (
    <section id="location" className="py-16 bg-[#0E0E14] border-t border-[#1C1C26]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Location Info */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181822] border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>Outlet Resmi Solok</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif mt-1">
                Alamat &amp; Jam Buka
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm mt-1">
                Kunjungi outlet kami di Jl. Perwira, VI Suku, Kota Solok (Sumatera Barat).
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#14141C] border border-stone-800">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs font-semibold text-white">Alamat Lengkap</h3>
                  <p className="text-xs text-stone-300 mt-0.5">{settings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#14141C] border border-stone-800">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs font-semibold text-white">Jam Operasional</h3>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Buka Setiap Hari: <span className="text-emerald-400 font-semibold">{settings.openTime} - {settings.closeTime} WIB</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#14141C] border border-stone-800">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs font-semibold text-white">Kontak WhatsApp</h3>
                  <p className="text-xs text-stone-300 mt-0.5">{settings.phone}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs uppercase tracking-wider shadow transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Petunjuk Rute Google Maps</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>

              <a
                href="https://instagram.com/elegantbarber.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#181822] hover:bg-[#20202C] border border-stone-800 text-stone-200 font-medium text-xs transition-all cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>@elegantbarber.id</span>
              </a>
            </div>
          </div>

          {/* Right Column: Storefront Image Matching Real Outlet */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-stone-700/80 h-72 sm:h-84 relative shadow-2xl group bg-[#0A0A0E]">
              <img
                src={storefrontImg}
                alt="Tampak Depan Outlet Elegant Barbershop Solok Sumatera Barat"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E]/90 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                <div>
                  <span className="font-serif font-bold text-sm block drop-shadow-md">Elegant Barbershop Solok</span>
                  <span className="text-[11px] text-stone-300 drop-shadow-sm">Jl. Perwira, VI Suku, Kota Solok</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/50 text-[11px] font-semibold shadow-md">
                  Buka 10:00 - 22:00
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
