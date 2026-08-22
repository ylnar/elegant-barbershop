-- Remove unused profile description from barber records.
ALTER TABLE public.barbers
DROP COLUMN IF EXISTS bio;
