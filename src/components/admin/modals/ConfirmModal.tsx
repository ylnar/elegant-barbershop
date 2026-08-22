import React from 'react';
import { AlertTriangle, Trash2, LogOut, X, AlertCircle, Download } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'trash' | 'logout' | 'alert' | 'download';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  icon = 'trash',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case 'logout':
        return <LogOut className="w-6 h-6 text-amber-400" />;
      case 'alert':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'download':
        return <Download className="w-6 h-6 text-emerald-400" />;
      case 'trash':
      default:
        return <Trash2 className="w-6 h-6 text-rose-400" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'warning':
        return 'bg-amber-500/15 border-amber-500/30';
      case 'primary':
        return 'bg-[#D4AF37]/15 border-[#D4AF37]/30';
      case 'danger':
      default:
        return 'bg-rose-500/15 border-rose-500/30';
    }
  };

  const getConfirmBtnClass = () => {
    switch (variant) {
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-amber-500/20';
      case 'primary':
        return 'bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold shadow-[#D4AF37]/20';
      case 'danger':
      default:
        return 'bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-rose-600/30';
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-[#12121A] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Top Corner */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-white bg-stone-900 cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${getIconBg()}`}
          >
            {getIcon()}
          </div>

          <div className="space-y-1 pr-4">
            <h3 className="text-base font-bold text-white font-serif tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2 ${getConfirmBtnClass()}`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
