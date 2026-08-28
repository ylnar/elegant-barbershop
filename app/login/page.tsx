'use client';

import { useEffect, useState } from 'react';
import { LockKeyhole, UserRound, Scissors, Loader2 } from 'lucide-react';

/**
 * /login — halaman masuk owner/kasir.
 * Username: owner  ·  Password: owner123  (tersimpan hash di MongoDB, koleksi `admins`).
 * Berhasil -> redirect ke /dashboard.
 */
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Sudah punya sesi valid? langsung ke dashboard.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/verify')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.valid) window.location.assign('/dashboard');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        window.location.assign('/dashboard');
        return;
      }
      setError(data?.error || 'Login gagal. Periksa kredensial Anda.');
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-stone-100 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
            <Scissors className="w-7 h-7 text-[#D4AF37]" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide">
            ELEGANT <span className="text-[#D4AF37]">BARBERSHOP</span>
          </h1>
          <p className="text-[11px] text-stone-500 uppercase tracking-[0.25em] mt-1.5">
            Panel Owner &amp; Kasir
          </p>
        </div>

        {/* Login Card */}
        {checking ? (
          <div className="flex justify-center py-16 text-stone-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-[#12121A] border border-[#1A1A26] shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <LockKeyhole className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Masuk ke Dashboard</h2>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 font-semibold mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="owner"
                  autoComplete="username"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#1A1A26] border border-stone-800 focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder-stone-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#1A1A26] border border-stone-800 focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder-stone-600"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#C9A02F] text-stone-950 text-sm font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LockKeyhole className="w-4 h-4" />
              )}
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>

            <p className="text-[10px] text-stone-600 text-center">
              Akses khusus Owner &amp; Kasir. Kredensial diverifikasi aman ke MongoDB (hash scrypt).
            </p>
          </form>
        )}
      </div>
    </div>
  );
}