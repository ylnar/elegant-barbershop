import React from 'react';
import { Radio, CheckCircle } from 'lucide-react';
import { SystemSettings } from '../../../types';

interface MasterSwitchTabProps {
  settings: SystemSettings;
  switchFeedback: string | null;
  onToggleMasterSwitch: () => void;
}

export const MasterSwitchTab: React.FC<MasterSwitchTabProps> = ({
  settings,
  switchFeedback,
  onToggleMasterSwitch,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {switchFeedback && (
        <div className="p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{switchFeedback}</span>
        </div>
      )}

      {/* Big Master Toggle Card */}
      <div className="p-8 rounded-3xl bg-[#14141E] border-2 border-stone-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-stone-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-bold uppercase tracking-widest mb-2">
              <Radio className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Master Control Switch</span>
            </div>
            <h3 className="text-2xl font-bold text-white font-serif">
              Status Sistem Booking Online
            </h3>
            <p className="text-xs text-stone-400 mt-1 max-w-md">
              Tombol kontrol utama untuk membuka atau menutup formulir reservasi online secara seketika di halaman depan.
            </p>
          </div>

          <button
            onClick={onToggleMasterSwitch}
            className={`px-8 py-4 rounded-2xl font-extrabold text-sm uppercase tracking-wider shadow-2xl transition-all flex items-center gap-3 cursor-pointer ${
              settings.isBookingOpen
                ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
            }`}
          >
            <Radio className="w-5 h-5 animate-pulse" />
            <span>{settings.isBookingOpen ? 'ONLINE BOOKING: AKTIF' : 'ONLINE BOOKING: NON-AKTIF'}</span>
          </button>
        </div>

        {/* Behavior Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div
            className={`p-4 rounded-2xl border ${
              settings.isBookingOpen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
              Saat Posisi AKTIF (ON)
            </h4>
            <p className="text-xs leading-relaxed">
              Pelanggan dapat memilih slot jam, menentukan barber, dan memesan jadwal di website secara langsung.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              !settings.isBookingOpen
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
              Saat Posisi NON-AKTIF (OFF)
            </h4>
            <p className="text-xs leading-relaxed">
              Form reservasi online berganti otomatis menjadi banner "Walk-in Only" beserta info antrean live lounge &amp; tombol WhatsApp.
            </p>
          </div>
        </div>
      </div>


    </div>
  );
};
