-- ========================================================================
-- 0001_init_schema.sql — Skema lengkap Elegant Barbershop Solok
-- Dihasilkan dari supabase/schema.sql (idempotent: aman dijalankan ulang).
-- Jalankan via: npm run db:migrate
-- ========================================================================

-- ========================================================================
-- ELEGANT BARBERSHOP SOLOK - PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- FOCUS: CATEGORIES, SERVICES, BARBERS, BOOKINGS & POS TRANSACTIONS (ACID)
-- Slogan: "Masuak Cayah Kalua Cogah" | Jl. Perwira No. 12 Kota Solok
-- ========================================================================

-- Enable essential extensions for UUID generation and cryptographic functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- 1. TABLE: categories (Kategori Layanan & Pengelompokan POS)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT 'Scissors' NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active, display_order);

-- ========================================================================
-- 2. TABLE: services (Katalog Layanan & Pricelist Resmi)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_slug VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    duration_minutes INTEGER DEFAULT 35 NOT NULL CHECK (duration_minutes > 0),
    description TEXT,
    badge VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_category_slug ON public.services(category_slug);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- ========================================================================
-- 3. TABLE: barbers (Tim Master Barber & Hairdresser)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    nickname VARCHAR(50),
    role VARCHAR(80) DEFAULT 'Master Barber' NOT NULL,
    experience_years INTEGER DEFAULT 3 NOT NULL CHECK (experience_years >= 0),
    specialty TEXT[] DEFAULT ARRAY['Classic Haircut', 'Fade Precision']::TEXT[],
    review_count INTEGER DEFAULT 0 NOT NULL CHECK (review_count >= 0),
    photo_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,0]::INTEGER[], -- 0=Minggu, 1=Senin, dst.
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_barbers_active ON public.barbers(is_active);

