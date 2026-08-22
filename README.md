# 💈 Elegant Barbershop Solok

> **"Masuak Cayah Kalua Cogah"**  
> *Sistem Portal Web Resmi, Konsultasi AI Gaya Rambut & Kasir POS Cepat Elegant Barbershop Solok.*

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini AI](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📌 Daftar Isi
- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Direktori](#-struktur-direktori)
- [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
- [Konfigurasi Environment Variables](#-konfigurasi-environment-variables)
- [Panduan Deployment (Vercel & Cloud Run / VPS)](#-panduan-deployment)
- [Dokumentasi PRD & Arsitektur](#-dokumentasi-prd--arsitektur)
- [Lisensi](#-lisensi)

---

## 🌟 Tentang Proyek

**Elegant Barbershop Solok** adalah aplikasi web modern all-in-one yang melayani dua fungsi utama:
1. **Public Web Experience**: Menampilkan identitas barbershop, katalog harga layanan (*Price List*), indikator status antrean ruang tunggu (*Live Lounge Queue*), serta fitur cerdas **AI Master Barber Consultant** bertenaga Google Gemini 3.7 Flash untuk rekomendasi model rambut berdasarkan bentuk wajah dan tekstur rambut.
2. **Admin & Smart POS System**: Panel kasir ringkas untuk mencatat transaksi walk-in, memilih barber yang bertugas, menghitung kembalian uang tunai/QRIS, mengelola master switch buka/tutup booking online, serta melihat rekap omzet harian secara *real-time*.

---

## ✨ Fitur Utama

### 🌐 Sisi Publik (Pengunjung & Pelanggan)
- **Hero & Brand Showcase**: Nuansa gelap premium dengan aksen *Warm Gold* (`#D4AF37`) dan tipografi Minang yang elegan.
- **Price List Interaktif**: Filter kategori (*Haircut, Shaving, VIP Package, Beard, Treatment*) dengan harga Rupiah yang transparan.
- **AI Haircut Consultant**: Rekomendasi gaya rambut, produk grooming, dan tips styling harian berbasis AI Gemini dengan cadangan logika master barber jika offline.
- **Live Lounge Queue**: Transparansi antrean ruang tunggu secara real-time.
- **Reservasi & Lacak Tiket**: Form booking terpadu dengan pengecekan kode tiket (`ELG-XXXX`).
- **Peta & Kontak Langsung**: Integrasi Google Maps Jl. Perwira Kota Solok dan tombol WhatsApp resmi.

### 🛡️ Sisi Pengelola & Kasir (Admin Portal)
- **Kasir POS Modal Cepat**: Input pesanan dalam jendela popup 1-layar (pilih layanan, pilih barber, kalkulator bayar & kembalian).
- **Rekap Omzet Otomatis**: Kartu metrik omzet kasir hari ini dan total orang yang dilayani.
- **Master Switch Buka/Tutup Booking**: Buka atau alihkan ke mode *Walk-In Only* dalam 1 klik.
- **Manajemen Katalog & Tim**: Tambah/ubah harga layanan dan data barber dengan cepat.
- **Laporan Keuangan**: Rekapitulasi transaksi per tanggal dan metode pembayaran.
- **Transaksi List Ringkas**: Tampilan riwayat transaksi hanya menampilkan invoice, waktu, pelanggan, dan harga — detail lengkap di modal.
- **Payment on Completion**: Saat menyelesaikan reservasi, muncul modal pembayaran untuk memilih metode bayar (Cash/QRIS/Transfer/Debit) sebelum transaksi otomatis dibuat.
- **Waktu WIB Konsisten**: Semua waktu ditampilkan dalam Asia/Jakarta (WIB) regardless browser timezone.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons | Antarmuka interaktif, responsif, dan berperforma tinggi. |
| **Fullstack** | Next.js 15 (App Router) | Landing page statis + REST API route handlers dalam satu framework. |
| **Database** | Supabase PostgreSQL (`@supabase/supabase-js`) | Penyimpanan data transaksional dengan fallback in-memory. |
| **AI Integration**| `@google/genai` (Gemini) | Rekomendasi model rambut terstruktur berbasis prompt engineering. |
| **Build Tooling**| Next.js Compiler, TypeScript Compiler | Kompilasi produksi optimasi otomatis & type checking. |

---

## 📂 Struktur Direktori

```
├── .github/workflows/ci.yml   # CI validation workflow
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout (SEO, font, JSON-LD)
│   ├── page.tsx               # Halaman utama (landing)
│   └── api/                   # REST API route handlers
│       ├── auth/              # Login & verifikasi sesi admin
│       ├── barbers/           # CRUD barber
│       ├── bookings/          # Reservasi + pelacakan tiket
│       ├── services/          # CRUD layanan
│       ├── transactions/      # Kasir POS
│       ├── settings/          # Pengaturan & master switch
│       └── ai-consultant/     # Rekomendasi AI Gemini
├── server/                    # Logika domain bersama (state, Supabase, config)
├── src/                       # Source code Frontend React
│   ├── assets/                # Gambar & aset visual resolusi tinggi
│   ├── components/            # Komponen UI (Hero, Price List, AI, Admin, dll.)
│   ├── data/                  # Initial seeds & blueprints
│   ├── hooks/                 # Custom React hooks (useBarbershopData)
│   ├── services/              # Service layer modular dengan LocalStorage fallback
│   ├── types.ts               # Definisi TypeScript domain models
│   ├── utils/                 # Formatter rupiah, nomor HP, tanggal
│   └── App.tsx                # Root component landing page
├── ARCHITECTURE.md            # Dokumentasi teknis arsitektur sistem
├── PRD.md                     # Product Requirements Document
├── next.config.ts             # Konfigurasi Next.js
├── vercel.json                # Header keamanan & cache Vercel
└── package.json               # Dependensi & NPM scripts
```

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat
- **Node.js**: Versi `18.x` atau lebih baru
- **NPM** atau **Bun**

### Langkah-langkah:
1. **Clone repository:**
   ```bash
   git clone https://github.com/your-username/elegant-barbershop-solok.git
   cd elegant-barbershop-solok
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Siapkan Environment Variables:**
   Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi minimal `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` dari dashboard Supabase. *(Isi `GEMINI_API_KEY` jika ingin mengaktifkan model AI Gemini.)*

4. **Jalankan aplikasi dalam mode Development:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

5. **Linting & Build Check:**
   ```bash
   npm run lint
   npm run build
   ```

---

## ⚙️ Konfigurasi Environment Variables

| Variable | Wajib/Opsional | Deskripsi |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Wajib | URL project Supabase untuk client-side (`https://xxx.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Wajib | Anon/public key Supabase untuk client-side. |
| `SUPABASE_URL` | Wajib | URL project Supabase untuk server-side (API routes, Edge Functions). |
| `SUPABASE_ANON_KEY` | Wajib | Anon key untuk server-side. |
| `SUPABASE_SERVICE_ROLE_KEY` | Wajib | Service role key — hanya untuk server, jangan pernah diekspos ke browser. |
| `DATABASE_URL` | Opsional | Connection string PostgreSQL untuk tooling migrasi CLI. |
| `DB_AUTO_MIGRATE` | Opsional | `true`/`false` — terapkan migrasi otomatis saat setup lokal. Default: `true`. |
| `GEMINI_API_KEY` | Opsional | Kunci API Google Gemini untuk fitur AI Barber Consultant. *(Jika tidak diisi, sistem fallback ke heuristic master barber).* |

> **Penting**: Client-side code hanya bisa membaca env var yang diawali `NEXT_PUBLIC_`. Server-side code membutuhkan versi tanpa prefix.

---

## 🌐 Panduan Deployment

### 1. Deploy ke Vercel
Proyek ini sudah dilengkapi dengan konfigurasi `vercel.json`:
1. Push repository ke GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/) dan import repository Anda.
3. Framework Preset terdeteksi otomatis: **Next.js**.
4. Masukkan Environment Variables (lengkap: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, opsional `GEMINI_API_KEY`).
5. Klik **Deploy**.

### 2. Deploy ke Cloud Run / Docker / VPS
Next.js dapat dijalankan sebagai server mandiri:
1. Jalankan `npm run build`.
2. Jalankan `npm start`. Server akan melayani halaman publik sekaligus REST API pada port `3000`.

---

## 📚 Database Migrasi

Migrasi dikonsolidasi menjadi 2 file:
- `supabase/migrations/001_schema.sql` — Skema lengkap (tabel, index, trigger, stored procedures, views, RLS, grants, realtime)
- `supabase/migrations/002_seed.sql` — Data awal (categories, services, barbers, admin users, settings)

Jalankan migrasi:
```bash
npm run db:migrate
```

Migrasi berjalan otomatis saat server start jika `DB_AUTO_MIGRATE=true`.

---

## 📚 Dokumentasi PRD & Arsitektur
- [Product Requirements Document (PRD)](./PRD.md)
- [System Architecture Document](./ARCHITECTURE.md)

---

## 📄 Lisensi
Hak Cipta © 2026 **Elegant Barbershop Solok**. Dibuat dengan standar performa dan craftsmanship tinggi.
