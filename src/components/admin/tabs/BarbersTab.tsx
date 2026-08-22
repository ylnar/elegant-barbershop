import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Scissors, UserCheck, UserX, MoreVertical } from 'lucide-react';
import { Barber } from '../../../types';

interface BarbersTabProps {
  barbers: Barber[];
  onOpenBarberModal: (barber?: Barber) => void;
  onDeleteBarber: (id: string) => void;
}

export const BarbersTab: React.FC<BarbersTabProps> = ({
  barbers,
  onOpenBarberModal,
  onDeleteBarber,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-serif">Data Staf &amp; Master Barber</h3>
          <p className="text-xs text-stone-400">
            Daftar barber aktif yang melayani reservasi dan kasir di Elegant Barbershop Solok.
          </p>
        </div>

        <button
          onClick={() => onOpenBarberModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Barber Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {barbers.map((b) => (
          <div
            key={b.id}
            onClick={() => onOpenBarberModal(b)}
            className="p-4 rounded-2xl bg-[#14141E] border border-stone-800 flex items-center justify-between gap-3 shadow-md hover:border-[#D4AF37]/50 transition-all group cursor-pointer relative"
          >
            {/* Icon Stylist Badge */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[#1A1912] border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37] group-hover:text-stone-950 transition-colors">
                <Scissors className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors truncate">
                  {b.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                      b.isActive !== false ? 'text-emerald-400' : 'text-stone-500'
                    }`}
                  >
                    {b.isActive !== false ? (
                      <>
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3 h-3 text-stone-500" />
                        <span>Nonaktif</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 3-Dots Action Menu */}
            <div
              className="relative shrink-0 pl-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveMenuId(activeMenuId === b.id ? null : b.id)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Opsi Barber"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {activeMenuId === b.id && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveMenuId(null)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#1A1A28] border border-stone-700 shadow-2xl z-50 py-1.5 text-xs text-stone-200 text-left animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        onOpenBarberModal(b);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#252538] flex items-center gap-2 text-stone-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Edit Barber</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        onDeleteBarber(b.id);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-rose-500/20 flex items-center gap-2 text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Barber</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
