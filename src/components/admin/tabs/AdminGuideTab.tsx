import React from 'react';
import { BookOpen, Radio, Scissors, CreditCard, TrendingUp, HelpCircle } from 'lucide-react';

export const AdminGuideTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-200 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#14141E] border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-serif">
              Panduan Operasional Kasir &amp; Pengelola
            </h3>
            <p className="text-xs text-stone-400">
              Petunjuk penggunaan sistem kasir POS modal, pencatatan transaksi cepat, dan pengelolaan antrean walk-in Elegant Barbershop Solok.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Module 1: POS Modal & Kasir */}
        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <CreditCard className="w-4 h-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              1. Input Transaksi Kasir (Modal POS)
            </h4>
          </div>
          <ul className="text-xs text-stone-300 space-y-2 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-white">Modal Ringkas:</strong> Tekan tombol emas <span className="text-[#D4AF37] font-bold">+ Transaksi Baru</span> untuk membuka jendela kasir popup tanpa menghabiskan ruang halaman.
            </li>
            <li>
              <strong className="text-emerald-400">1 Layanan per Transaksi:</strong> Pilih 1 jenis layanan pangkas / perawatan utama yang diambil pelanggan.
            </li>
            <li>
              <strong className="text-amber-300">Pilih Barber:</strong> Pilih barber yang melayani untuk kalkulasi bagi hasil dan laporan kinerja tim.
            </li>
            <li>
              <strong className="text-white">Kalkulator Tunai / QRIS:</strong> Masukkan uang tunai untuk otomatis menghitung uang kembalian atau pilih metode QRIS/Transfer.
            </li>
          </ul>
        </div>

        {/* Module 2: Laporan & Rekap Keuangan */}
        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <TrendingUp className="w-4 h-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              2. Laporan &amp; Rekap Omzet
            </h4>
          </div>
          <ul className="text-xs text-stone-300 space-y-2 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-white">Omzet Real-time:</strong> Setiap transaksi langsung memperbarui total omzet harian dan jumlah pelanggan yang dilayani.
            </li>
            <li>
              <strong className="text-white">Rekapitulasi:</strong> Buka tab Laporan Keuangan untuk mengecek total pendapatan kasir per tanggal.
            </li>
          </ul>
        </div>

        {/* Module 3: Live Queue & Lounge */}
        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <Radio className="w-4 h-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              3. Status Antrean Lounge (Walk-In)
            </h4>
          </div>
          <ul className="text-xs text-stone-300 space-y-2 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-white">Update Antrean:</strong> Buka tab "Status Buka &amp; Antrean" untuk menambah (+) atau mengurangi (-) jumlah tamu yang sedang mengantre di lounge.
            </li>
            <li>
              Data ini akan langsung terlihat oleh pengunjung website di bagian "Antrean Live Lounge".
            </li>
          </ul>
        </div>

        {/* Module 4: Services & Barbers */}
        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <Scissors className="w-4 h-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              4. Kelola Layanan &amp; Tim Barber
            </h4>
          </div>
          <ul className="text-xs text-stone-300 space-y-2 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-white">Price List:</strong> Tambah paket pangkas baru atau sesuaikan tarif harga yang langsung tampil di website pengunjung.
            </li>
            <li>
              <strong className="text-white">Data Barber:</strong> Kelola data nama barber dengan mudah dan terstruktur.
            </li>
          </ul>
        </div>

      </div>

      {/* Quick FAQ / Tips */}
      <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
        <div className="flex items-center gap-2 text-stone-300">
          <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
          <h4 className="text-sm font-bold text-white font-serif">
            Tips Kasir Setiap Hari
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-300">
          <div className="p-3.5 rounded-xl bg-[#191924] border border-stone-800/80">
            <span className="font-semibold text-[#D4AF37] block mb-1">Setiap Transaksi Selesai</span>
            <p>Langsung tekan "+ Transaksi Baru" di tab Kasir POS agar omzet dan jumlah pelanggan hari ini tercatat dengan akurat.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#191924] border border-stone-800/80">
            <span className="font-semibold text-[#D4AF37] block mb-1">Laporan Omzet Harian</span>
            <p>Buka tab "Laporan Keuangan" di akhir jam operasional (pukul 22.00 WIB) untuk melihat rekap total pendapatan kasir.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
