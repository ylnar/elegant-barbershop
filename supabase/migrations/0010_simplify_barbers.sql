-- ========================================================================
-- 0010_simplify_barbers.sql
-- Hapus kolom yang tidak perlu dari barbers:
--   specialty, experience_years, review_count, role, nickname
-- Simpan: id, name, is_active, working_days, timestamps
-- ========================================================================

-- Drop dependent views first
DROP VIEW IF EXISTS public.v_booking_details;

-- Drop columns
ALTER TABLE public.barbers DROP COLUMN IF EXISTS specialty;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS experience_years;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS review_count;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS role;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS nickname;

-- Recreate view without nickname reference
CREATE OR REPLACE VIEW public.v_booking_details
WITH (security_invoker = true) AS
SELECT
    b.id,
    b.booking_code,
    b.customer_name,
    b.customer_phone,
    b.customer_email,
    b.date,
    b.time_slot,
    b.status,
    b.total_amount,
    b.notes,
    b.is_walk_in,
    b.service_name,
    b.service_price,
    COALESCE(c.name, b.service_category, 'Haircut') AS category_name,
    b.barber_name,
    b.created_at,
    b.updated_at
FROM public.bookings b
LEFT JOIN public.services s ON b.service_id = s.id
LEFT JOIN public.categories c ON s.category_id = c.id
LEFT JOIN public.barbers br ON b.barber_id = br.id;

-- Update seed data
UPDATE public.barbers SET name = 'Rian Pratama' WHERE name LIKE '%Rian%';
UPDATE public.barbers SET name = 'Dimas Saputra' WHERE name LIKE '%Dimas%';
UPDATE public.barbers SET name = 'Aldi Wijaya' WHERE name LIKE '%Aldi%';
