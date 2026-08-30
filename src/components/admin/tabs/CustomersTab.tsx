import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Users, Phone, Edit2, Trash2 } from 'lucide-react';
import { fetchCustomers, updateCustomer, deleteCustomer, Customer } from '../../../services/api';
import { formatDateIndonesian } from '../../../utils/formatters';
import { RowActionMenu } from '../../ui/RowActionMenu';
import { CustomerFormModal } from '../modals/CustomerFormModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { toast } from '../../ui/Toast';

interface CustomersTabProps {
  onRefreshData?: () => Promise<void>;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ onRefreshData }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data || []);
    } catch {
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchCustomers();
        if (active) setCustomers(data || []);
      } catch {
        if (active) setCustomers([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q),
    );
  }, [customers, search]);

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditOpen(true);
  };

  const handleSaveEdit = async (data: { name: string; phone: string; email: string }) => {
    if (!editingCustomer) return;
    await updateCustomer(editingCustomer.id, data);
    toast.success(`Data pelanggan ${data.name} berhasil diperbarui.`);
    await load();
    if (onRefreshData) {
      try {
        await onRefreshData();
      } catch {
        // refresh dataset lain gagal tidak memengaruhi tab ini
      }
    }
    setEditingCustomer(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      toast.success(`Pelanggan ${deleteTarget.name} berhasil dihapus.`);
      await load();
      if (onRefreshData) {
        try {
          await onRefreshData();
        } catch {
          // refresh dataset lain gagal tidak memengaruhi tab ini
        }
      }
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus pelanggan. Coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-serif">Data Pelanggan</h3>
          <p className="text-xs text-stone-400">
            Daftar pelanggan terdaftar dari nomor telepon. Nama memakai nama panggilan (tanpa spasi) dan
            otomatis dipakai ulang saat nomor yang sama kembali bertransaksi. Klik menu titik-3 untuk edit
            atau hapus.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau nomor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#181824] border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-[#14141E] border border-stone-800 text-center text-stone-500 text-xs">
          Memuat data pelanggan...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#14141E] border border-stone-800 text-center text-stone-500 text-xs">
          {customers.length === 0
            ? 'Belum ada data pelanggan. Data muncul otomatis saat pelanggan melakukan reservasi atau transaksi (dikelompokkan per nomor telepon).'
            : 'Tidak ada pelanggan yang cocok dengan pencarian.'}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#14141E] border border-stone-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#191926] border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Nomor Telepon</th>
                  <th className="py-3 px-4">Total Kunjungan</th>
                  <th className="py-3 px-4">Terakhir Booking</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 text-stone-300">
                {filtered.map((c) => (
                  <tr key={c.id || c.phone} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{c.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {c.phone}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] font-bold">
                        {c.totalBookings || 0} kunjungan
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-400">
                      {c.lastBookingDate ? formatDateIndonesian(c.lastBookingDate.split('T')[0]) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <RowActionMenu
                        itemId={`customer-${c.id || c.phone}`}
                        isOpen={openMenuId === `customer-${c.id || c.phone}`}
                        onToggle={setOpenMenuId}
                        ariaLabel={`Aksi untuk pelanggan ${c.name}`}
                        items={[
                          {
                            label: 'Edit Pelanggan',
                            icon: Edit2,
                            onClick: () => handleEdit(c),
                          },
                          {
                            label: 'Hapus Pelanggan',
                            icon: Trash2,
                            danger: true,
                            onClick: () => setDeleteTarget(c),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-stone-800 flex items-center gap-2 text-[11px] text-stone-500">
              <Users className="w-3.5 h-3.5" />
              {filtered.length} pelanggan ditampilkan
            </div>
          )}
        </div>
      )}

      <CustomerFormModal
        isOpen={editOpen}
        editingCustomer={editingCustomer}
        onClose={() => {
          closeMenu();
          setEditOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveEdit}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus Data Pelanggan"
        description={
          deleteTarget
            ? `Data pelanggan "${deleteTarget.name}" (${deleteTarget.phone}) akan dihapus. Riwayat reservasi & transaksi tetap tersimpan, tapi pelanggan tidak lagi muncul di daftar. Lanjutkan?`
            : ''
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        icon="trash"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};