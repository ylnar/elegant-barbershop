import React, { useState, useEffect, useCallback } from 'react';
import { X, KeyRound, AlertCircle, Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface AdminLoginModalProps {
  onSuccess: (user: AdminUser) => void;
  onClose: () => void;
}

/** Key for localStorage — session persists across browser restarts */
const SESSION_KEY = 'elegant_barber_admin_session';
const MAX_RETRIES = 3;

/**
 * Ambil sesi tersimpan dari localStorage.
 * Return null jika tidak ada atau rusak.
 */
export const getStoredSession = (): AdminUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.username) return parsed;
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

/**
 * Simpan sesi login ke localStorage.
 */
export const setStoredSession = (user: AdminUser): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // localStorage penuh atau disabled — abaikan
  }
};

/**
 * Hapus sesi dari localStorage.
 */
export const clearStoredSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

/**
 * Verifikasi sesi ke server — return user jika valid.
 */
export const verifySession = async (userId: string): Promise<AdminUser | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/auth/verify', {
      headers: { 'x-user-id': userId },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (data.valid && data.user) return data.user;
    return null;
  } catch {
    return null;
  }
};

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cek sesi tersimpan saat modal dibuka
  useEffect(() => {
    const existing = getStoredSession();
    if (existing) {
      setLoading(true);
      verifySession(existing.id).then((validUser) => {
        if (validUser) {
          onSuccess(validUser);
        } else {
          clearStoredSession();
        }
        setLoading(false);
      });
    }
  }, [onSuccess]);

  const attemptLogin = useCallback(
    async (user: string, pass: string, attempt: number): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.trim(), password: pass.trim() }),
          signal: controller.signal,
        });

        clearTimeout(timer);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Username atau password salah.');
          return false;
        }

        setStoredSession(data.user);
        onSuccess(data.user);
        return true;
      } catch {
        if (attempt < MAX_RETRIES) {
          setError(`Gagal menghubungi server. Mencoba ulang… (${attempt + 1}/${MAX_RETRIES})`);
          return false;
        }
        setError('Tidak dapat terhubung ke server. Silakan hubungi administrator.');
        return false;
      }
    },
    [onSuccess],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Nama pengguna wajib diisi.');
      return;
    }
    if (!password.trim()) {
      setError('Kata sandi wajib diisi.');
      return;
    }

    setLoading(true);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const success = await attemptLogin(username, password, attempt);
      if (success) {
        setLoading(false);
        return;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setLoading(false);
  };

  const verifyingSession = loading && !error && !username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-[#16161F] to-[#111118] border border-stone-800/80 shadow-[0_0_60px_-12px_rgba(212,175,55,0.15)]">

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={verifyingSession}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-stone-800/60 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-2xl bg-[#D4AF37]/10 blur-xl" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/25 flex items-center justify-center">
                {verifyingSession ? (
                  <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin" />
                ) : (
                  <ShieldCheck className="w-7 h-7 text-[#D4AF37]" />
                )}
              </div>
            </div>

            {/* Title & subtitle */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-serif tracking-wide">
                {verifyingSession ? 'Memverifikasi Sesi…' : 'Masuk ke Panel Admin'}
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed max-w-[260px] mx-auto">
                {verifyingSession
                  ? 'Sesi Anda ditemukan, memeriksa ke server…'
                  : 'Gunakan akun yang telah didaftarkan untuk mengakses panel manajemen Elegant Barbershop.'}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          {!verifyingSession && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-username"
                  className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block"
                >
                  Nama Pengguna
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
                  <input
                    id="admin-username"
                    type="text"
                    placeholder="Masukkan nama pengguna"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    autoComplete="username"
                    autoFocus
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1A1A24] border border-stone-700/80 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/15 transition-all disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#1A1A24] border border-stone-700/80 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/15 transition-all disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A233] hover:from-[#E5C378] hover:to-[#D4AF37] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold text-sm tracking-wide shadow-lg shadow-[#D4AF37]/15 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          {!verifyingSession && (
            <div className="pt-3 border-t border-stone-800/60">
              <p className="text-center text-[10px] text-stone-600 leading-relaxed">
                Hubungi pemilik toko jika belum memiliki akun.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
