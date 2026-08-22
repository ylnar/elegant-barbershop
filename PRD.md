# Product Requirements Document (PRD)

## Project Name: Elegant Barbershop Solok - Web Portal & Smart POS System
**Tagline**: *"Masuak Cayah Kalua Cogah"*  
**Location**: Jl. Perwira No. 12, Kel. Simpang Rumbio, Kota Solok, Sumatera Barat  
**Version**: 2.0.0  
**Status**: Active / Production Ready  

---

## 1. Executive Summary & Vision

**Elegant Barbershop Solok** adalah platform digital all-in-one yang menggabungkan website publik premium, konsultasi gaya rambut berbasis AI Gemini 3.7 Flash, indikator antrean live lounge, dan sistem kasir Point of Sale (POS) modular untuk tim internal.

Aplikasi ini dirancang untuk mengatasi inefisiensi pencatatan manual, memberikan transparansi antrean bagi pelanggan walk-in di Kota Solok, serta memberikan sistem pencatatan omzet harian yang cepat, aman, dan tanpa friksi.

---

## 2. Problem Statement & Objectives

### 2.1 Masalah yang Dihadapi (Problem Statement)
1. **Ketidakpastian Antrean**: Pelanggan tidak mengetahui tingkat kepadatan ruang tunggu (lounge) sebelum datang langsung.
2. **Pencatatan Manual Rentan Hilang**: Kasir tradisional sering kali mengalami selisih perhitungan omzet harian karena bon kertas atau catatan manual yang tercecer.
3. **Bingung Menentukan Gaya Rambut**: Banyak pelanggan membutuhkan rekomendasi potongan yang proporsional dengan bentuk wajah dan tekstur rambut mereka.
4. **Kebutuhan Fleksibilitas Booking vs Walk-in**: Di jam-jam ramai, barbershop perlu beralih ke mode *Walk-In Only* tanpa harus mematikan website.

### 2.2 Tujuan Produk (Product Objectives)
- Menyediakan katalog tarif layanan (*Price List*) dan profil kapster/barber yang elegan dan responsif.
- Membantu pelanggan menentukan gaya rambut optimal melalui fitur **AI Master Barber Consultant**.
- Menyediakan **Master Switch** untuk membuka/menutup sistem reservasi online secara instan.
- Mempercepat alur kasir POS dengan input transaksi popup satu-layar yang langsung menghitung kembalian dan memperbarui omzet harian.

---

## 3. User Personas & Roles

| Peran (Role) | Profil Pengguna | Kebutuhan Utama |
| :--- | :--- | :--- |
| **Pelanggan Umum (Public Visitor)** | Pria/pemuda Kota Solok & sekitarnya yang mencari layanan grooming profesional. | Melihat price list, mengecek antrean live lounge, konsultasi gaya rambut AI, dan melakukan reservasi atau mengecek tiket booking. |
| **Kasir / Staff Barbershop** | Staf operasional di meja resepsionis/kasir. | Input transaksi pelanggan dengan cepat, memilih nama barber yang melayani, menghitung uang kembalian, dan memantau antrean. |
| **Owner / Store Manager** | Pemilik Elegant Barbershop Solok. | Memantau omzet harian secara real-time, mengelola harga layanan, mengontrol master switch booking, dan melihat laporan keuangan. |

---

## 4. Functional Specifications & Feature Modules

### 4.1 Modul Publik (Public Portal)
1. **Hero & Brand Banner**:
   - Menampilkan identitas resmi brand, slogan Minang *"Masuak Cayah Kalua Cogah"*, badge jam buka (10.00 – 22.00 WIB), dan alamat di Jl. Perwira Kota Solok.
   - Akses cepat menuju katalog layanan dan status kunjungan.
2. **Price List & Katalog Layanan**:
   - Filter berdasarkan kategori: *Semua, Haircut, Shaving, VIP Package, Beard, Treatment*.
   - Rincian harga dalam format Rupiah (IDR) yang jelas dan kontras.
3. **Live Lounge & Queue Indicator**:
   - Menampilkan status toko (BUKA / TUTUP).
   - Indikator tamu yang sedang mengantre di lounge (misal: *3 Tamu Sedang Mengantre*).
   - Estimasi waktu tunggu real-time.
