-- ========================================================================
-- 0005_rls_anon_read.sql — Allow anon role to read public data
-- Fixes 401 errors when anon key queries tables
-- ========================================================================

-- Allow anon (public) to SELECT from all public tables
-- This enables the website to load services, barbers, etc.

DROP POLICY IF EXISTS "Anon Read Categories" ON public.categories;
CREATE POLICY "Anon Read Categories"
ON public.categories FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anon Read Services" ON public.services;
CREATE POLICY "Anon Read Services"
ON public.services FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anon Read Barbers" ON public.barbers;
CREATE POLICY "Anon Read Barbers"
ON public.barbers FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anon Read Bookings" ON public.bookings;
CREATE POLICY "Anon Read Bookings"
ON public.bookings FOR SELECT
USING (true);

-- Allow anon to INSERT bookings (public booking form)
DROP POLICY IF EXISTS "Anon Insert Bookings" ON public.bookings;
CREATE POLICY "Anon Insert Bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- Allow anon to SELECT transactions (for tracking)
DROP POLICY IF EXISTS "Anon Read Transactions" ON public.transactions;
CREATE POLICY "Anon Read Transactions"
ON public.transactions FOR SELECT
USING (true);

-- Allow anon to INSERT transactions (POS)
DROP POLICY IF EXISTS "Anon Insert Transactions" ON public.transactions;
CREATE POLICY "Anon Insert Transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

-- Allow anon to SELECT transaction items
DROP POLICY IF EXISTS "Anon Read Transaction Items" ON public.transaction_items;
CREATE POLICY "Anon Read Transaction Items"
ON public.transaction_items FOR SELECT
USING (true);

-- Allow anon to INSERT transaction items
DROP POLICY IF EXISTS "Anon Insert Transaction Items" ON public.transaction_items;
CREATE POLICY "Anon Insert Transaction Items"
ON public.transaction_items FOR INSERT
WITH CHECK (true);

-- Grant SELECT to anon role on all tables
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.barbers TO anon;
GRANT SELECT, INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT ON public.transactions TO anon;
GRANT SELECT, INSERT ON public.transaction_items TO anon;

-- Grant USAGE on sequences for INSERT operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
