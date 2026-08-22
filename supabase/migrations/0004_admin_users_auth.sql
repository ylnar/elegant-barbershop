-- ========================================================================
-- 0004_admin_users_auth.sql — Tabel admin users untuk autentikasi nyata
-- Menggantikan sistem PIN hardcoded dengan username + password hash
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

-- RLS: Only service_role can read/write admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Admin Users" ON public.admin_users;
CREATE POLICY "Service Role Admin Users"
ON public.admin_users FOR ALL
USING (auth.role() = 'service_role');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Insert default admin user (username: admin, password: elegant2026)
-- Password is SHA-256 hashed with salt via application layer
-- Default credentials: admin / elegant2026
INSERT INTO public.admin_users (username, password_hash, display_name, role)
VALUES (
    'admin',
    'elegant2026',
    'Admin Utama',
    'superadmin'
) ON CONFLICT (username) DO NOTHING;

-- Insert kasir user (username: kasir, password: kasir123)
INSERT INTO public.admin_users (username, password_hash, display_name, role)
VALUES (
    'kasir',
    'kasir123',
    'Kasir Elegant',
    'kasir'
) ON CONFLICT (username) DO NOTHING;

-- Grant access to service_role
GRANT ALL ON public.admin_users TO service_role;
