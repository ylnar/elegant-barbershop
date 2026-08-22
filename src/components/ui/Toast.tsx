import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;
let listeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function notify(type: ToastType, message: string) {
  const id = ++toastId;
  toasts = [...toasts, { id, type, message }];
  listeners.forEach((fn) => fn(toasts));

  // Auto-dismiss setelah 4 detik
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((fn) => fn(toasts));
  }, 4000);
}

export const toast = {
  success: (msg: string) => notify('success', msg),
  error: (msg: string) => notify('error', msg),
  info: (msg: string) => notify('info', msg),
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  error: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  info: 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]',
};

export const ToastContainer: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (t: ToastItem[]) => setItems([...t]);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-in slide-in-from-right duration-300 ${BG[item.type]}`}
        >
          {ICONS[item.type]}
          <span className="text-xs font-semibold leading-relaxed flex-1">{item.message}</span>
          <button
            onClick={() => {
              toasts = toasts.filter((t) => t.id !== item.id);
              listeners.forEach((fn) => fn(toasts));
            }}
            className="text-stone-400 hover:text-white shrink-0 mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
