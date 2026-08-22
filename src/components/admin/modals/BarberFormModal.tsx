import React, { useState, useEffect } from 'react';
import { Barber } from '../../../types';

interface BarberFormModalProps {
  isOpen: boolean;
  editingBarber: Barber | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone?: string;
    isActive: boolean;
  }) => Promise<void>;
}

export const BarberFormModal: React.FC<BarberFormModalProps> = ({
  isOpen,
  editingBarber,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingBarber) {
      setName(editingBarber.name);
      setPhone(editingBarber.phone || '');
      setIsActive(editingBarber.isActive !== false);
    } else {
      setName('');
      setPhone('');
      setIsActive(true);
    }
  }, [editingBarber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        isActive,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#14141C] border border-stone-800 p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white font-serif">
          {editingBarber ? 'Edit Data Barber' : 'Tambah Barber Baru'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-stone-400 block mb-1 font-semibold">Nama Barber</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rian Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-stone-400 block mb-1 font-semibold">No. WhatsApp Barber</label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx (untuk notifikasi booking)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#1B1B26] border border-stone-700 text-white focus:outline-none focus:border-[#D4AF37]"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">Opsional. Nomor ini digunakan untuk mengirim notifikasi booking via WhatsApp.</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveBarber"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#D4AF37] focus:ring-0 focus:outline-none cursor-pointer"
            />
            <label htmlFor="isActiveBarber" className="text-stone-300 font-semibold cursor-pointer">
              Status Aktif
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Barber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
