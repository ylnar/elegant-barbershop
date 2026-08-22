import React, { useState, useMemo, useCallback } from 'react';
import {
  Transaction,
  Service,
  Barber,
  Booking,
} from '../../../types';
import { api } from '../../../services/api';
import {
  CreditCard,
  Plus,
  Trash2,
  Search,
  DollarSign,
  Scissors,
  CheckCircle2,
  ReceiptText,
  Download,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TransactionModal } from '../modals/TransactionModal';
import { TransactionDetailModal } from '../modals/TransactionDetailModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { RowActionMenu } from '../../ui/RowActionMenu';
import { toast } from '../../ui/Toast';
import { getLocalTodayStr, toLocalDateStr, formatIDR, truncateChars } from '../../../utils/formatters';

interface TransactionsTabProps {
  services: Service[];
  barbers: Barber[];
  bookings: Booking[];
  transactions: Transaction[];
  onRefreshData: () => Promise<void>;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  services,
  barbers,
  transactions,
  onRefreshData,
}) => {
  // Modal states
  const [transactionModalOpen, setTransactionModalOpen] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Export Excel Double-Confirm State
  const [exportConfirmOpen, setExportConfirmOpen] = useState<boolean>(false);

  // Menu titik-3: hanya satu menu yang boleh terbuka di seluruh daftar
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // History Filter states
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');
  const [historyMethodFilter, setHistoryMethodFilter] = useState<string>('all');

  const formatRupiah = useCallback((val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  }, []);

  const handlePromptDelete = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(transactionToDelete.id);
      await onRefreshData();
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      toast.success(`Transaksi ${transactionToDelete.invoiceNumber} berhasil dihapus.`);
    } catch {
      toast.error('Gagal menghapus transaksi. Coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransactionCreated = async (newTx: Transaction) => {
    setTransactionModalOpen(false);
    await onRefreshData();
    setSuccessBanner(`Transaksi berhasil disimpan! No. Invoice: ${newTx.invoiceNumber}`);
    toast.success(`Transaksi ${newTx.invoiceNumber} berhasil!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleViewDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setDetailModalOpen(true);
  };

  // Salin nomor invoice ke clipboard (dengan fallback aman)
  const handleCopyInvoice = async (invoiceNumber: string) => {
    try {
      await navigator.clipboard.writeText(invoiceNumber);
      toast.success(`No. invoice ${invoiceNumber} disalin.`);
    } catch {
      toast.error('Gagal menyalin. Salin manual: ' + invoiceNumber);
    }
  };

  // Filtered Transactions for History
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
        t.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
        (t.customerPhone && t.customerPhone.includes(historySearch)) ||
        t.barberName.toLowerCase().includes(historySearch.toLowerCase());
      const matchDate = historyDateFilter
        ? toLocalDateStr(t.createdAt) === historyDateFilter
        : true;
      const matchMethod =
        historyMethodFilter === 'all' || t.paymentMethod === historyMethodFilter;
      return matchSearch && matchDate && matchMethod;
    });
  }, [transactions, historySearch, historyDateFilter, historyMethodFilter]);

  // Reset page when filters change
  const resetPage = useCallback(() => setCurrentPage(1), []);

  // Paginated transactions
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Export to Excel — xlsx dimuat dynamic agar tidak membengkak bundle awal
  const handleExportExcel = useCallback(async () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }

    const XLSX = await import('xlsx');

    const exportData = filteredTransactions.map((t, idx) => ({
      'No.': idx + 1,
      'Invoice': t.invoiceNumber,
      'Tanggal & Waktu': t.createdAt.slice(0, 16).replace('T', ' '),
      'Pelanggan': t.customerName || 'Tamu Walk-in',
      'No. HP': t.customerPhone || '-',
      'Barber': t.barberName,
      'Layanan': t.items.map((i) => i.serviceName).join(', ') || '-',
      'Qty': t.items.reduce((sum, i) => sum + i.qty, 0) || 1,
      'Subtotal (Rp)': t.subtotal,
      'Diskon (Rp)': t.discount,
      'Total Bayar (Rp)': t.totalAmount,
      'Metode Bayar': t.paymentMethod.toUpperCase(),
      'Dibayar (Rp)': t.amountPaid,
      'Kembalian (Rp)': t.changeAmount,
      'Status': 'Lunas',
      'Catatan': t.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // No.
      { wch: 20 },  // Invoice
      { wch: 22 },  // Tanggal
      { wch: 22 },  // Pelanggan
      { wch: 15 },  // No. HP
      { wch: 18 },  // Barber
      { wch: 30 },  // Layanan
      { wch: 6 },   // Qty
      { wch: 15 },  // Subtotal
      { wch: 12 },  // Diskon
      { wch: 15 },  // Total
      { wch: 12 },  // Metode
      { wch: 15 },  // Dibayar
      { wch: 12 },  // Kembalian
      { wch: 8 },   // Status
      { wch: 25 },  // Catatan
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi Kasir');

    // Add summary sheet
    const totalRevenue = filteredTransactions.reduce((s, t) => s + t.totalAmount, 0);
    const totalCount = filteredTransactions.length;
    const cashCount = filteredTransactions.filter((t) => t.paymentMethod === 'cash').length;
    const qrisCount = filteredTransactions.filter((t) => t.paymentMethod === 'qris').length;
    const transferCount = filteredTransactions.filter((t) => t.paymentMethod === 'transfer').length;

    const summaryData = [
      { 'Ringkasan': 'Total Omzet', 'Nilai': totalRevenue },
      { 'Ringkasan': 'Jumlah Transaksi', 'Nilai': totalCount },
      { 'Ringkasan': 'Transaksi Tunai', 'Nilai': cashCount },
      { 'Ringkasan': 'Transaksi QRIS', 'Nilai': qrisCount },
      { 'Ringkasan': 'Transaksi Transfer', 'Nilai': transferCount },
      { 'Ringkasan': 'Rata-rata per Transaksi', 'Nilai': totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0 },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Transaksi_Kasir_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success(`Berhasil diekspor: ${fileName}`);
  }, [filteredTransactions]);

  // Today metrics
  const todayStr = useMemo(() => getLocalTodayStr(), []);
  const todayTransactions = useMemo(
    () => transactions.filter((t) => toLocalDateStr(t.createdAt) === todayStr),
    [transactions, todayStr]
  );
  const totalOmzetHariIni = useMemo(
    () => todayTransactions.reduce((acc, t) => acc + t.totalAmount, 0),
    [todayTransactions]
  );
  const totalTrxHariIni = todayTransactions.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-stone-400 hover:text-white text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#14141E] border border-stone-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kasir POS &amp; Pembayaran</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
            Kasir &amp; Riwayat Transaksi
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Catat pesanan pangkas rambut walk-in dan pantau omzet kasir harian.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              if (filteredTransactions.length === 0) {
                toast.error('Tidak ada data untuk diekspor.');
                return;
              }
              setExportConfirmOpen(true);
            }}
            disabled={filteredTransactions.length === 0}
            className="flex-1 sm:flex-none px-4 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setTransactionModalOpen(true)}
            className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics Summary Cards - Clean 2 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Omzet Kasir Hari Ini</span>
            <DollarSign className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#D4AF37] block mt-2">
            {formatRupiah(totalOmzetHariIni)}
          </span>
          <span className="text-xs text-emerald-400 block mt-1 font-medium">
            ✓ {totalTrxHariIni} transaksi sukses hari ini
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Pelanggan Dilayani</span>
            <Scissors className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white block mt-2">
            {totalTrxHariIni} <span className="text-base font-sans text-stone-400 font-normal">Orang</span>
          </span>
          <span className="text-xs text-stone-400 block mt-1">
            Data transaksi aktif tercatat
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => { setHistorySearch(e.target.value); resetPage(); }}
              placeholder="Cari no. invoice, nama pelanggan, no. HP, atau barber..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0C0C12] border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={historyDateFilter}
              onChange={(e) => { setHistoryDateFilter(e.target.value); resetPage(); }}
              className="px-3 py-2 rounded-xl bg-[#0C0C12] border border-stone-800 text-xs text-stone-300 focus:outline-hidden focus:border-[#D4AF37]"
            />

            <select
              value={historyMethodFilter}
              onChange={(e) => { setHistoryMethodFilter(e.target.value); resetPage(); }}
              className="px-3 py-2 rounded-xl bg-[#0C0C12] border border-stone-800 text-xs text-stone-300 focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="all">Semua Metode</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer</option>
            </select>

            {(historySearch || historyDateFilter || historyMethodFilter !== 'all') && (
              <button
                onClick={() => {
                  setHistorySearch('');
                  setHistoryDateFilter('');
                  setHistoryMethodFilter('all');
                }}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Daftar Riwayat Transaksi ({filteredTransactions.length})
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#14141E] border border-dashed border-stone-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 mx-auto">
              <ReceiptText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-300">
              Belum ada data transaksi yang sesuai
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Tekan tombol "+ Transaksi Baru" di atas untuk mencatat pembayaran kasir.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE & TABLET COMPACT CARDS (< md) */}
            <div className="grid grid-cols-1 gap-2.5 md:hidden">
              {paginatedTransactions.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-[#14141E] border border-stone-800 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Left Info: Customer, Invoice, Barber & Service */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <span
                        className="font-bold text-sm text-white block truncate"
                        title={t.customerName}
                      >
                        {truncateChars(t.customerName || 'Tamu Walk-in', 24)}
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-[#D4AF37]">
                          {t.invoiceNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            t.paymentMethod === 'cash'
                              ? 'bg-amber-500/20 text-amber-300'
                              : t.paymentMethod === 'qris'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {t.paymentMethod.toUpperCase()}
                        </span>
                      </div>

                      <p
                        className="text-xs text-stone-300 truncate"
                        title={t.items?.map((i) => i.serviceName).join(', ')}
                      >
                        <span className="text-stone-400">Barber:</span>{' '}
                        <strong className="text-stone-200 font-medium">
                          {truncateChars(t.barberName, 16)}
                        </strong>
                        {t.items && t.items.length > 0 && (
                          <> • {truncateChars(t.items.map((i) => i.serviceName).join(', '), 40)}</>
                        )}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                        <span>{t.createdAt.slice(0, 16).replace('T', ' ')}</span>
                        {t.customerPhone && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{t.customerPhone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount + Menu Titik-3 */}
                    <div className="shrink-0 flex flex-col items-end gap-2 self-stretch py-0.5">
                      <span className="text-sm font-extrabold font-mono text-[#D4AF37] whitespace-nowrap">
                        {formatRupiah(t.totalAmount)}
                      </span>
                      <RowActionMenu
                        itemId={`trx-mobile-${t.id}`}
                        isOpen={openMenuId === `trx-mobile-${t.id}`}
                        onToggle={setOpenMenuId}
                        ariaLabel={`Aksi untuk transaksi ${t.invoiceNumber}`}
                        items={[
                          {
                            label: 'Lihat Detail',
                            icon: Eye,
                            onClick: () => handleViewDetail(t),
                          },
                          {
                            label: 'Salin No. Invoice',
                            icon: Copy,
                            onClick: () => void handleCopyInvoice(t.invoiceNumber),
                          },
                          {
                            label: 'Hapus Transaksi',
                            icon: Trash2,
                            danger: true,
                            onClick: () => handlePromptDelete(t),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE (>= md) */}
            <div className="hidden md:block overflow-hidden rounded-2xl bg-[#14141E] border border-stone-800 shadow-xl">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-[#0E0E16] text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">No. Invoice</th>
                    <th className="py-3.5 px-4 font-semibold">Waktu</th>
                    <th className="py-3.5 px-4 font-semibold">Pelanggan</th>
                    <th className="py-3.5 px-4 font-semibold">Barber</th>
                    <th className="py-3.5 px-4 font-semibold">Layanan</th>
                    <th className="py-3.5 px-4 font-semibold">Metode</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Total (Rp)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {paginatedTransactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-[#1A1A28] transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                        {t.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">
                        {t.createdAt.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="py-3 px-4 max-w-[160px]">
                        <span
                          className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors block truncate"
                          title={t.customerName}
                        >
                          {truncateChars(t.customerName || 'Tamu Walk-in', 22)}
                        </span>
                        {t.customerPhone && (
                          <span className="text-[10px] text-stone-400 block font-mono">
                            {t.customerPhone}
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-stone-300 max-w-[120px] truncate"
                        title={t.barberName}
                      >
                        {truncateChars(t.barberName, 16)}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-stone-200" title={t.items?.map((i) => i.serviceName).join(', ')}>
                        {t.items && t.items.length > 0 ? (
                          t.items.map((i) => i.serviceName).join(', ')
                        ) : (
                          <span className="text-stone-500 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            t.paymentMethod === 'cash'
                              ? 'bg-amber-500/20 text-amber-300'
                              : t.paymentMethod === 'qris'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {t.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-right text-[#D4AF37]">
                        {formatRupiah(t.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <RowActionMenu
                            itemId={`trx-desktop-${t.id}`}
                            isOpen={openMenuId === `trx-desktop-${t.id}`}
                            onToggle={setOpenMenuId}
                            ariaLabel={`Aksi untuk transaksi ${t.invoiceNumber}`}
                            items={[
                              {
                                label: 'Lihat Detail',
                                icon: Eye,
                                onClick: () => handleViewDetail(t),
                              },
                              {
                                label: 'Salin No. Invoice',
                                icon: Copy,
                                onClick: () => void handleCopyInvoice(t.invoiceNumber),
                              },
                              {
                                label: 'Hapus Transaksi',
                                icon: Trash2,
                                danger: true,
                                onClick: () => handlePromptDelete(t),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1 pt-2">
            <span className="text-[11px] text-stone-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#D4AF37] text-stone-950 shadow-md shadow-[#D4AF37]/20'
                        : 'bg-stone-900 border border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal (New POS Input) */}
      <TransactionModal
        isOpen={transactionModalOpen}
        services={services}
        barbers={barbers}
        onClose={() => setTransactionModalOpen(false)}
        onSuccess={handleTransactionCreated}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={detailModalOpen}
        transaction={selectedTransaction}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTransaction(null);
        }}
      />

      {/* Delete Transaction Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus Catatan Transaksi"
        description={`Apakah Anda yakin ingin menghapus transaksi invoice ${transactionToDelete?.invoiceNumber || ''} atas nama ${transactionToDelete?.customerName || 'Pelanggan'}? Data omzet dan catatan transaksi ini akan dihapus secara permanen.`}
        confirmText="Ya, Hapus Transaksi"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
      />

      {/* Export Excel Double-Confirm Modal */}
      <ConfirmModal
        isOpen={exportConfirmOpen}
        title="Konfirmasi Export Excel"
        description={`File "Transaksi_Kasir_${new Date().toISOString().slice(0, 10)}.xlsx" akan berisi ${filteredTransactions.length} transaksi (total omzet ${formatIDR(filteredTransactions.reduce((s, t) => s + t.totalAmount, 0))}) sesuai filter aktif. Sheet: Transaksi Kasir & Ringkasan. Lanjutkan export?`}
        confirmText="Ya, Export Sekarang"
        cancelText="Batal"
        variant="primary"
        icon="download"
        onConfirm={() => {
          setExportConfirmOpen(false);
          void handleExportExcel();
        }}
        onClose={() => setExportConfirmOpen(false)}
      />
    </div>
  );
};
