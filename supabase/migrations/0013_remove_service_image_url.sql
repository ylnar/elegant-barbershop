-- ========================================================================
-- 0013: REMOVE SERVICE IMAGE_URL
-- Kolom image_url pada tabel services tidak lagi digunakan:
-- UI (pricelist & form booking) tidak menampilkan foto layanan.
-- ========================================================================

ALTER TABLE public.services
DROP COLUMN IF EXISTS image_url;
