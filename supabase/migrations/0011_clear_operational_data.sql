-- ========================================================================
-- 0011_clear_operational_data.sql
-- Reset TOTAL data operasional → aplikasi mulai dari 0:
--   1. transaction_items  (rincian item transaksi)
--   2. transactions       (header transaksi kasir POS)
--   3. bookings           (reservasi / antrean online)
-- Data master (categories, services/pricelist, barbers, settings,
-- admin_users) TIDAK disentuh.
-- Urutan DELETE mengikuti arah FOREIGN KEY agar aman & idempotent.
-- ========================================================================

DELETE FROM public.transaction_items;
DELETE FROM public.transactions;
DELETE FROM public.bookings;
