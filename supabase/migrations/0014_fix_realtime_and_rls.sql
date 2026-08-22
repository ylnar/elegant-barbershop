-- ========================================================================
-- 0014_fix_realtime_and_rls.sql
-- Fix Supabase Realtime and RLS policies for proper data synchronization
-- 
-- Issues fixed:
-- 1. Ensure REPLICA IDENTITY FULL is set on all tables
-- 2. Ensure all tables are in supabase_realtime publication
-- 3. Add proper RLS policies for realtime to work
-- 4. Grant necessary permissions for anon role
-- ========================================================================

-- ========================================================================
-- 1. ENSURE REPLICA IDENTITY FULL FOR ALL TABLES
-- ========================================================================

-- Required for Supabase Realtime to capture full row data in events
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.barbers REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.transaction_items REPLICA IDENTITY FULL;

-- Also for system_settings if it exists
DO $$ BEGIN
  ALTER TABLE public.system_settings REPLICA IDENTITY FULL;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ========================================================================
-- 2. ENSURE ALL TABLES ARE IN SUPABASE_REALTIME PUBLICATION
-- ========================================================================

DO $$
DECLARE
  table_name TEXT;
  tables_to_add TEXT[] := ARRAY[
    'categories', 'services', 'barbers', 'bookings', 
    'transactions', 'transaction_items'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_add
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = table_name 
      AND schemaname = 'public'
    ) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
        RAISE NOTICE 'Added % to supabase_realtime publication', table_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add % to publication: %', table_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- Add system_settings if it exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'system_settings' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ========================================================================
-- 3. FIX RLS POLICIES FOR REALTIME TO WORK
-- ========================================================================

-- Supabase Realtime requires that the anon role can SELECT from tables
-- even when RLS is enabled. We need to ensure SELECT policies exist.

-- Categories
DROP POLICY IF EXISTS "Realtime Read Categories" ON public.categories;
CREATE POLICY "Realtime Read Categories"
ON public.categories FOR SELECT
USING (true);

-- Services  
DROP POLICY IF EXISTS "Realtime Read Services" ON public.services;
CREATE POLICY "Realtime Read Services"
ON public.services FOR SELECT
USING (true);

-- Barbers
DROP POLICY IF EXISTS "Realtime Read Barbers" ON public.barbers;
CREATE POLICY "Realtime Read Barbers"
ON public.barbers FOR SELECT
USING (true);

-- Bookings - allow anon to read for tracking
DROP POLICY IF EXISTS "Realtime Read Bookings" ON public.bookings;
CREATE POLICY "Realtime Read Bookings"
ON public.bookings FOR SELECT
USING (true);

-- Allow anon to insert bookings (public booking form)
DROP POLICY IF EXISTS "Realtime Insert Bookings" ON public.bookings;
CREATE POLICY "Realtime Insert Bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- Transactions - allow anon to read for tracking
DROP POLICY IF EXISTS "Realtime Read Transactions" ON public.transactions;
CREATE POLICY "Realtime Read Transactions"
ON public.transactions FOR SELECT
USING (true);

-- Allow anon to insert transactions (POS)
DROP POLICY IF EXISTS "Realtime Insert Transactions" ON public.transactions;
CREATE POLICY "Realtime Insert Transactions"
ON public.transactions FOR INSERT
WITH CHECK (true);

-- Transaction Items - allow anon to read
DROP POLICY IF EXISTS "Realtime Read Transaction Items" ON public.transaction_items;
CREATE POLICY "Realtime Read Transaction Items"
ON public.transaction_items FOR SELECT
USING (true);

-- Allow anon to insert transaction items
DROP POLICY IF EXISTS "Realtime Insert Transaction Items" ON public.transaction_items;
CREATE POLICY "Realtime Insert Transaction Items"
ON public.transaction_items FOR INSERT
WITH CHECK (true);

-- System Settings - allow anon to read
DO $$ BEGIN
  DROP POLICY IF EXISTS "Realtime Read Settings" ON public.system_settings;
  CREATE POLICY "Realtime Read Settings"
  ON public.system_settings FOR SELECT
  USING (true);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ========================================================================
-- 4. GRANT NECESSARY PERMISSIONS TO ANON ROLE
-- ========================================================================

-- Grant SELECT on all tables to anon (needed for realtime subscriptions)
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.barbers TO anon;
GRANT SELECT ON public.bookings TO anon;
GRANT SELECT ON public.transactions TO anon;
GRANT SELECT ON public.transaction_items TO anon;

-- Grant INSERT on tables that anon needs to write to
GRANT INSERT ON public.bookings TO anon;
GRANT INSERT ON public.transactions TO anon;
GRANT INSERT ON public.transaction_items TO anon;

-- Grant usage on sequences for INSERT operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ========================================================================
-- 5. ENSURE SERVICE_ROLE HAS FULL ACCESS
-- ========================================================================

-- Grant full access to service_role for server-side operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ========================================================================
-- 6. ENABLE REALTIME CHANGES (ALTER PUBLICATION)
-- ========================================================================

-- This is equivalent to toggling "Enable Realtime" in Supabase Dashboard
-- For each table, we ensure it's in the publication with replica identity

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename IN ('categories', 'services', 'barbers', 'bookings', 'transactions', 'transaction_items')
  LOOP
    -- Ensure replica identity is FULL
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t.tablename);
    
    -- Ensure it's in the publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t.tablename 
      AND schemaname = 'public'
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t.tablename);
    END IF;
  END LOOP;
END $$;

-- ========================================================================
-- 7. VERIFICATION QUERY (for debugging)
-- ========================================================================

-- Run this to verify realtime is properly configured:
-- SELECT 
--   schemaname,
--   tablename,
--   replica_identity,
--   (
--     SELECT EXISTS (
--       SELECT 1 FROM pg_publication_tables 
--       WHERE pubname = 'supabase_realtime' 
--       AND pt.schemaname = public.pg_tables.schemaname
--       AND pt.tablename = public.pg_tables.tablename
--     )
--   ) as in_realtime_publication
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('categories', 'services', 'barbers', 'bookings', 'transactions', 'transaction_items')
-- ORDER BY tablename;

-- ========================================================================
-- DONE! Realtime should now work for all tables.
-- ========================================================================
