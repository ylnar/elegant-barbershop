import React from 'react';
import { Radio, CheckCircle, Plus } from 'lucide-react';
import { SystemSettings } from '../../../types';

interface MasterSwitchTabProps {
  settings: SystemSettings;
  switchFeedback: string | null;
  onToggleMasterSwitch: () => void;
  onUpdateQueue: (delta: number) => void;
  onOpenWalkInModal: () => void;
}

export const MasterSwitchTab: React.FC<MasterSwitchTabProps> = ({
  settings,
  switchFeedback,
  onToggleMasterSwitch,
  onUpdateQueue,
  onOpenWalkInModal,
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

      {/* Walk-In Queue Manager Card */}
      <div className="p-8 rounded-3xl bg-[#14141E] border border-stone-800 shadow-2xl">
        <h3 className="text-lg font-bold text-white font-serif mb-2">
          Manajemen Antrean Walk-in Live
        </h3>
        <p className="text-xs text-stone-400 mb-6">
          Perbarui jumlah tamu yang sedang mengantre di lounge untuk ditampilkan ke calon pelanggan walk-in.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="p-6 rounded-2xl bg-[#0D0D14] border border-stone-800 text-center">
            <span className="text-xs text-stone-400 block uppercase font-medium">
              Jumlah Tamu Menunggu di Lounge
            </span>
            <div className="text-5xl font-extrabold text-[#D4AF37] font-serif my-3">
              {settings.currentWalkInQueue} <span className="text-xl text-stone-400 font-sans">Orang</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onUpdateQueue(-1)}
                className="w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-lg cursor-pointer"
              >
                -
              </button>
              <button
                onClick={() => onUpdateQueue(1)}
                className="w-10 h-10 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-lg cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-[#1A1A26] border border-stone-800">
              <span className="text-stone-400 block text-[10px] uppercase">
                Estimasi Waktu Tunggu Otomatis
              </span>
              <span className="text-lg font-bold text-white">
                ~ {settings.estimatedWalkInWaitMinutes} Menit
              </span>
            </div>

            <button
              onClick={onOpenWalkInModal}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#252538] hover:bg-[#D4AF37] text-stone-200 hover:text-stone-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Tamu Walk-in Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
