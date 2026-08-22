-- ========================================================================
-- 0009_soft_delete_and_audit.sql
-- 1. Tambah kolom is_deleted & deleted_at untuk soft delete
-- 2. Index untuk filter data aktif
-- ========================================================================

-- ── 1. SOFT DELETE COLUMNS ──
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── 2. INDEX untuk query cepat (hanya data aktif) ──
CREATE INDEX IF NOT EXISTS idx_services_not_deleted ON public.services(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_barbers_not_deleted ON public.barbers(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bookings_not_deleted ON public.bookings(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted ON public.transactions(is_deleted) WHERE is_deleted = FALSE;
