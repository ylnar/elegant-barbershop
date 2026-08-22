# 🗄️ Panduan Integrasi Supabase (PostgreSQL & RLS)

Dokumen ini menjelaskan cara menghubungkan **Elegant Barbershop Solok** ke database **Supabase** secara penuh — semuanya dari terminal, **tanpa perlu buka Supabase Dashboard / SQL Editor**.

---

## ⚡ Langkah Cepat (Quick Start)

### 1. Buat Project Baru di Supabase
1. Kunjungi [database.new](https://database.new) atau [Supabase Dashboard](https://supabase.com/dashboard).
2. Buat project baru (misal: `elegant-barbershop-solok`), pilih region terdekat (misal: **Singapore `ap-southeast-1`**), dan simpan database password Anda.

### 2. Konfigurasi `.env`
Salin Project URL, anon key, dan service_role key dari **Project Settings → API** ke file `.env` di root project:

```env
SUPABASE_URL="https://xxxxxxxx.supabase.co"
VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"

SUPABASE_ANON_KEY="..."
VITE_SUPABASE_ANON_KEY="..."

SUPABASE_SERVICE_ROLE_KEY="..."

# Diisi otomatis oleh npm run db:setup
DATABASE_URL=""
```

### 3. Isi Password Database di `.env` (sekali saja)
Buka `.env`, isi satu baris ini:
```env
SUPABASE_DB_PASSWORD="password_database_anda"
```
*Selesai.* Sistem otomatis: mendeteksi host/region pooler yang benar (TCP probe paralel), memverifikasi koneksi, lalu **menyimpan hasilnya ke `DATABASE_URL`** secara permanen — boot berikutnya tidak perlu deteksi ulang.

Alternatif via terminal:
```bash
npm run db:setup -- PASSWORD_DATABASE_ANDA
```

### 4. Migration Sepenuhnya Otomatis
```bash
npm run dev
```
Setiap kali server start, **migrasi pending diterapkan otomatis** (`DB_AUTO_MIGRATE="true"`): tabel, fungsi ACID, RLS, views, plus data awal (pricelist, barber, sampel) — semuanya idempotent dan dilacak di tabel `app_migrations`. Tidak ada langkah manual sama sekali.

Ingin manual saja? Set `DB_AUTO_MIGRATE="false"` lalu jalankan `npm run db:migrate` kapan pun.

---

## 🛠️ Database CLI Reference

| Perintah | Fungsi |
| :--- | :--- |
| `npm run db:migrate` | Terapkan semua migrasi pending (`supabase/migrations/*.sql`) |
| `npm run db:status` | Lihat migrasi mana yang sudah/pending |
| `npm run db:doctor` | Diagnosa lengkap: env, host, auth, tabel, migrasi |
| `npm run db:setup -- <password\|uri>` | Simpan password/URI ke `.env` + tes koneksi |
| `npm run db:seed` | Isi ulang data awal (idempotent) |
| `npm run db:new -- nama_perubahan` | Buat file migrasi baru bertimestamp |
| `npm run db:sql -- "SELECT ..."` | Jalankan SQL bebas tanpa buka dashboard |
| `npm run db:reset -- --force` | ⚠️ Hapus semua tabel & jalankan ulang dari nol |

**Alur kerja sehari-hari:** ubah/add skema? `npm run db:new -- tambah_kolom`, tulis SQL-nya di `supabase/migrations/<timestamp>_tambah_kolom.sql`, restart `npm run dev` (atau `npm run db:migrate`). Selesai.

**Arsitektur:** logika inti ada di `scripts/db-lib.mjs` (resolusi koneksi bertingkat: `DATABASE_URL` → auto-detect dari `SUPABASE_DB_PASSWORD`, pelacakan migrasi). CLI (`scripts/db.mjs`) dan auto-migrate server (`server/dbAutoMigrate.ts`) memakai library yang sama.

---

## 🛡️ Rincian Keamanan & Row Level Security (RLS)

Setiap tabel diaktifkan fitur **Row Level Security (RLS)**:

| Nama Tabel | Akses Publik (`anon`) | Akses Admin / Kasir (`authenticated` & `service_role`) |
| :--- | :--- | :--- |
| `public.services` | `SELECT` (Melihat daftar layanan aktif) | `SELECT`, `INSERT`, `UPDATE`, `DELETE` (Penuh) |
| `public.barbers` | `SELECT` (Melihat profil kapster/barber) | `SELECT`, `INSERT`, `UPDATE`, `DELETE` (Penuh) |
| `public.system_settings` | `SELECT` (Melihat jam buka & status antrean) | `SELECT`, `UPDATE` (Buka/tutup master switch) |
| `public.bookings` | `SELECT`, `INSERT` (Buat booking & lacak tiket `ELG-XXXX`) | `SELECT`, `INSERT`, `UPDATE`, `DELETE` (Penuh) |
| `public.transactions` | `SELECT`, `INSERT` (Mencatat transaksi kasir) | `SELECT`, `INSERT`, `UPDATE`, `DELETE` (Penuh) |

---

## 💳 ACID Stored Procedure: Sistem Transaksi POS

Fungsi database PostgreSQL `fn_create_pos_transaction` menangani operasi kasir secara atomik:
1. Menghasilkan nomor invoice unik (`INV-YYYYMMDD-XXXX`).
2. Menyimpan rincian item, nominal bayar, kembalian, dan metode pembayaran (*cash/qris/transfer*) ke tabel `transactions`.
3. Secara otomatis memperbarui status reservasi di tabel `bookings` menjadi `'completed'` jika transaksi berasal dari tiket booking.

```sql
-- Contoh pemanggilan manual di SQL Editor:
SELECT public.fn_create_pos_transaction(
    NULL, -- Biarkan NULL untuk auto-generate invoice
    NULL, -- Booking ID jika ada
    'Ahmad Fadli',
    '081234567890',
    NULL,
    'Rian Pratama',
    '[{"serviceId":"1","serviceName":"Gentlemen Classic Haircut","price":35000,"quantity":1}]'::jsonb,
    35000,
    0,
    35000,
    'cash',
    50000,
    15000,
    'Pembayaran lunas di kasir'
);
```

---

## 📊 Fungsi Analitik Omzet: `fn_get_daily_summary`

Untuk mendapatkan rekap keuangan harian secara instan:
```sql
SELECT * FROM public.fn_get_daily_summary(CURRENT_DATE);
```
Menghasilkan: `total_omzet`, `total_transactions`, `cash_omzet`, `qris_omzet`, `transfer_omzet`.
