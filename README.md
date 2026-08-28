# 💈 Elegant Barbershop Solok

> **"Masuak Cayah Kalua Cogah"**  
> *Sistem Portal Web Resmi, Konsultasi AI Gaya Rambut & Kasir POS Cepat Elegant Barbershop Solok.*

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
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
| **Database** | MongoDB (`mongodb` driver, `@server/mongoRepo`) | Penyimpanan data transaksional dengan fallback in-memory. |
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
│       ├── auth/              # Sesuções admin (tanpa kata sandi / passphrase)
│       ├── barbers/           # CRUD barber
│       ├── bookings/          # Reservasi + pelacakan tiket
│       ├── customers/         # Data pelanggan otomatis
│       ├── services/          # CRUD layanan
│       ├── transactions/      # Kasir POS
│       ├── settings/          # Pengaturan & master switch
│       └── ai-consultant/     # Rekomendasi AI Gemini
├── server/                    # Logika domain bersama (state, mongoRepo, mongodb, config)
├── scripts/                   # CLI database MongoDB (db.mjs, seed-data.mjs)
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
   Isi minimal `MONGODB_URI` (mis. `mongodb://localhost:27017/elegant_barbershop` untuk lokal, atau `mongodb+srv://...` untuk MongoDB Atlas). *(Isi `GEMINI_API_KEY` jika ingin mengaktifkan model AI Gemini.)*

4. **Siapkan Database MongoDB (opsional, disarankan):**
   ```bash
   npm run db:setup        # buat koneksi, index, dan seed data awal
   npm run db:status       # cek status koneksi & koleksi
   ```
   Tanpa MongoDB, aplikasi tetap 100% berfungsi via penyimpanan in-memory.

5. **Jalankan aplikasi dalam mode Development:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

6. **Linting & Build Check:**
   ```bash
   npm run lint
   npm run build
   ```

---

## ⚙️ Konfigurasi Environment Variables

| Variable | Wajib/Opsional | Deskripsi |
| :--- | :--- | :--- |
| `MONGODB_URI` | Opsional* | Connection string MongoDB, mis. `mongodb://localhost:27017/elegant_barbershop` (lokal) atau `mongodb+srv://user:pass@cluster.mongodb.net/elegant_barbershop` (Atlas). |
| `MONGODB_DB_NAME` | Opsional | Nama database MongoDB. Default: `elegant_barbershop`. |
| `MONGODB_CONNECT_TIMEOUT_MS` | Opsional | Timeout koneksi dalam milidetik. Default: `8000`. |
| `MONGODB_AUTO_SEED` | Opsional | `true`/`false` — otomatis isi data awal (seed) saat server start. Default: `true`. |
| `GEMINI_API_KEY` | Opsional | Kunci API Google Gemini untuk fitur AI Barber Consultant. *(Jika tidak diisi, sistem fallback ke heuristic master barber).* |
| `GEMINI_MODEL` | Opsional | Model Gemini yang dipakai. Default: `gemini-3.7-flash`. |

> **\* Tanpa MongoDB**: Aplikasi berjalan normal menggunakan **penyimpanan in-memory di server**. Setiap data yang dibuat (
booking, transaksi, dll.) tetap tersimpan selama server hidup — tetapi hilang ketika server restart. Hubungkan MongoDB
untuk penyimpanan permanen yang aman.

> **Penting**: Semua akses MongoDB berjalan **server-side** (API routes / Node.js) — kredensial tidak pernah terekspos ke browser. Klien mengakses data lewat endpoint `/api/*`.

---

## 🌐 Panduan Deployment

### 1. Deploy ke Vercel
Proyek ini sudah dilengkapi dengan konfigurasi `vercel.json`:
1. Push repository ke GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/) dan import repository Anda.
3. Framework Preset terdeteksi otomatis: **Next.js**.
4. Masukkan Environment Variables (minimal `MONGODB_URI`; opsional `GEMINI_API_KEY` dan `GEMINI_MODEL`).
5. Klik **Deploy**.

