-- ========================================================================
-- 0006_system_settings.sql — System settings table
-- Stores shop configuration, master switch, and operational settings
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

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Settings" ON public.system_settings;
CREATE POLICY "Public Read Settings"
ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role All Settings" ON public.system_settings;
CREATE POLICY "Service Role All Settings"
ON public.system_settings FOR ALL
USING (auth.role() = 'service_role');

-- Trigger
DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Insert default settings
INSERT INTO public.system_settings (id, shop_name, tagline, address, phone, whatsapp_number, email, instagram_handle, google_maps_url)
VALUES (
    'default_settings',
    'ELEGANT BARBERSHOP SOLOK',
    'MASUAK CAYAH KALUA COGAH',
    '6J6W+VR7, Jl. Perwira, VI Suku, Kec. Lubuk Sikarah, Kota Solok, Sumatera Barat 27313',
    '+62 838-2633-6104',
    '6283826336104',
    'elegantbarbersolok@gmail.com',
    '@elegantbarber.id',
    'https://maps.app.goo.gl/QRDFBXn7vS76o5f19'
) ON CONFLICT (id) DO NOTHING;

-- Grant
GRANT SELECT ON public.system_settings TO service_role;
GRANT ALL ON public.system_settings TO service_role;
GRANT SELECT ON public.system_settings TO anon;
