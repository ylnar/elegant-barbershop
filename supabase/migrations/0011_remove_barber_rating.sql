-- Remove unused rating field from barber profiles.
ALTER TABLE public.barbers
DROP COLUMN IF EXISTS rating;
