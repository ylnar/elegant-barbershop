import React, { useCallback, useState } from 'react';
import { Booking, Service, Transaction } from '../../../types';
import { formatIDR } from '../../../utils/formatters';
import { TrendingUp, DollarSign, CreditCard, Users, Scissors, Download, Calendar } from 'lucide-react';
import { toast } from '../../ui/Toast';
import { ConfirmModal } from '../modals/ConfirmModal';

interface ReportsTabProps {
  bookings: Booking[];
  services: Service[];
  transactions?: Transaction[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ bookings, services, transactions = [] }) => {
  // Konfirmasi sebelum export Excel (double-confirm)
  const [exportConfirmOpen, setExportConfirmOpen] = useState<boolean>(false);

  // Real cashier transactions total
  const totalTrxRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

  const totalBookingRevenue = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const displayTotalRevenue = totalTrxRevenue > 0 ? totalTrxRevenue : totalBookingRevenue;

  const totalCashRevenue = transactions
    .filter((t) => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalQrisRevenue = transactions
    .filter((t) => t.paymentMethod === 'qris')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalTransferRevenue = transactions
    .filter((t) => t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const averageBasket = transactions.length > 0 ? Math.round(displayTotalRevenue / transactions.length) : 45000;

  // Export full report to Excel — xlsx dimuat dynamic agar tidak membengkak bundle awal
  const handleExportReport = useCallback(async () => {
    if (transactions.length === 0 && bookings.length === 0) {
      toast.error('Tidak ada data laporan untuk diekspor.');
      return;
    }

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary KPIs
    const kpiData = [
      { 'Metrik': 'Total Omzet Kasir', 'Nilai': totalTrxRevenue, 'Format': 'IDR' },
      { 'Metrik': 'Total Omzet Reservasi (Completed)', 'Nilai': totalBookingRevenue, 'Format': 'IDR' },
      { 'Metrik': 'Omzet Tampil (Gabungan)', 'Nilai': displayTotalRevenue, 'Format': 'IDR' },
      { 'Metrik': 'Pembayaran Tunai (Cash)', 'Nilai': totalCashRevenue, 'Format': 'IDR' },
      { 'Metrik': 'Pembayaran QRIS', 'Nilai': totalQrisRevenue, 'Format': 'IDR' },
      { 'Metrik': 'Pembayaran Transfer', 'Nilai': totalTransferRevenue, 'Format': 'IDR' },
      { 'Metrik': 'Total Transaksi Kasir', 'Nilai': transactions.length, 'Format': 'Count' },
      { 'Metrik': 'Total Reservasi Booking', 'Nilai': bookings.length, 'Format': 'Count' },
      { 'Metrik': 'Rata-rata per Transaksi', 'Nilai': averageBasket, 'Format': 'IDR' },
    ];
    const wsKpi = XLSX.utils.json_to_sheet(kpiData);
    wsKpi['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, wsKpi, 'Ringkasan KPI');

    // Sheet 2: Transaction Details
    if (transactions.length > 0) {
      const trxData = transactions.map((t, idx) => ({
        'No.': idx + 1,
        'Invoice': t.invoiceNumber,
        'Tanggal': t.createdAt.slice(0, 16).replace('T', ' '),
        'Pelanggan': t.customerName,
        'No. HP': t.customerPhone || '-',
        'Barber': t.barberName,
        'Layanan': t.items.map((i) => i.serviceName).join(', ') || '-',
        'Subtotal (Rp)': t.subtotal,
        'Diskon (Rp)': t.discount,
        'Total Bayar (Rp)': t.totalAmount,
        'Metode': t.paymentMethod.toUpperCase(),
        'Dibayar (Rp)': t.amountPaid,
        'Kembalian (Rp)': t.changeAmount,
        'Status': 'Lunas',
      }));
      const wsTrx = XLSX.utils.json_to_sheet(trxData);
      wsTrx['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 15 },
        { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 8 },
      ];
      XLSX.utils.book_append_sheet(wb, wsTrx, 'Detail Transaksi');
    }

    // Sheet 3: Payment Method Breakdown
    const paymentData = [
      { 'Metode Pembayaran': 'Tunai (Cash)', 'Jumlah Transaksi': transactions.filter((t) => t.paymentMethod === 'cash').length, 'Total Omzet (Rp)': totalCashRevenue },
      { 'Metode Pembayaran': 'QRIS', 'Jumlah Transaksi': transactions.filter((t) => t.paymentMethod === 'qris').length, 'Total Omzet (Rp)': totalQrisRevenue },
      { 'Metode Pembayaran': 'Transfer Bank', 'Jumlah Transaksi': transactions.filter((t) => t.paymentMethod === 'transfer').length, 'Total Omzet (Rp)': totalTransferRevenue },
    ];
    const wsPayment = XLSX.utils.json_to_sheet(paymentData);
    wsPayment['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsPayment, 'Metode Pembayaran');

    // Sheet 4: Service Sales Performance
    const serviceData = services.map((srv) => {
      const countTrx = transactions.reduce((acc, t) => {
        const item = t.items.find((i) => i.serviceId === srv.id || i.serviceName.includes(srv.name));
        return acc + (item ? item.qty : 0);
      }, 0);
      const countBooking = bookings.filter((b) => b.serviceId === srv.id).length;
      const totalCount = Math.max(countTrx, countBooking);
      return {
        'Nama Layanan': srv.name,
        'Kategori': srv.category,
        'Harga (Rp)': srv.price,
        'Durasi (menit)': srv.durationMinutes,
        'Terjual (Transaksi)': countTrx,
        'Terjual (Reservasi)': countBooking,
        'Total Terjual': totalCount,
        'Estimasi Pendapatan (Rp)': totalCount * srv.price,
      };
    });
    const wsService = XLSX.utils.json_to_sheet(serviceData);
    wsService['!cols'] = [
      { wch: 22 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsService, 'Performa Layanan');

    // Sheet 5: Booking Summary
    if (bookings.length > 0) {
      const bookingData = bookings.map((b, idx) => ({
        'No.': idx + 1,
        'Kode Booking': b.bookingCode,
        'Pelanggan': b.customerName,
        'No. HP': b.customerPhone,
        'Layanan': b.serviceName,
        'Harga (Rp)': b.servicePrice,
        'Barber': b.barberName,
        'Tanggal': b.date,
        'Jam': b.timeSlot,
        'Total (Rp)': b.totalAmount,
        'Status': b.status,
        'Walk-in': b.isWalkIn ? 'Ya' : 'Tidak',
      }));
      const wsBooking = XLSX.utils.json_to_sheet(bookingData);
      wsBooking['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 22 }, { wch: 15 },
        { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 12 },
        { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, wsBooking, 'Data Reservasi');
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Laporan_Elegant_Barbershop_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success(`Laporan berhasil diekspor: ${fileName}`);
  }, [transactions, bookings, services, totalTrxRevenue, totalBookingRevenue, displayTotalRevenue, totalCashRevenue, totalQrisRevenue, totalTransferRevenue, averageBasket]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#14141E] border border-stone-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Laporan Keuangan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
            Analitik & Laporan Omzet
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Rekapitulasi pendapatan kasir, reservasi, dan performa layanan.
          </p>
        </div>

        <button
          onClick={() => {
            if (transactions.length === 0 && bookings.length === 0) {
              toast.error('Tidak ada data laporan untuk diekspor.');
              return;
            }
            setExportConfirmOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Laporan Excel</span>
        </button>
      </div>

      {/* Double-Confirm Sebelum Export Excel */}
      <ConfirmModal
        isOpen={exportConfirmOpen}
        title="Konfirmasi Export Laporan Excel"
        description={`File "Laporan_Elegant_Barbershop_${new Date().toISOString().slice(0, 10)}.xlsx" akan berisi ${transactions.length} transaksi kasir dan ${bookings.length} data reservasi (${services.length} layanan). Sheet: Ringkasan KPI${transactions.length > 0 ? ', Detail Transaksi' : ''}, Metode Pembayaran, Performa Layanan${bookings.length > 0 ? ', Data Reservasi' : ''}. Lanjutkan export?`}
        confirmText="Ya, Export Sekarang"
        cancelText="Batal"
        variant="primary"
        icon="download"
        onConfirm={() => {
          setExportConfirmOpen(false);
          void handleExportReport();
        }}
        onClose={() => setExportConfirmOpen(false)}
      />

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Total Omzet Kasir</span>
            <DollarSign className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="text-2xl font-extrabold text-[#D4AF37] font-serif block">
            {formatIDR(displayTotalRevenue)}
          </span>
          <span className="text-[10px] text-emerald-400 block font-medium">
            ✓ {transactions.length} Transaksi Terbayar
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Pembayaran Tunai (Cash)</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-white font-serif block">
            {formatIDR(totalCashRevenue)}
          </span>
          <span className="text-[10px] text-stone-400 block">
            {transactions.filter((t) => t.paymentMethod === 'cash').length} Transaksi Tunai
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Pembayaran QRIS &amp; Transfer</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-extrabold text-white font-serif block">
            {formatIDR(totalQrisRevenue + totalTransferRevenue)}
          </span>
          <span className="text-[10px] text-purple-300 block">
            QRIS: {formatIDR(totalQrisRevenue)} | Trf: {formatIDR(totalTransferRevenue)}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Total Pelanggan Dilayani</span>
            <Users className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="text-2xl font-extrabold text-white font-serif block">
            {transactions.length} <span className="text-sm font-sans text-stone-400 font-normal">Orang</span>
          </span>
          <span className="text-[10px] text-emerald-400 block">
            {bookings.length} Reservasi Tercatat
          </span>
        </div>

      </div>

      {/* Two Column Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Popular Services Chart */}
        <div className="p-6 rounded-2xl bg-[#14141E] border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#D4AF37]" />
              <span>Layanan Paling Sering Terjual</span>
            </h4>
            <span className="text-[11px] text-stone-400">Frekuensi</span>
          </div>

          <div className="space-y-3.5">
            {services.map((srv) => {
              // Count from transactions items and bookings
              const countTrx = transactions.reduce((acc, t) => {
                const item = t.items.find((i) => i.serviceId === srv.id || i.serviceName.includes(srv.name));
                return acc + (item ? item.qty : 0);
              }, 0);
              const countBooking = bookings.filter((b) => b.serviceId === srv.id).length;
              const totalCount = countTrx + countBooking;
              const maxCount = Math.max(1, ...services.map((s) => {
                const c1 = transactions.reduce((a, t) => { const i = t.items.find((x) => x.serviceId === s.id || x.serviceName.includes(s.name)); return a + (i ? i.qty : 0); }, 0);
                return c1 + bookings.filter((b) => b.serviceId === s.id).length;
              }));
              const percent = totalCount > 0 ? Math.max(8, (totalCount / maxCount) * 100) : 0;

              return (
                <div key={srv.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-200">{srv.name}</span>
                    <span className={`font-mono font-bold ${totalCount > 0 ? 'text-[#D4AF37]' : 'text-stone-500'}`}>
                      {totalCount}x ({formatIDR(srv.price)})
                    </span>
                  </div>
                  {totalCount > 0 ? (
                    <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B38F46] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-2 rounded-full bg-stone-800/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Method & Barber Performance */}
        <div className="p-6 rounded-2xl bg-[#14141E] border border-stone-800 space-y-5">
          <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span>Kontribusi Per Barber &amp; Kasir</span>
          </h4>

          <div className="space-y-3">
            {(() => {
              // Group transactions by barber
              const barberStats = new Map<string, { name: string; count: number; total: number }>();
              transactions.forEach((t) => {
                const key = t.barberId || t.barberName;
                if (!barberStats.has(key)) {
                  barberStats.set(key, { name: t.barberName, count: 0, total: 0 });
                }
                const stat = barberStats.get(key)!;
                stat.count += 1;
                stat.total += t.totalAmount;
              });

              if (barberStats.size === 0) {
                return (
                  <div className="p-4 rounded-xl bg-[#0E0E16] border border-stone-800 text-center text-xs text-stone-500">
                    Belum ada data kontribusi barber
                  </div>
                );
              }

              return Array.from(barberStats.entries()).map(([key, stat]) => (
                <div key={key} className="p-4 rounded-xl bg-[#0E0E16] border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold font-serif text-sm">
                      {stat.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {stat.name}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        Master Barber
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-[#D4AF37] block">
                      {formatIDR(stat.total)}
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      {stat.count} Pengerjaan
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="pt-3 border-t border-stone-800 space-y-2 text-xs text-stone-300">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Ringkasan Pembukuan:
            </span>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              Semua transaksi kasir (Tunai, QRIS, Transfer) dan riwayat reservasi tersinkronisasi otomatis untuk laporan harian, mingguan, dan bulanan.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
