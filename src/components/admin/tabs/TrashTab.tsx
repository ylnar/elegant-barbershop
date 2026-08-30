import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, Scissors, Users, CalendarCheck, CreditCard, UserCheck } from 'lucide-react';
import { trashService, TrashItem } from '../../../services/api';
import { formatIDR } from '../../../utils/formatters';
import { toast } from '../../ui/Toast';
import { ConfirmModal } from '../modals/ConfirmModal';

type TabType = 'all' | 'services' | 'barbers' | 'bookings' | 'transactions' | 'customers';

const TYPE_META: Record<string, { label: string; icon: typeof Scissors; color: string }> = {
  services: { label: 'Layanan', icon: Scissors, color: 'text-[#D4AF37]' },
  barbers: { label: 'Barber', icon: Users, color: 'text-purple-400' },
  bookings: { label: 'Reservasi', icon: CalendarCheck, color: 'text-sky-400' },
  transactions: { label: 'Transaksi', icon: CreditCard, color: 'text-emerald-400' },
  customers: { label: 'Pelanggan', icon: UserCheck, color: 'text-amber-400' },
};

export const TrashTab: React.FC = () => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<TabType>('all');

  // Confirm modals
  const [restoreTarget, setRestoreTarget] = useState<TrashItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrashItem | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = activeType === 'all' ? undefined : activeType;
      const data = await trashService.getDeletedItems(typeParam);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setIsProcessing(true);
    try {
      const ok = await trashService.restoreItem(restoreTarget.type, restoreTarget.id);
      if (ok) {
        toast.success(`"${restoreTarget.name}" berhasil dipulihkan.`);
        await load();
      } else {
        toast.error('Gagal memulihkan data.');
      }
    } catch {
      toast.error('Gagal memulihkan data.');
    } finally {
      setIsProcessing(false);
      setRestoreTarget(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      const ok = await trashService.permanentDelete(deleteTarget.type, deleteTarget.id);
      if (ok) {
        toast.success(`"${deleteTarget.name}" dihapus permanen.`);
        await load();
      } else {
        toast.error('Gagal menghapus data.');
      }
    } catch {
      toast.error('Gagal menghapus data.');
    } finally {
      setIsProcessing(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteTarget) return;
    setIsProcessing(true);
    try {
      const count = await trashService.permanentDeleteAll(bulkDeleteTarget);
      toast.success(`${count} data ${TYPE_META[bulkDeleteTarget]?.label || bulkDeleteTarget} dihapus permanen.`);
      await load();
    } catch {
      toast.error('Gagal menghapus data.');
    } finally {
      setIsProcessing(false);
      setBulkDeleteTarget(null);
    }
  };

  // Count items per type
  const allItems = activeType === 'all' ? items : items.filter((i) => i.type === activeType);
  const countByType = (type: string) => items.filter((i) => i.type === type).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#14141E] border border-stone-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sampah / Tempat Sampah</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
            Data Terhapus (Soft-Delete)
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Data yang dihapus dari sistem tetap tersimpan di sini. Anda bisa memulihkannya atau menghapusnya secara permanen.
          </p>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveType('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeType === 'all'
              ? 'bg-[#D4AF37] text-stone-950 shadow-md shadow-[#D4AF37]/20'
              : 'bg-[#1A1A26] text-stone-300 hover:bg-[#22223A] border border-stone-800'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Semua
          <span className="text-[10px] opacity-80">({items.length})</span>
        </button>
        {Object.entries(TYPE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const count = countByType(key);
          return (
            <button
              key={key}
              onClick={() => setActiveType(key as TabType)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeType === key
                  ? 'bg-[#D4AF37] text-stone-950 shadow-md shadow-[#D4AF37]/20'
                  : 'bg-[#1A1A26] text-stone-300 hover:bg-[#22223A] border border-stone-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="p-8 rounded-2xl bg-[#14141E] border border-stone-800 text-center text-stone-500 text-xs">
          Memuat data sampah...
        </div>
      ) : allItems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#14141E] border border-stone-800 text-center">
          <Trash2 className="w-12 h-12 text-stone-700 mx-auto mb-3" />
          <p className="text-stone-500 text-xs font-medium">
            {activeType === 'all'
              ? 'Tidak ada data terhapus. Sampah kosong!'
              : `Tidak ada data ${TYPE_META[activeType]?.label || activeType} yang terhapus.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bulk actions per type */}
          {activeType !== 'all' && allItems.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-2 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold">{allItems.length} data {TYPE_META[activeType]?.label} terhapus.</span>
              </div>
              <button
                onClick={() => setBulkDeleteTarget(activeType)}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all cursor-pointer"
              >
                Hapus Permanen Semua
              </button>
            </div>
          )}

          {/* Items */}
          <div className="rounded-2xl bg-[#14141E] border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#191926] border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Nama / Kode</th>
                    <th className="py-3 px-4">Detail</th>
                    <th className="py-3 px-4">Dihapus Pada</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 text-stone-300">
                  {allItems.map((item, idx) => {
                    const meta = TYPE_META[item.type] || { label: item.type, icon: Trash2, color: 'text-stone-400' };
                    const Icon = meta.icon;
                    return (
                      <tr key={`${item.type}-${item.id}-${idx}`} className="hover:bg-stone-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 font-bold ${meta.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{item.name}</span>
                          <span className="text-[10px] text-stone-500 font-mono">{item.id}</span>
                        </td>
                        <td className="py-3 px-4 text-stone-400 max-w-[250px] truncate">
                          {item.type === 'transactions' && (
                            <span className="text-[#D4AF37] font-mono font-bold">
                              {formatIDR((item.detail.totalAmount as number) || 0)}
                            </span>
                          )}
                          {item.type === 'bookings' && (
                            <span>{(item.detail.date as string) || ''} {(item.detail.timeSlot as string) || ''}</span>
                          )}
                          {item.type === 'services' && (
                            <span>{formatIDR((item.detail.price as number) || 0)}</span>
                          )}
                          {item.type === 'barbers' && (
                            <span>{(item.detail.phone as string) || '-'}</span>
                          )}
                          {item.type === 'customers' && (
                            <span>{(item.detail.phone as string) || '-'} · {(item.detail.totalBookings as number) || 0} kunjungan</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-400 text-[11px]">
                          {item.deletedAt ? new Date(item.deletedAt).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setRestoreTarget(item)}
                              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                              title="Pulihkan"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                              title="Hapus Permanen"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-stone-800 flex items-center gap-2 text-[11px] text-stone-500">
              <Trash2 className="w-3.5 h-3.5" />
              {allItems.length} data ditampilkan
            </div>
          </div>
        </div>
      )}

      {/* Confirm: Restore */}
      <ConfirmModal
        isOpen={!!restoreTarget}
        title="Pulihkan Data"
        description={`Data "${restoreTarget?.name}" (${TYPE_META[restoreTarget?.type || '']?.label || ''}) akan dikembalikan ke daftar utama. Lanjutkan?`}
        confirmText="Ya, Pulihkan"
        cancelText="Batal"
        variant="primary"
        icon="restore"
        isLoading={isProcessing}
        onConfirm={handleRestore}
        onClose={() => setRestoreTarget(null)}
      />

      {/* Confirm: Permanent Delete Single */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Permanen"
        description={`Data "${deleteTarget?.name}" akan dihapus PERMANEN dari database dan tidak bisa dipulihkan lagi. Lanjutkan?`}
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isProcessing}
        onConfirm={handlePermanentDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Confirm: Bulk Delete */}
      <ConfirmModal
        isOpen={!!bulkDeleteTarget}
        title="Hapus Permanen Semua"
        description={`Semua data ${TYPE_META[bulkDeleteTarget || '']?.label || ''} yang terhapus akan dihapus PERMANEN dari database. Tindakan ini tidak bisa dibatalkan. Lanjutkan?`}
        confirmText="Ya, Hapus Semua Permanen"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={isProcessing}
        onConfirm={handleBulkDelete}
        onClose={() => setBulkDeleteTarget(null)}
      />
    </div>
  );
};
