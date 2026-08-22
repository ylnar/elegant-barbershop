import React from 'react';
import { Instagram, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { SystemSettings } from '../types';
import logoImg from '../assets/images/logo.webp';

interface FooterProps {
  settings: SystemSettings;
  onOpenAdmin: () => void;
  onOpenSchemaModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdmin,
  onOpenSchemaModal,
}) => {
  return (
    <footer className="bg-[#08080B] border-t border-[#1C1C26] text-stone-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#D4AF37]/50 flex-shrink-0 bg-black">
                <img
                  src={logoImg.src}
                  alt="Logo Elegant Barbershop Solok"
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-wider font-serif">
                  ELEGANT <span className="text-[#D4AF37]">BARBERSHOP</span>
                </span>
                <p className="text-[10px] tracking-wider text-[#D4AF37] uppercase">
                  Masuak Cayah Kalua Cogah
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              Barbershop di Kota Solok. Menyediakan layanan pangkas rambut pria, anak, perming, dan pewarnaan.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://instagram.com/elegantbarber.id"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#14141C] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-pink-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://wa.me/6283826336104`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#14141C] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#14141C] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-[#D4AF37] transition-colors"
                aria-label="Google Maps"
              >
                <MapPin className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-[#D4AF37]">
              Menu
            </h3>
            <ul className="space-y-0.5 text-stone-400">
              <li>
                <a href="#home" className="inline-block py-1 hover:text-white transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="#services" className="inline-block py-1 hover:text-white transition-colors">
                  Price List
                </a>
              </li>
              <li>
                <a href="#location" className="inline-block py-1 hover:text-white transition-colors">
                  Lokasi
                </a>
              </li>
            </ul>
          </div>

          {/* Operating Hours & Admin */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-[#D4AF37]">
              Info Outlet
            </h3>
            <div className="space-y-2 text-stone-400">
              <div>
                <span className="text-stone-300 block">Jam Buka:</span>
                <span className="text-emerald-400">{settings.openTime} - {settings.closeTime} WIB</span>
              </div>
              <div>
                <span className="text-stone-300 block">Alamat:</span>
                <span className="text-xs">Jl. Perwira, Kota Solok</span>
              </div>
              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1 py-1.5 hover:text-[#D4AF37] transition-colors text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Admin &amp; Kasir Portal</span>
                </button>

                {onOpenSchemaModal && (
                  <button
                    onClick={onOpenSchemaModal}
                    className="flex items-center gap-1 py-1.5 hover:text-[#D4AF37] transition-colors text-xs text-stone-400 hover:text-stone-300 cursor-pointer"
                  >
                    <span>Struktur Database &amp; Status</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <div>
            © {new Date().getFullYear()} Elegant Barbershop Solok.
          </div>
          <div>
            Jl. Perwira, VI Suku, Kota Solok, Sumatera Barat
          </div>
        </div>
      </div>

      {/* Digitalisasi UMKM Sub-Footer Banner */}
      <div className="bg-[#040407] border-t border-stone-800/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold tracking-wider uppercase">
              🚀 Go Digitalisasi UMKM
            </span>
            <p className="text-xs text-stone-300">
              Tertarik membuat website profesional &amp; sistem kasir modern untuk usaha Anda?
            </p>
          </div>

          <a
            href="https://wa.me/6281276484493?text=Halo%20Jimmy%2C%20saya%20tertarik%20untuk%20membuat%20website%20dan%20digitalisasi%20sistem%20usaha%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-[#25D366]/20"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Hubungi Jimmy: 0812-7648-4493</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