4. **AI Haircut & Style Consultant (Gemini 3.7 Flash)**:
   - Form kustomisasi: Bentuk wajah (Oval, Square, Round, Diamond, Heart), tekstur rambut, gaya hidup/pekerjaan, panjang rambut yang diinginkan, dan preferensi jenggot/kumis.
   - Output terstruktur: Nama gaya potongan ideal, alasan proporsi wajah, 3 langkah tips styling harian, rekomendasi produk grooming, dan jadwal maintenance pangkas berikutnya.
   - Dilengkapi fallback heuristic cerdas jika koneksi internet terputus.
5. **Form Reservasi Online & Lacak Tiket**:
   - Pemilihan layanan, barber favorit, tanggal pangkas, dan jam booking.
   - Pengecekan kode reservasi otomatis (*ELG-XXXX*) atau berdasarkan nomor handphone.
   - Terintegrasi dengan Master Switch (otomatis menampilkan mode Walk-In jika booking sedang ditutup).
6. **Tim Master Barber**:
   - Showcase barber profesional, pengalaman terbang (tahun), keahlian khusus, dan rating.
7. **Lokasi & Kontak Interaktif**:
   - Embed peta interaktif Jl. Perwira Kota Solok, tombol navigasi Google Maps, dan tombol WhatsApp resmi.

### 4.2 Modul Pengelola & Kasir POS (Admin Portal)
1. **Master Switch Reservasi & Antrean Lounge**:
   - Tombol toggle 1-klik untuk membuka/menutup form booking publik.
   - Kontrol kuota antrean (+ / - tamu) untuk sinkronisasi instan ke beranda pengunjung.
2. **Kasir POS Modal Cepat**:
   - Popup transaksi ringkas (1 layanan utama per pesanan).
   - Dropdown pemilihan barber yang melayani.
   - Pilihan metode pembayaran: *Tunai (Cash), QRIS, Transfer Bank*.
   - Kalkulator otomatis nominal bayar dan uang kembalian (*change calculation*).
   - Penghitungan omzet harian otomatis dan kartu ringkasan visual.
3. **Manajemen Reservasi (Bookings Tab)**:
   - Tabel reservasi masuk, filter status (*pending, confirmed, completed, cancelled*), dan aksi update status.
4. **Manajemen Katalog Layanan (Services Tab)**:
   - Form tambah/edit layanan sederhana (Nama Layanan, Kategori, Harga).
   - Toggle status aktif/non-aktif layanan.
5. **Manajemen Tim Barber (Barbers Tab)**:
   - Form tambah dan kelola data profil barber.
6. **Laporan & Rekapitulasi (Reports Tab)**:
   - Rekap omzet harian, mingguan, dan performa transaksi.
7. **Panduan Operasional Kasir (Admin Guide Tab)**:
   - Dokumentasi alur kerja kasir dan tips operasional harian.

---

## 5. Non-Functional Requirements (NFR)

1. **Keamanan (Security)**:
   - Sanitasi input otomatis di semua API route backend untuk mencegah serangan XSS dan injection.
   - In-memory rate limiting pada API publik (AI Consultant & Bookings) untuk mencegah spam.
   - HTTP Security Headers (`X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`).
   - Server-side proxy untuk Gemini API key agar tidak pernah terekspos ke browser.
2. **Kinerja & Kecepatan (Performance)**:
   - Waktu muat awal di bawah 1.5 detik dengan Next.js App Router & Tailwind CSS.
   - Client-side data caching dengan fallback `localStorage` sehingga UI tetap responsif saat koneksi lambat.
3. **Desain & Responsivitas (UI/UX)**:
   - Palet warna mewah: Dark Charcoal/Onyx (`#0C0C12`, `#14141E`) berpadu dengan aksen Warm Gold (`#D4AF37`) dan teks kontras tinggi.
   - Desain responsif optimal untuk Smartphone (Mobile-First touch target minimal 44px), Tablet, dan Layar Desktop/Kasir.
4. **Keandalan & Ketahanan (Reliability & Resilience)**:
   - Dual-mode data architecture: Dapat beroperasi sebagai Full-Stack REST API (Next.js Route Handlers) maupun mode Client-Side Storage secara mulus.

---

## 6. Success Metrics & Key Performance Indicators (KPI)
- **Zero Calculation Error**: Menghilangkan selisih perhitungan omzet kasir harian.
- **Kasir Cepat (< 15 Detik)**: Waktu pencatatan 1 transaksi kasir walk-in selesai dalam kurang dari 15 detik.
- **Tingkat Adopsi Konsultasi AI**: > 40% pengunjung baru mencoba fitur AI Barber Consultant sebelum datang.
