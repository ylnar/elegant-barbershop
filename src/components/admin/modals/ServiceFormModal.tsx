import React, { useState, useEffect } from 'react';
import { Service, ServiceCategory } from '../../../types';

interface ServiceFormModalProps {
  isOpen: boolean;
  editingService: Service | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: ServiceCategory;
    price: number;
    durationMinutes: number;
    description: string;
    badge?: string;
    isActive: boolean;
  }) => Promise<void>;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  editingService,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    name: '',
    category: 'haircut' as ServiceCategory,
    price: '45000',
    durationMinutes: 40,
    description: '',
    badge: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingService) {
      setForm({
        name: editingService.name,
        category: editingService.category,
        price: String(editingService.price),
        durationMinutes: editingService.durationMinutes || 40,
        description: editingService.description || '',
        badge: editingService.badge || '',
        isActive: editingService.isActive,
      });
    } else {
      setForm({
        name: '',
        category: 'haircut',
        price: '45000',
        durationMinutes: 40,
        description: '',
        badge: '',
        isActive: true,
      });
    }
  }, [editingService, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return;
    try {
      setSubmitting(true);
      await onSave({
        name: form.name.trim(),
        category: form.category,
        price,
        durationMinutes: Number(form.durationMinutes) || 40,
        description: form.description.trim(),
        badge: form.badge.trim() || undefined,
        isActive: form.isActive,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#14141C] border border-stone-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-white font-serif">
          {editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-stone-400 block mb-1.5 font-medium">Nama Layanan</label>
            <input
              type="text"
              required
              placeholder="e.g. Perming / Fashion Colouring"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-stone-400 block mb-1.5 font-medium">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37] text-sm cursor-pointer"
              >
                <option value="haircut">Haircut (Pangkas)</option>
                <option value="shave">Shaving (Cukur)</option>
                <option value="package">VIP Package</option>
                <option value="beard">Beard &amp; Mustache</option>
                <option value="treatment">Treatment / Perming</option>
              </select>
            </div>

            <div>
              <label className="text-stone-400 block mb-1.5 font-medium">Harga (IDR)</label>
              <input
                type="number"
                required
                min={0}
                step={5000}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37] text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-[#D4AF37]/10 active:scale-95"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Layanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
