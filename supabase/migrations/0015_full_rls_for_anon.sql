-- ========================================================================
-- 0015_full_rls_for_anon.sql
-- Allow anon role to perform all CRUD operations directly from client
-- This enables the client-side Supabase SDK to do everything without /api
-- ========================================================================

-- ── SERVICES ──
DROP POLICY IF EXISTS "Anon All Services" ON public.services;
CREATE POLICY "Anon All Services"
ON public.services FOR ALL
USING (true) WITH CHECK (true);

-- ── BARBERS ──
DROP POLICY IF EXISTS "Anon All Barbers" ON public.barbers;
CREATE POLICY "Anon All Barbers"
ON public.barbers FOR ALL
USING (true) WITH CHECK (true);

-- ── BOOKINGS ──
DROP POLICY IF EXISTS "Anon All Bookings" ON public.bookings;
CREATE POLICY "Anon All Bookings"
ON public.bookings FOR ALL
USING (true) WITH CHECK (true);

-- ── TRANSACTIONS ──
DROP POLICY IF EXISTS "Anon All Transactions" ON public.transactions;
CREATE POLICY "Anon All Transactions"
ON public.transactions FOR ALL
USING (true) WITH CHECK (true);

-- ── TRANSACTION ITEMS ──
DROP POLICY IF EXISTS "Anon All Transaction Items" ON public.transaction_items;
CREATE POLICY "Anon All Transaction Items"
ON public.transaction_items FOR ALL
USING (true) WITH CHECK (true);

-- ── SYSTEM SETTINGS ──
DROP POLICY IF EXISTS "Anon All Settings" ON public.system_settings;
CREATE POLICY "Anon All Settings"
ON public.system_settings FOR ALL
USING (true) WITH CHECK (true);

-- ── CATEGORIES ──
DROP POLICY IF EXISTS "Anon All Categories" ON public.categories;
CREATE POLICY "Anon All Categories"
ON public.categories FOR ALL
USING (true) WITH CHECK (true);
