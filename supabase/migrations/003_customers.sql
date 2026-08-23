-- ========================================================================
-- 003_customers.sql — Tabel Customers untuk Anti-Duplicate Phone Number
-- Mencegah data pelanggan ganda berdasarkan nomor HP.
-- ========================================================================

-- ========================================================================
-- 1. TABEL: customers
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    total_bookings INTEGER DEFAULT 0 NOT NULL,
    last_booking_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique constraint: 1 nomor HP = 1 data pelanggan
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique ON public.customers(phone);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(is_active);

-- ========================================================================
-- 2. UPSERT FUNCTION — Insert atau Update Customer by Phone
-- ========================================================================
CREATE OR REPLACE FUNCTION public.fn_upsert_customer(
    p_name VARCHAR(120),
    p_phone VARCHAR(30),
    p_email VARCHAR(150) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_customer public.customers%ROWTYPE;
    v_normalized_phone VARCHAR(30);
    v_now DATE := CURRENT_DATE;
BEGIN
    -- Normalize phone: remove non-digits for comparison
    v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- Try to find existing customer by normalized phone
    SELECT * INTO v_customer
    FROM public.customers
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_normalized_phone
    LIMIT 1;

    IF FOUND THEN
        -- Customer exists: update name if different, increment booking count
        UPDATE public.customers
        SET
            name = CASE
                WHEN p_name IS NOT NULL AND TRIM(p_name) != '' THEN TRIM(p_name)
                ELSE name
            END,
            email = CASE
                WHEN p_email IS NOT NULL AND TRIM(p_email) != '' THEN TRIM(p_email)
                ELSE email
            END,
            total_bookings = total_bookings + 1,
            last_booking_date = v_now,
            updated_at = NOW()
        WHERE id = v_customer.id
        RETURNING * INTO v_customer;

        RETURN jsonb_build_object(
            'is_new', false,
            'customer', to_jsonb(v_customer)
        );
    ELSE
        -- New customer: insert
        INSERT INTO public.customers (name, phone, email, total_bookings, last_booking_date)
        VALUES (TRIM(p_name), TRIM(p_phone), p_email, 1, v_now)
        RETURNING * INTO v_customer;

        RETURN jsonb_build_object(
            'is_new', true,
            'customer', to_jsonb(v_customer)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- 3. LOOKUP FUNCTION — Cari Customer by Phone
-- ========================================================================
CREATE OR REPLACE FUNCTION public.fn_lookup_customer_by_phone(
    p_phone VARCHAR(30)
)
RETURNS JSONB AS $$
DECLARE
    v_customer public.customers%ROWTYPE;
    v_normalized_phone VARCHAR(30);
BEGIN
    -- Normalize phone for comparison
    v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    SELECT * INTO v_customer
    FROM public.customers
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_normalized_phone
    AND is_active = true
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'found', true,
            'customer', to_jsonb(v_customer)
        );
    ELSE
        RETURN jsonb_build_object(
            'found', false,
            'customer', NULL
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- 4. BOOTSTRAP — Insert customers dari data booking & transaksi yang ada
-- ========================================================================
DO $$
BEGIN
    -- Insert dari bookings (ambil data pelanggan terakhir per nomor HP)
    INSERT INTO public.customers (name, phone, email, total_bookings, last_booking_date, created_at)
    SELECT
        customer_name,
        customer_phone,
        NULL AS email,
        COUNT(*)::INTEGER AS total_bookings,
        MAX(date) AS last_booking_date,
        MIN(created_at) AS created_at
    FROM public.bookings
    WHERE customer_phone IS NOT NULL
      AND customer_phone != ''
      AND is_deleted = false
    GROUP BY customer_name, customer_phone
    ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        total_bookings = GREATEST(public.customers.total_bookings, EXCLUDED.total_bookings),
        last_booking_date = GREATEST(public.customers.last_booking_date, EXCLUDED.last_booking_date),
        updated_at = NOW();

    RAISE NOTICE 'Customers table bootstrapped from existing bookings.';
END $$;

-- ========================================================================
-- 5. RLS — Full Access untuk anon
-- ========================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon Full Access Customers" ON public.customers;
CREATE POLICY "Anon Full Access Customers" ON public.customers
    FOR ALL USING (true) WITH CHECK (true);

-- ========================================================================
-- 6. GRANTS
-- ========================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon;
GRANT EXECUTE ON FUNCTION public.fn_upsert_customer(VARCHAR, VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_lookup_customer_by_phone(VARCHAR) TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================================================
-- 7. REALTIME
-- ========================================================================
ALTER TABLE public.customers REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'customers' AND schemaname = 'public'
    ) THEN
        BEGIN
            EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.customers';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;