-- ========================================================================
-- 4. TABLE: bookings (Sistem Reservasi Online & Tiket Pelanggan)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(30) UNIQUE NOT NULL, -- e.g. ELG-8821
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(150),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name VARCHAR(150) NOT NULL,
    service_category VARCHAR(50),
    service_price NUMERIC(12, 2) NOT NULL CHECK (service_price >= 0),
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    barber_name VARCHAR(120) NOT NULL,
    date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL, -- e.g. '14:00', '14:30'
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_service', 'completed', 'cancelled')),
    notes TEXT,
    is_walk_in BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Optimized Performance Indexes for Fast Booking Lookup
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON public.bookings(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_date ON public.bookings(barber_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_desc ON public.bookings(created_at DESC);

-- ========================================================================
-- 5. TABLE: transactions (Header Transaksi Kasir POS & Omzet)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(40) UNIQUE NOT NULL, -- e.g. INV-20260820-001
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    booking_code VARCHAR(30),
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30),
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    barber_name VARCHAR(120) NOT NULL,
    cashier_name VARCHAR(120) DEFAULT 'Kasir Utama' NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (discount >= 0),
    tax NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (tax >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer', 'debit')),
    payment_status VARCHAR(30) DEFAULT 'paid' NOT NULL CHECK (payment_status IN ('paid', 'pending', 'refunded')),
    amount_paid NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (amount_paid >= 0),
    change_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (change_amount >= 0),
    items JSONB DEFAULT '[]'::JSONB NOT NULL, -- Snapshot JSON data item
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_barber ON public.transactions(barber_name);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON public.transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);

-- ========================================================================
-- 6. TABLE: transaction_items (Rincian Item Transaksi per Baris)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name VARCHAR(150) NOT NULL,
    category_name VARCHAR(100),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trx_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_trx_items_service_id ON public.transaction_items(service_id);

-- ========================================================================
-- 7. TRIGGERS: Auto-Update Timestamp Function
-- ========================================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_barbers_updated_at ON public.barbers;
CREATE TRIGGER trg_barbers_updated_at
BEFORE UPDATE ON public.barbers
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ========================================================================
-- 8. STORED PROCEDURES & ACID TRANSACTIONS
-- ========================================================================

-- A. ACID POS Transaction Creator
CREATE OR REPLACE FUNCTION public.fn_create_pos_transaction(
    p_invoice_number VARCHAR(40),
    p_booking_id UUID,
    p_customer_name VARCHAR(120),
    p_customer_phone VARCHAR(30),
    p_barber_id UUID,
    p_barber_name VARCHAR(120),
    p_items JSONB,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_total_amount NUMERIC,
    p_payment_method VARCHAR(30),
    p_amount_paid NUMERIC,
    p_change_amount NUMERIC,
    p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_new_trx public.transactions%ROWTYPE;
    v_inv VARCHAR(40);
    v_bcode VARCHAR(30) := NULL;
    v_item JSONB;
    v_item_srv_id UUID;
    v_item_name VARCHAR(150);
    v_item_price NUMERIC;
    v_item_qty INT;
    v_item_subtotal NUMERIC;
BEGIN
    -- 1. Auto generate invoice if not provided
    IF p_invoice_number IS NULL OR TRIM(p_invoice_number) = '' THEN
        v_inv := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    ELSE
        v_inv := p_invoice_number;
    END IF;

    -- 2. Fetch booking code if booking_id passed
    IF p_booking_id IS NOT NULL THEN
        SELECT booking_code INTO v_bcode FROM public.bookings WHERE id = p_booking_id;
    END IF;

    -- 3. Insert Master Transaction
    INSERT INTO public.transactions (
        invoice_number, booking_id, booking_code, customer_name, customer_phone,
        barber_id, barber_name, items, subtotal, discount,
        total_amount, payment_method, payment_status, amount_paid, change_amount, notes, created_at
    ) VALUES (
        v_inv, p_booking_id, v_bcode, p_customer_name, p_customer_phone,
        p_barber_id, p_barber_name, COALESCE(p_items, '[]'::JSONB), p_subtotal, COALESCE(p_discount, 0),
        p_total_amount, p_payment_method, 'paid', COALESCE(p_amount_paid, p_total_amount), COALESCE(p_change_amount, 0), p_notes, NOW()
    ) RETURNING * INTO v_new_trx;

    -- 4. Unpack items and insert into transaction_items table for granular reporting
    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_item_name := COALESCE(v_item->>'serviceName', 'Layanan Pangkas');
            v_item_price := COALESCE((v_item->>'price')::NUMERIC, (v_item->>'unitPrice')::NUMERIC, 0);
            v_item_qty := COALESCE((v_item->>'qty')::INT, (v_item->>'quantity')::INT, 1);
            v_item_subtotal := v_item_price * v_item_qty;

            -- Safe UUID parse if present
            BEGIN
                v_item_srv_id := (v_item->>'serviceId')::UUID;
            EXCEPTION WHEN OTHERS THEN
                v_item_srv_id := NULL;
            END;

            INSERT INTO public.transaction_items (
                transaction_id, service_id, service_name, unit_price, quantity, subtotal, created_at
            ) VALUES (
                v_new_trx.id, v_item_srv_id, v_item_name, v_item_price, v_item_qty, v_item_subtotal, NOW()
            );
        END LOOP;
    END IF;

    -- 5. Mark booking as completed if linked
    IF p_booking_id IS NOT NULL THEN
        UPDATE public.bookings 
        SET status = 'completed', updated_at = NOW() 
        WHERE id = p_booking_id;
    END IF;

    RETURN to_jsonb(v_new_trx);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Daily Omzet & Payment Summary Report
CREATE OR REPLACE FUNCTION public.fn_get_daily_summary(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    report_date DATE,
    total_transactions BIGINT,
    total_omzet NUMERIC,
    cash_omzet NUMERIC,
    qris_omzet NUMERIC,
    transfer_omzet NUMERIC,
    avg_ticket_size NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_date AS report_date,
        COUNT(id)::BIGINT AS total_transactions,
        COALESCE(SUM(total_amount), 0)::NUMERIC AS total_omzet,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0)::NUMERIC AS cash_omzet,
        COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0)::NUMERIC AS qris_omzet,
        COALESCE(SUM(CASE WHEN payment_method IN ('transfer', 'debit') THEN total_amount ELSE 0 END), 0)::NUMERIC AS transfer_omzet,
        COALESCE(AVG(total_amount), 0)::NUMERIC AS avg_ticket_size
    FROM public.transactions
    WHERE DATE(created_at AT TIME ZONE 'Asia/Jakarta') = p_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- C. Category Revenue Breakdown Report
CREATE OR REPLACE FUNCTION public.fn_get_category_revenue_summary(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    category_name VARCHAR,
    total_items_sold BIGINT,
    total_revenue NUMERIC,
    percentage_share NUMERIC
) AS $$
DECLARE
    v_total_sum NUMERIC;
BEGIN
    SELECT COALESCE(SUM(subtotal), 1) INTO v_total_sum
    FROM public.transaction_items
    WHERE DATE(created_at AT TIME ZONE 'Asia/Jakarta') BETWEEN p_start_date AND p_end_date;

    RETURN QUERY
    SELECT
        COALESCE(c.name, ti.category_name, 'Haircut & Styling')::VARCHAR AS category_name,
        COUNT(ti.id)::BIGINT AS total_items_sold,
        COALESCE(SUM(ti.subtotal), 0)::NUMERIC AS total_revenue,
        ROUND((COALESCE(SUM(ti.subtotal), 0) / v_total_sum * 100)::NUMERIC, 2) AS percentage_share
    FROM public.transaction_items ti
    LEFT JOIN public.services s ON ti.service_id = s.id
    LEFT JOIN public.categories c ON s.category_id = c.id
    WHERE DATE(ti.created_at AT TIME ZONE 'Asia/Jakarta') BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(c.name, ti.category_name, 'Haircut & Styling')
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================================================
-- 9. ANALYTICAL VIEWS (SECURITY INVOKER FOR RLS COMPLIANCE)
-- ========================================================================

-- Detailed Booking View with Category and Barber info
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
    br.nickname AS barber_nickname,
    b.created_at,
    b.updated_at
FROM public.bookings b
LEFT JOIN public.services s ON b.service_id = s.id
LEFT JOIN public.categories c ON s.category_id = c.id
LEFT JOIN public.barbers br ON b.barber_id = br.id;

-- Detailed Transaction Reports View
CREATE OR REPLACE VIEW public.v_transaction_reports
WITH (security_invoker = true) AS
SELECT
    t.id AS transaction_id,
    t.invoice_number,
    t.customer_name,
    t.customer_phone,
    t.barber_name,
    t.payment_method,
    t.payment_status,
    t.subtotal,
    t.discount,
    t.total_amount,
    t.amount_paid,
    t.change_amount,
    t.created_at,
    COALESCE(jsonb_agg(
        jsonb_build_object(
            'itemName', ti.service_name,
            'unitPrice', ti.unit_price,
            'quantity', ti.quantity,
            'subtotal', ti.subtotal
        )
    ) FILTER (WHERE ti.id IS NOT NULL), '[]'::JSONB) AS item_breakdown
FROM public.transactions t
LEFT JOIN public.transaction_items ti ON t.id = ti.transaction_id
GROUP BY t.id, t.invoice_number, t.customer_name, t.customer_phone, t.barber_name,
         t.payment_method, t.payment_status, t.subtotal, t.discount, t.total_amount,
         t.amount_paid, t.change_amount, t.created_at;

-- ========================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- 1. Categories Policies
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" 
ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Categories" ON public.categories;
CREATE POLICY "Admin All Categories" 
ON public.categories FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 2. Services Policies
DROP POLICY IF EXISTS "Public Read Services" ON public.services;
CREATE POLICY "Public Read Services" 
ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Services" ON public.services;
CREATE POLICY "Admin All Services" 
ON public.services FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 3. Barbers Policies
DROP POLICY IF EXISTS "Public Read Barbers" ON public.barbers;
CREATE POLICY "Public Read Barbers" 
ON public.barbers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Barbers" ON public.barbers;
CREATE POLICY "Admin All Barbers" 
ON public.barbers FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. Bookings Policies (Public can insert booking & read their booking tickets)
DROP POLICY IF EXISTS "Public Read Bookings" ON public.bookings;
CREATE POLICY "Public Read Bookings" 
ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Bookings" ON public.bookings;
CREATE POLICY "Public Insert Bookings" 
ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Bookings" ON public.bookings;
CREATE POLICY "Admin All Bookings" 
ON public.bookings FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 5. Transactions & Transaction Items Policies (Kasir POS & Admin)
DROP POLICY IF EXISTS "Public/Staff Read Transactions" ON public.transactions;
CREATE POLICY "Public/Staff Read Transactions" 
ON public.transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public/Staff Insert Transactions" ON public.transactions;
CREATE POLICY "Public/Staff Insert Transactions" 
ON public.transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Transactions" ON public.transactions;
CREATE POLICY "Admin All Transactions" 
ON public.transactions FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public/Staff Read Transaction Items" ON public.transaction_items;
CREATE POLICY "Public/Staff Read Transaction Items" 
ON public.transaction_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public/Staff Insert Transaction Items" ON public.transaction_items;
CREATE POLICY "Public/Staff Insert Transaction Items" 
ON public.transaction_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Transaction Items" ON public.transaction_items;
CREATE POLICY "Admin All Transaction Items" 
ON public.transaction_items FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ========================================================================
-- 11. SUPABASE REALTIME REPLICATION CONFIGURATION
-- ========================================================================

-- Enable full row replica identity for detailed real-time events (insert, update, delete)
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.barbers REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.transaction_items REPLICA IDENTITY FULL;

-- Add all critical tables to supabase_realtime publication
DO $$
BEGIN
    -- 1. categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'categories' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;

    -- 2. services
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'services' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    END IF;

    -- 3. barbers
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'barbers' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.barbers;
    END IF;

    -- 4. bookings (Antrean Live & Status Reservasi Real-Time)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookings' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;

    -- 5. transactions (Live POS Kasir & Omzet Harian)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'transactions' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    END IF;

    -- 6. transaction_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'transaction_items' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_items;
    END IF;
END $$;


