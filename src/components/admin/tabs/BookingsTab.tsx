import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  MessageCircle,
  Scissors,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Copy,
} from 'lucide-react';
import { Booking, BookingStatus } from '../../../types';
import { api } from '../../../services/api';
import { formatIDR, formatDateIndonesian, getStatusBadge, generateBarberWhatsAppLink, generateCustomerWhatsAppLink, getLocalTodayStr } from '../../../utils/formatters';
import { Barber } from '../../../types';
import { RowActionMenu } from '../../ui/RowActionMenu';
import { BookingDetailModal } from '../modals/BookingDetailModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { toast } from '../../ui/Toast';

const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_service'];

interface BookingsTabProps {
  bookings: Booking[];
  barbers: Barber[];
  archivedCount: number;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
  onOpenBookingModal: () => void;
  onOpenWalkInModal: () => void;
  onRefreshData: () => Promise<void>;
  onRequestDeleteBooking: (booking: Booking) => void;
  onRequestClearHistory: () => void;
}

type Scope = 'active' | 'history' | 'all';

export const BookingsTab: React.FC<BookingsTabProps> = ({
  bookings,
  barbers,
  archivedCount,
  onStatusChange,
  onOpenBookingModal,
  onOpenWalkInModal,
  onRefreshData,
  onRequestDeleteBooking,
  onRequestClearHistory,
}) => {
  // Find barber phone by booking's barberId
  const getBarberPhone = (barberId: string): string | undefined => {
    if (!barberId || barberId === 'any') return undefined;
    const barber = barbers.find((b) => b.id === barberId);
    return barber?.phone;
  };

  const [scope, setScope] = useState<Scope>('active');
  const [bookingFilterDate, setBookingFilterDate] = useState<string>('all');
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // Menu titik-3: hanya satu menu yang boleh terbuka di seluruh daftar
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const activeCount = useMemo(
    () => bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length,
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (scope === 'active' && !ACTIVE_STATUSES.includes(b.status)) return false;
      if (scope === 'history' && ACTIVE_STATUSES.includes(b.status)) return false;
      if (bookingFilterStatus !== 'all' && b.status !== bookingFilterStatus) return false;
      if (bookingFilterDate === 'today' && b.date !== getLocalTodayStr()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          b.bookingCode.toLowerCase().includes(q) ||
          b.serviceName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, scope, bookingFilterStatus, bookingFilterDate, searchQuery]);

  // Reset & clamp pagination whenever filters change or data shrinks
  useEffect(() => {
    setCurrentPage(1);
  }, [scope, bookingFilterStatus, bookingFilterDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, page]);

  const allFilteredSelected =
    filteredBookings.length > 0 && filteredBookings.every((booking) => selectedBookingIds.has(booking.id));

  const toggleBookingSelection = (id: string) => {
    setSelectedBookingIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFilteredBookings = () => {
    setSelectedBookingIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filteredBookings.forEach((booking) => next.delete(booking.id));
      else filteredBookings.forEach((booking) => next.add(booking.id));
      return next;
    });
  };

  const handleConfirmBulkDelete = async () => {
    const ids = filteredBookings.filter((booking) => selectedBookingIds.has(booking.id)).map((booking) => booking.id);
    if (ids.length === 0) return;
    setIsBulkDeleting(true);
    let success = 0;
    for (const id of ids) {
      try {
        await api.deleteBooking(id);
        success += 1;
      } catch {
        // Failed records remain selected for retry.
      }
    }
    await onRefreshData();
    setSelectedBookingIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setIsBulkDeleting(false);
    setBulkDeleteConfirmOpen(false);
    if (success === ids.length) toast.success(`${success} reservasi berhasil dihapus.`);
    else toast.error(`${success} reservasi terhapus, ${ids.length - success} gagal dihapus.`);
  };

  const handleSearch = (val: string) => { setSearchQuery(val); };
  const handleFilterDate = (val: string) => { setBookingFilterDate(val); };

  const emptyMessage =
    scope === 'active'
      ? 'Tidak ada reservasi aktif. Reservasi yang selesai otomatis pindah ke Riwayat & transaksi.'
      : scope === 'history'
      ? 'Riwayat masih kosong. Reservasi berstatus Selesai/Dibatalkan akan muncul di sini.'
      : 'Tidak ada data reservasi yang sesuai dengan filter.';

  const handleViewDetail = (b: Booking) => {
    setSelectedBooking(b);
    setDetailModalOpen(true);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Kode ${code} disalin.`);
    } catch {
      toast.error('Gagal menyalin. Salin manual: ' + code);
    }
  };

  const renderRowActions = (b: Booking, prefix: string) => {
    const barberPhone = getBarberPhone(b.barberId);
    return (
    <RowActionMenu
      itemId={`${prefix}-${b.id}`}
      isOpen={openMenuId === `${prefix}-${b.id}`}
      onToggle={setOpenMenuId}
      ariaLabel={`Aksi untuk reservasi ${b.bookingCode}`}
      items={[
        {
          label: 'Lihat Detail',
          icon: Eye,
          onClick: () => handleViewDetail(b),
        },
        {
          label: 'Salin Kode',
          icon: Copy,
          onClick: () => void handleCopyCode(b.bookingCode),
        },
        ...(barberPhone ? [{
          label: 'WA Barber',
          icon: MessageCircle,
          onClick: () => window.open(generateBarberWhatsAppLink(barberPhone, b.customerName, b.bookingCode, b.serviceName, b.date, b.timeSlot, b.status), '_blank'),
        }] : []),
        ...(b.customerPhone ? [{
          label: 'WA Pelanggan',
          icon: MessageCircle,
          onClick: () => window.open(generateCustomerWhatsAppLink(b.customerPhone, b.customerName, b.bookingCode, b.serviceName, b.barberName, b.date, b.timeSlot, b.status), '_blank'),
        }] : []),
        {
          label: 'Hapus Reservasi',
          icon: Trash2,
          danger: true,
          onClick: () => onRequestDeleteBooking(b),
        },
      ]}
    />
    );
  };

  return (
    <div className="space-y-6">
      {/* Scope Switcher: Aktif vs Riwayat */}
      <div className="grid grid-cols-3 gap-2 max-w-xl">
        {([
          { id: 'active' as Scope, label: 'Aktif', count: activeCount },
          { id: 'history' as Scope, label: 'Riwayat', count: archivedCount },
          { id: 'all' as Scope, label: 'Semua', count: bookings.length },
        ]).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setScope(item.id)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              scope === item.id
                ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] shadow-md shadow-[#D4AF37]/20'
                : 'bg-[#14141E] text-stone-300 border-stone-800 hover:border-stone-600 hover:text-white'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                scope === item.id ? 'bg-stone-950/15 text-stone-950' : 'bg-stone-800 text-stone-300'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleFilterDate('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              bookingFilterDate === 'all'
                ? 'bg-[#181824] text-white border border-[#D4AF37]/60'
                : 'bg-[#181824] text-stone-400 hover:text-white border border-transparent'
            }`}
          >
            Semua Tanggal
          </button>
          <button
            onClick={() => handleFilterDate('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              bookingFilterDate === 'today'
                ? 'bg-[#181824] text-white border border-[#D4AF37]/60'
                : 'bg-[#181824] text-stone-400 hover:text-white border border-transparent'
            }`}
          >
            Hari Ini
          </button>

          <select
            value={bookingFilterStatus}
            onChange={(e) => setBookingFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#181824] border border-stone-700 text-xs text-stone-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Terkonfirmasi</option>
            <option value="in_service">Sedang Dilayani</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[160px] sm:flex-none sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kode, nomor WA..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#181824] border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {scope === 'history' && archivedCount > 0 && (
              <button
                onClick={onRequestClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer"
                title="Hapus semua riwayat selesai & dibatalkan"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Riwayat</span>
              </button>
            )}
            <button
              onClick={onOpenBookingModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Booking Customer</span>
            </button>
            <button
              onClick={onOpenWalkInModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-[#242436] border border-stone-700 text-stone-200 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Walk-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selection Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAllFilteredBookings}
            disabled={filteredBookings.length === 0}
            className="h-4 w-4 accent-[#D4AF37] cursor-pointer disabled:cursor-not-allowed"
            aria-label="Pilih semua reservasi yang tampil"
          />
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Pilih Semua Reservasi ({filteredBookings.length})
          </span>
        </div>
        {selectedBookingIds.size > 0 && (
          <button
            type="button"
            onClick={() => setBulkDeleteConfirmOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Terpilih ({selectedBookingIds.size})</span>
          </button>
        )}
      </div>

      {/* Responsive Bookings: Mobile Cards + Desktop Table */}
      <div className="space-y-3">
        {/* 1. MOBILE CARD VIEW */}
        <div className="block md:hidden space-y-2.5">
          {filteredBookings.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#14141E] border border-stone-800 text-center text-stone-500 text-xs">
              {emptyMessage}
            </div>
          ) : (
            paginatedBookings.map((b) => {
              const badge = getStatusBadge(b.status);

              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-[#14141E] border border-stone-800 shadow-lg space-y-2.5 hover:border-stone-700 transition-all"
                >
                  {/* Top Bar: Code & Schedule */}
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBookingIds.has(b.id)}
                        onChange={() => toggleBookingSelection(b.id)}
                        className="h-4 w-4 accent-[#D4AF37] cursor-pointer"
                        aria-label={`Pilih reservasi ${b.bookingCode}`}
                      />
                      <span className="font-mono font-bold text-xs text-[#D4AF37]">
                        {b.bookingCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-200">
                      <Calendar className="w-3 h-3 text-[#D4AF37]" />
                      <span className="font-semibold">{formatDateIndonesian(b.date)}</span>
                      <span className="text-[#D4AF37] font-bold font-mono">
                        {b.timeSlot} WIB
                      </span>
                    </div>
                  </div>

                  {/* Customer Info & Service */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-white block truncate">
                        {b.customerName}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono block">
                        {b.customerPhone}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-white block">
                        {b.serviceName}
                      </span>
                      <span className="text-xs font-bold font-mono text-[#D4AF37] block">
                        {formatIDR(b.totalAmount)}
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-0.5 text-[11px] text-stone-400">
                        <Scissors className="w-3 h-3 text-[#D4AF37]" />
                        <span>{b.barberName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
                    <select
                      value={b.status}
                      onChange={(e) => onStatusChange(b.id, e.target.value as BookingStatus)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border} bg-[#14141E] focus:outline-none cursor-pointer`}
                    >
                      <option value="pending">Menunggu</option>
                      <option value="confirmed">Terkonfirmasi</option>
                      <option value="in_service">Dilayani</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Batal</option>
                    </select>

                    {renderRowActions(b, 'bk-mobile')}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. DESKTOP TABLE VIEW */}
        <div className="hidden md:block rounded-2xl bg-[#14141E] border border-stone-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#191926] border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Pilih</th>
                  <th className="py-3 px-4">Kode &amp; Tamu</th>
                  <th className="py-3 px-4">Layanan &amp; Harga</th>
                  <th className="py-3 px-4">Barber</th>
                  <th className="py-3 px-4">Jadwal Kedatangan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 text-stone-300">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((b) => {
                    const badge = getStatusBadge(b.status);

                    return (
                      <tr key={b.id} className="hover:bg-stone-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedBookingIds.has(b.id)}
                            onChange={() => toggleBookingSelection(b.id)}
                            className="h-4 w-4 accent-[#D4AF37] cursor-pointer"
                            aria-label={`Pilih reservasi ${b.bookingCode}`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#D4AF37] block">
                            {b.bookingCode}
                          </span>
                          <span className="font-bold text-white block text-sm">
                            {b.customerName}
                          </span>
                          <span className="text-stone-400 text-[11px]">{b.customerPhone}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{b.serviceName}</span>
                          <span className="text-stone-400 text-[11px] block font-mono">
                            {formatIDR(b.totalAmount)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-stone-300">
                          <span className="font-medium">{b.barberName}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-white block">
                            {formatDateIndonesian(b.date)}
                          </span>
                          <span className="text-[#D4AF37] font-bold text-xs">
                            {b.timeSlot} WIB
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={b.status}
                            onChange={(e) =>
                              onStatusChange(b.id, e.target.value as BookingStatus)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border} bg-[#14141E] focus:outline-none cursor-pointer`}
                          >
                            <option value="pending">Menunggu Konfirmasi</option>
                            <option value="confirmed">Terkonfirmasi</option>
                            <option value="in_service">Sedang Dilayani</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {renderRowActions(b, 'bk-desktop')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-1 pt-2">
            <span className="text-[11px] text-stone-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === pageNum
                        ? 'bg-[#D4AF37] text-stone-950 shadow-md shadow-[#D4AF37]/20'
                        : 'bg-stone-900 border border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        isOpen={detailModalOpen}
        booking={selectedBooking}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedBooking(null);
        }}
        onStatusChange={onStatusChange}
      />

      <ConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        title="Hapus Reservasi Terpilih"
        description={`${selectedBookingIds.size} reservasi yang dipilih akan dihapus dari database dan tidak lagi muncul di daftar. Lanjutkan?`}
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isBulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setBulkDeleteConfirmOpen(false)}
      />
    </div>
  );
};
