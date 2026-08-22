import React, { useEffect, useRef, useState } from 'react';
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

const MENU_WIDTH = 200;

/**
 * Menu aksi titik-3 untuk baris tabel/kartu.
 *
 * - Posisi DIHITUNG SAAT KLIK (bukan setelah render) sehingga kotak
 *   selalu muncul tepat di tempat pada frame pertama — tanpa lompatan.
 * - Memakai position:fixed berbasis rect tombol sehingga tidak pernah
 *   terpotong overflow-hidden milik kontainer tabel/kartu.
 * - Animasi pop memakai keyframes custom (.menu-pop) karena plugin
 *   tailwindcss-animate tidak terpasang di proyek ini.
 * - Menutup otomatis saat klik di luar, Escape, scroll, atau resize.
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
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const [upward, setUpward] = useState(false);

  /**
   * Buka/tutup menu. Posisi final dihitung dari rect tombol PADA SAAT
   * EVENT KLIK, lalu disimpan sebelum state open berubah — jadi render
   * pertama menu sudah berada di koordinat yang benar.
   */
  const handleToggle = () => {
    if (isOpen) {
      onToggle(null);
      return;
    }

    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const estimatedHeight = items.length * 42 + 14;

    // Default terbuka ke bawah; balik ke atas bila ruang bawah kurang
    let nextTop = rect.bottom + 6;
    let nextUpward = false;
    if (nextTop + estimatedHeight > window.innerHeight - 8) {
      nextTop = Math.max(8, rect.top - estimatedHeight - 6);
      nextUpward = true;
    }

    // Jaga menu tetap di dalam viewport secara horizontal
    let nextLeft = rect.right - MENU_WIDTH;
    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - MENU_WIDTH - 8));

    setPos({ top: nextTop, left: nextLeft });
    setUpward(nextUpward);
    onToggle(itemId);
  };

  // Tutup saat klik di luar / Escape / scroll / resize
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
          handleToggle();
        }}
        className={`p-2 rounded-lg border transition-all duration-150 active:scale-90 cursor-pointer ${
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
          aria-orientation="vertical"
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className={`fixed z-[70] p-1.5 rounded-2xl bg-[#17171F]/[0.98] backdrop-blur-sm border border-white/10 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8)] ${
            upward ? 'menu-pop-up' : 'menu-pop'
          }`}
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            const showDivider = item.danger && idx > 0;
            return (
              <React.Fragment key={item.label}>
                {showDivider && <div className="my-1 mx-2 border-t border-white/[0.07]" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(null);
                    item.onClick();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 active:scale-[0.98] cursor-pointer ${
                    item.danger
                      ? 'text-rose-300 hover:bg-rose-500/15'
                      : 'text-stone-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${item.danger ? 'text-rose-400' : 'text-stone-400'}`}
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