### 2. Deploy ke Cloud Run / Docker / VPS
Next.js dapat dijalankan sebagai server mandiri:
1. Jalankan `npm run build`.
2. Jalankan `npm start`. Server akan melayani halaman publik sekaligus REST API pada port `3000`.

---

## 🗄️ Menghubungkan MongoDB

Aplikasi kini menggunakan **MongoDB** sebagai basis data utama (menggantikan Supabase/PostgreSQL). Struktur data
disimpan sebagai dokumen dengan field **camelCase** (sama persis dengan tipe TypeScript domain aplikasi), lengkap
dengan soft-delete (`isDeleted`) dan timestamp (`createdAt` / `updatedAt`).

### Opsi A — MongoDB Lokal (Windows / Linux)

1. **Install MongoDB Community Server** dari situs resmi MongoDB, lalu pastikan layanan `mongod` berjalan.
2. Buat database `elegant_barbershop` (otomatis dibuat saat koneksi pertama).
3. Konfigurasikan environment:
   ```
   MONGODB_URI="mongodb://localhost:27017/elegant_barbershop"
   MONGODB_DB_NAME="elegant_barbershop"
   MONGODB_AUTO_SEED="true"
   ```
4. Jalankan setup & seed:
   ```bash
   npm run db:setup
   npm run db:status
   ```

### Opsi B — MongoDB Atlas (Cloud Gratis)

1. Daftar di https://www.mongodb.com/atlas → build cluster **M0 (Free)**.
2. Buat user database & whitelist IP (disarankan `0.0.0.0/0` + autentikasi user kuat).
   > ⚠️ IP rumah Anda dinamis (berubah). Bila memakai IP tertentu saja lalu koneksi tiba-tiba gagal dengan `tlsv1 alert internal error`, tambahkan IP publik terbaru di **Network Access** (atau gunakan `0.0.0.0/0` — wajib jika app di-deploy ke Vercel).
3. Salin connection string (**Database ➜ Connect ➜ Drivers**) berbentuk:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Isi ke environment (tambahkan nama database setelah `/`):
   ```
   MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/elegant_barbershop"
   ```
5. Jalankan `npm run db:setup` untuk membuat index unik & seed data awal.

### Koleksi yang Digunakan

| Koleksi | Konten |
| :--- | :--- |
| `settings` | Master switch buka/tutup booking, jam operasional, kontak outlet |
| `services` | Katalog layanan & pricelist resmi |
| `barbers` | Data tim master barber |
| `bookings` | Reservasi online & tiket `ELG-XXXX` |
| `transactions` | Transaksi kasir POS (invoice `TRX-...`) |
| `customers` | Data pelanggan otomatis dari booking & transaksi |
| `admins` | Akun owner/kasir — password ter-hash scrypt (seed: `owner` / `owner123`) |
| `sessions` | Sesi login aktif (httpOnly cookie `eb_session`, TTL 24 jam) |

> 🔐 Sejak migrasi, **dashboard wajib login dulu**: buka `/login` (atau akses `/dashboard`), isi `owner` / `owner123`, baru masuk ke panel. Semua kredensial & sesi tersimpan di MongoDB.

### CLI Database (scripts/db.mjs)

```bash
npm run db:setup     # Koneksi + buat index unik (bookingCode, invoiceNumber, phone, dll.)
npm run db:status    # Status koneksi, jumlah dokumen per koleksi
npm run db:doctor    # Diagnosa & tampilkan dokumen terbaru
npm run db:seed      # Isi ulang data awal (seed)
npm run db:reset     # Hapus semua koleksi lalu seed ulang (HATI-HATI)
```

> Seed otomatis juga berjalan saat server start jika variabel `MONGODB_AUTO_SEED=true`.
> Tanpa MongoDB, seluruh fitur tetap berjalan via penyimpanan in-memory di server — namun data hilang saat restart.

---

## 📚 Dokumentasi PRD & Arsitektur
- [Product Requirements Document (PRD)](./PRD.md)
- [System Architecture Document](./ARCHITECTURE.md)

---

## 📄 Lisensi
Hak Cipta © 2026 **Elegant Barbershop Solok**. Dibuat dengan standar performa dan craftsmanship tinggi.
