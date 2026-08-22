import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MoreVertical, Scissors } from 'lucide-react';
import { Service } from '../../../types';
import { formatIDR } from '../../../utils/formatters';

interface ServicesTabProps {
  services: Service[];
  onOpenServiceModal: (srv?: Service) => void;
  onDeleteService: (id: string) => void;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  services,
  onOpenServiceModal,
  onDeleteService,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-serif">Katalog Layanan &amp; Tarif</h3>
          <p className="text-xs text-stone-400">
            Kelola menu pangkas rambut, paket perawatan, harga Rupiah, dan durasi pengerjaan.
          </p>
        </div>

        <button
          onClick={() => onOpenServiceModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Layanan Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {services.map((srv) => (
          <div
            key={srv.id}
            onClick={() => onOpenServiceModal(srv)}
            className="p-4 sm:p-5 rounded-2xl bg-[#14141E] border border-stone-800 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between shadow-md group cursor-pointer relative"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors font-serif">
                  {srv.name}
                </h4>

                {/* 3-Dots Action Menu */}
                <div
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === srv.id ? null : srv.id)}
                    className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                    title="Opsi Layanan"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === srv.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#1A1A28] border border-stone-700 shadow-2xl z-50 py-1.5 text-xs text-stone-200 text-left animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onOpenServiceModal(srv);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-[#252538] flex items-center gap-2 text-stone-200 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Edit Layanan</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteService(srv.id);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-500/20 flex items-center gap-2 text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Layanan</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
                <span className="capitalize px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 text-[10px] font-medium">
                  {srv.category}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-base font-extrabold text-[#D4AF37] font-mono">
                {formatIDR(srv.price)}
              </span>

              <span className="text-[11px] text-stone-500 group-hover:text-stone-300 transition-colors">
                Klik untuk edit →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
