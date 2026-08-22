-- ========================================================================
-- 0016_grant_full_crud_to_anon.sql
-- Fix: anon role needs GRANT UPDATE + DELETE on all tables
-- Migration 0015 only created RLS policies but forgot table-level GRANTs.
-- Without GRANT, PostgreSQL blocks UPDATE/DELETE even if RLS allows it.
-- ========================================================================

-- ── 1. GRANT full CRUD to anon role ─────────────────────────────────────────
-- This ensures the anon key (used by client-side Supabase SDK) can do
-- SELECT, INSERT, UPDATE, DELETE on all operational tables.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barbers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_items TO anon;

-- system_settings (if exists)
DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO anon;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ── 2. Ensure sequences are usable ──────────────────────────────────────────
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ── 3. Ensure RLS policies allow all operations (overwrite old policies) ────
-- Drop old restrictive policies and recreate permissive ones.

-- Categories
DROP POLICY IF EXISTS "Anon All Categories" ON public.categories;
DROP POLICY IF EXISTS "Realtime Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Anon Read Categories" ON public.categories;
CREATE POLICY "Anon Full Access Categories"
ON public.categories FOR ALL
USING (true) WITH CHECK (true);

-- Services
DROP POLICY IF EXISTS "Anon All Services" ON public.services;
DROP POLICY IF EXISTS "Realtime Read Services" ON public.services;
DROP POLICY IF EXISTS "Anon Read Services" ON public.services;
CREATE POLICY "Anon Full Access Services"
ON public.services FOR ALL
USING (true) WITH CHECK (true);

-- Barbers
DROP POLICY IF EXISTS "Anon All Barbers" ON public.barbers;
DROP POLICY IF EXISTS "Realtime Read Barbers" ON public.barbers;
DROP POLICY IF EXISTS "Anon Read Barbers" ON public.barbers;
CREATE POLICY "Anon Full Access Barbers"
ON public.barbers FOR ALL
USING (true) WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Anon All Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Realtime Read Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Realtime Insert Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anon Read Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anon Insert Bookings" ON public.bookings;
CREATE POLICY "Anon Full Access Bookings"
ON public.bookings FOR ALL
USING (true) WITH CHECK (true);

-- Transactions
DROP POLICY IF EXISTS "Anon All Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Realtime Read Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Realtime Insert Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anon Read Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anon Insert Transactions" ON public.transactions;
CREATE POLICY "Anon Full Access Transactions"
ON public.transactions FOR ALL
USING (true) WITH CHECK (true);

-- Transaction Items
DROP POLICY IF EXISTS "Anon All Transaction Items" ON public.transaction_items;
DROP POLICY IF EXISTS "Realtime Read Transaction Items" ON public.transaction_items;
DROP POLICY IF EXISTS "Realtime Insert Transaction Items" ON public.transaction_items;
DROP POLICY IF EXISTS "Anon Read Transaction Items" ON public.transaction_items;
DROP POLICY IF EXISTS "Anon Insert Transaction Items" ON public.transaction_items;
CREATE POLICY "Anon Full Access Transaction Items"
ON public.transaction_items FOR ALL
USING (true) WITH CHECK (true);

-- System Settings
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anon All Settings" ON public.system_settings;
  DROP POLICY IF EXISTS "Realtime Read Settings" ON public.system_settings;
  DROP POLICY IF EXISTS "Anon Read Settings" ON public.system_settings;
  CREATE POLICY "Anon Full Access Settings"
  ON public.system_settings FOR ALL
  USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ── 4. service_role retains full access (safety net) ────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
