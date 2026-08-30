import React, { useState, useEffect } from 'react';
import { Customer } from '../../../services/dbClient';

interface CustomerFormModalProps {
  isOpen: boolean;
  editingCustomer: Customer | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    email: string;
  }) => Promise<void>;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  editingCustomer,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(editingCustomer?.name ?? '');
      setPhone(editingCustomer?.phone ?? '');
      setEmail(editingCustomer?.email ?? '');
      setFormError(null);
    }
  }, [isOpen, editingCustomer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/[^0-9]/g, '');
    if (!name.trim()) {
      setFormError('Nama memakai nama panggilan (tanpa spasi) wajib diisi.');
      return;
    }
    if (digits.length < 8) {
      setFormError('Nomor telepon tidak valid — minimal 8 digit angka.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      // Nama dinormalisasi tanpa spasi (konsisten dengan sistem dedupe nomor),
      // nomor hanya angka.
      await onSave({
        name: name.replace(/\s+/g, ''),
        phone: digits,
        email: email.trim(),
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data pelanggan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#14141C] border border-stone-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-white font-serif">
          {editingCustomer ? `Edit Pelanggan ${editingCustomer.name}` : 'Tambah Pelanggan'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-stone-400 block mb-1.5 font-medium">Nama (panggilan, tanpa spasi)</label>
            <input
              type="text"
              required
              placeholder="e.g. Budi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
            />
          </div>

          <div>
            <label className="text-stone-400 block mb-1.5 font-medium">Nomor Telepon (WA)</label>
            <input
              type="tel"
              required
              placeholder="e.g. 081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37] text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-stone-400 block mb-1.5 font-medium">Email (opsional)</label>
            <input
              type="email"
              placeholder="e.g. budi@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
            />
          </div>

          {formError && (
            <p className="text-rose-400 text-xs">{formError}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-[#D4AF37]/10 active:scale-95"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};