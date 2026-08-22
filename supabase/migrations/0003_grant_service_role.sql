-- ========================================================================
-- 0003_grant_service_role.sql — Grant full privileges to service_role
-- Fix: service_role tidak punya akses tabel karena belum di-GRANT
-- ========================================================================

-- Grant ALL privileges on all tables to service_role
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.barbers TO service_role;
GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.transaction_items TO service_role;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant EXECUTE on all functions/procedures
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Also grant to authenticated role (for logged-in users)
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.barbers TO authenticated;
GRANT SELECT ON public.bookings TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT ON public.transaction_items TO authenticated;
GRANT INSERT ON public.bookings TO authenticated;
GRANT INSERT ON public.transactions TO authenticated;
GRANT INSERT ON public.transaction_items TO authenticated;
GRANT UPDATE ON public.bookings TO authenticated;
GRANT UPDATE ON public.transactions TO authenticated;
