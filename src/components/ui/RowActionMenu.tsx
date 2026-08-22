import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MoreVertical, type LucideIcon } from 'lucide-react';

export interface RowMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

interface RowActionMenuProps {
  /** ID unik baris — dipakai parent agar hanya satu menu terbuka */
  itemId: string;
  isOpen: boolean;
  onToggle: (itemId: string | null) => void;
  items: RowMenuItem[];
  ariaLabel?: string;
}

const MENU_WIDTH = 180;

/**
 * Menu aksi titik-3 untuk baris tabel/kartu.
 * Menggunakan position:fixed berbasis rect tombol sehingga tidak pernah
 * terpotong oleh overflow-hidden pada kontainer tabel/kartu.
 * Menutup otomatis saat klik di luar, tekan Escape, scroll, atau resize.
 */
export const RowActionMenu: React.FC<RowActionMenuProps> = ({
  itemId,
  isOpen,
  onToggle,
  items,
  ariaLabel,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Posisi menu mengikuti posisi tombol di viewport
  useLayoutEffect(() => {
    if (!isOpen) return;
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const estimatedHeight = items.length * 40 + 12;

    let top = rect.bottom + 6;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 6);
    }

    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - MENU_WIDTH - 8;
    }

    setPos({ top, left });
  }, [isOpen, items.length]);

  // Tutup saat klik luar / Escape / scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const close = () => onToggle(null);

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen, onToggle]);

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={ariaLabel ?? 'Menu aksi'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(isOpen ? null : itemId);
        }}
        className={`p-2 rounded-lg border transition-colors cursor-pointer ${
          isOpen
            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]'
            : 'bg-stone-900 border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-[70] py-1.5 rounded-xl bg-[#16161F] border border-stone-700 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-100"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(null);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  item.danger ? 'text-rose-300 hover:bg-rose-500/15' : 'text-stone-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${item.danger ? 'text-rose-400' : 'text-stone-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
