-- ========================================================================
-- 001_schema.sql — Skema Lengkap Elegant Barbershop Solok
-- Konsolidasi dari 16 migrasi lama. Jalankan sekali = database siap.
-- Idempotent: aman dijalankan ulang.
-- ========================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- 1. TABEL: categories
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
-- 2. TABEL: services (tanpa image_url)
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
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_category_slug ON public.services(category_slug);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_deleted, is_active);
CREATE INDEX IF NOT EXISTS idx_services_not_deleted ON public.services(is_deleted) WHERE is_deleted = FALSE;

-- ========================================================================
-- 3. TABEL: barbers (simpel: name, is_active, working_days)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    working_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6]::INTEGER[],
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_barbers_active ON public.barbers(is_deleted, is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_not_deleted ON public.barbers(is_deleted) WHERE is_deleted = FALSE;

-- ========================================================================
-- 4. TABEL: bookings
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(30) UNIQUE NOT NULL,
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
    time_slot VARCHAR(20) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_service', 'completed', 'cancelled')),
    notes TEXT,
    is_walk_in BOOLEAN DEFAULT FALSE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON public.bookings(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_date ON public.bookings(barber_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_desc ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_not_deleted ON public.bookings(is_deleted) WHERE is_deleted = FALSE;

-- ========================================================================
-- 5. TABEL: transactions
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(40) UNIQUE NOT NULL,
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
    items JSONB DEFAULT '[]'::JSONB NOT NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_barber ON public.transactions(barber_name);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON public.transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted ON public.transactions(is_deleted) WHERE is_deleted = FALSE;

-- ========================================================================
-- 6. TABEL: transaction_items
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
-- 7. TABEL: admin_users
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL DEFAULT 'Administrator',
    role VARCHAR(30) DEFAULT 'admin' NOT NULL CHECK (role IN ('admin', 'superadmin', 'kasir')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

-- ========================================================================
-- 8. TABEL: system_settings
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default_settings',
    shop_name VARCHAR(200) DEFAULT 'ELEGANT BARBERSHOP SOLOK',
    tagline VARCHAR(200) DEFAULT 'MASUAK CAYAH KALUA COGAH',
    address TEXT,
    phone VARCHAR(30),
    whatsapp_number VARCHAR(30),
    email VARCHAR(150),
    instagram_handle VARCHAR(50),
    google_maps_url TEXT,
    is_booking_open BOOLEAN DEFAULT TRUE NOT NULL,
    walk_in_only_message TEXT DEFAULT 'Saat ini kami memprioritaskan antrean langsung (Walk-in) di outlet Jl. Perwira Solok.',
    maintenance_message TEXT DEFAULT 'Sistem booking online sedang pemeliharaan. Silakan hubungi WhatsApp kami.',
    active_lounge_queue INTEGER DEFAULT 0,
    estimated_wait_minutes INTEGER DEFAULT 0,
    open_time VARCHAR(10) DEFAULT '10:00',
    close_time VARCHAR(10) DEFAULT '22:00',
    slot_interval_minutes INTEGER DEFAULT 30,
    max_simultaneous_bookings_per_slot INTEGER DEFAULT 2,
    currency VARCHAR(10) DEFAULT 'IDR',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================================================
-- 9. TRIGGERS: Auto-Update Timestamp
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

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ========================================================================
-- 10. STORED PROCEDURES
-- ========================================================================

-- ACID POS Transaction Creator (handles non-UUID barber_id safely)
DROP FUNCTION IF EXISTS public.fn_create_pos_transaction(VARCHAR, TEXT, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB, NUMERIC, NUMERIC, NUMERIC, VARCHAR, NUMERIC, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.fn_create_pos_transaction(
    p_invoice_number VARCHAR(40),
    p_booking_id TEXT,
    p_customer_name VARCHAR(120),
    p_customer_phone VARCHAR(30),
    p_barber_id TEXT,
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
    v_booking_id UUID := NULL;
    v_barber_id UUID := NULL;
    v_item JSONB;
    v_item_srv_id UUID;
    v_item_name VARCHAR(150);
    v_item_price NUMERIC;
    v_item_qty INT;
    v_item_subtotal NUMERIC;
BEGIN
    IF p_invoice_number IS NULL OR TRIM(p_invoice_number) = '' THEN
        v_inv := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    ELSE
        v_inv := p_invoice_number;
    END IF;

    IF p_booking_id IS NOT NULL AND LENGTH(p_booking_id) > 10 THEN
        BEGIN v_booking_id := p_booking_id::UUID; EXCEPTION WHEN OTHERS THEN v_booking_id := NULL; END;
    END IF;

    IF p_barber_id IS NOT NULL AND LENGTH(p_barber_id) > 10 THEN
        BEGIN v_barber_id := p_barber_id::UUID; EXCEPTION WHEN OTHERS THEN v_barber_id := NULL; END;
    END IF;

    IF v_booking_id IS NOT NULL THEN
        SELECT booking_code INTO v_bcode FROM public.bookings WHERE id = v_booking_id;
    END IF;

    INSERT INTO public.transactions (
        invoice_number, booking_id, booking_code, customer_name, customer_phone,
        barber_id, barber_name, items, subtotal, discount,
        total_amount, payment_method, payment_status, amount_paid, change_amount, notes, created_at
    ) VALUES (
        v_inv, v_booking_id, v_bcode, p_customer_name, p_customer_phone,
        v_barber_id, p_barber_name, COALESCE(p_items, '[]'::JSONB), p_subtotal, COALESCE(p_discount, 0),
        p_total_amount, p_payment_method, 'paid', COALESCE(p_amount_paid, p_total_amount), COALESCE(p_change_amount, 0), p_notes, NOW()
    ) RETURNING * INTO v_new_trx;

    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_item_name := COALESCE(v_item->>'serviceName', 'Layanan Pangkas');
            v_item_price := COALESCE((v_item->>'price')::NUMERIC, (v_item->>'unitPrice')::NUMERIC, 0);
            v_item_qty := COALESCE((v_item->>'qty')::INT, (v_item->>'quantity')::INT, 1);
            v_item_subtotal := v_item_price * v_item_qty;
            BEGIN v_item_srv_id := (v_item->>'serviceId')::UUID; EXCEPTION WHEN OTHERS THEN v_item_srv_id := NULL; END;

            INSERT INTO public.transaction_items (transaction_id, service_id, service_name, unit_price, quantity, subtotal, created_at)
            VALUES (v_new_trx.id, v_item_srv_id, v_item_name, v_item_price, v_item_qty, v_item_subtotal, NOW());
        END LOOP;
    END IF;

    IF v_booking_id IS NOT NULL THEN
        UPDATE public.bookings SET status = 'completed', updated_at = NOW() WHERE id = v_booking_id;
    END IF;

    RETURN to_jsonb(v_new_trx);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily Omzet Summary
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

-- Category Revenue Breakdown
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
-- 11. VIEWS
-- ========================================================================

DROP VIEW IF EXISTS public.v_booking_details;
CREATE OR REPLACE VIEW public.v_booking_details
WITH (security_invoker = true) AS
SELECT
    b.id, b.booking_code, b.customer_name, b.customer_phone, b.customer_email,
    b.date, b.time_slot, b.status, b.total_amount, b.notes, b.is_walk_in,
    b.service_name, b.service_price,
    COALESCE(c.name, b.service_category, 'Haircut') AS category_name,
    b.barber_name, b.created_at, b.updated_at
FROM public.bookings b
LEFT JOIN public.services s ON b.service_id = s.id
LEFT JOIN public.categories c ON s.category_id = c.id;

DROP VIEW IF EXISTS public.v_transaction_reports;
CREATE OR REPLACE VIEW public.v_transaction_reports
WITH (security_invoker = true) AS
SELECT
    t.id AS transaction_id, t.invoice_number, t.customer_name, t.customer_phone,
    t.barber_name, t.payment_method, t.payment_status,
    t.subtotal, t.discount, t.total_amount, t.amount_paid, t.change_amount,
    t.created_at,
    COALESCE(jsonb_agg(
        jsonb_build_object('itemName', ti.service_name, 'unitPrice', ti.unit_price, 'quantity', ti.quantity, 'subtotal', ti.subtotal)
    ) FILTER (WHERE ti.id IS NOT NULL), '[]'::JSONB) AS item_breakdown
FROM public.transactions t
LEFT JOIN public.transaction_items ti ON t.id = ti.transaction_id
GROUP BY t.id, t.invoice_number, t.customer_name, t.customer_phone, t.barber_name,
         t.payment_method, t.payment_status, t.subtotal, t.discount, t.total_amount,
         t.amount_paid, t.change_amount, t.created_at;

-- ========================================================================
-- 12. ROW LEVEL SECURITY (RLS) — Full CRUD untuk anon
-- ========================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anon: full access untuk semua tabel operasional
DROP POLICY IF EXISTS "Anon Full Access Categories" ON public.categories;
CREATE POLICY "Anon Full Access Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Services" ON public.services;
CREATE POLICY "Anon Full Access Services" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Barbers" ON public.barbers;
CREATE POLICY "Anon Full Access Barbers" ON public.barbers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Bookings" ON public.bookings;
CREATE POLICY "Anon Full Access Bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Transactions" ON public.transactions;
CREATE POLICY "Anon Full Access Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Transaction Items" ON public.transaction_items;
CREATE POLICY "Anon Full Access Transaction Items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Settings" ON public.system_settings;
CREATE POLICY "Anon Full Access Settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- Admin users: hanya service_role
DROP POLICY IF EXISTS "Service Role Admin Users" ON public.admin_users;
CREATE POLICY "Service Role Admin Users" ON public.admin_users FOR ALL USING (auth.role() = 'service_role');

-- ========================================================================
-- 13. GRANTS — Full CRUD untuk anon + service_role
-- ========================================================================

-- Anon: SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barbers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Service role: full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================================================
-- 14. REALTIME — Replica Identity + Publication
-- ========================================================================

ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.barbers REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.transaction_items REPLICA IDENTITY FULL;
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['categories','services','barbers','bookings','transactions','transaction_items','system_settings']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = t AND schemaname = 'public'
        ) THEN
            BEGIN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
        END IF;
    END LOOP;
END $$;
