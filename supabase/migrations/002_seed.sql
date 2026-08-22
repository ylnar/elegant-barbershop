-- ========================================================================
-- 002_seed.sql — Data Awal Elegant Barbershop Solok
-- Categories, pricelist, tim barber, admin, settings.
-- Idempotent: aman dijalankan ulang.
-- ========================================================================

-- ── FIX: pastikan semua kolom ada di tabel lama ─────────────────────────
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS photo_url;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS nickname;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS role;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS experience_years;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS specialty;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS review_count;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS bio;
ALTER TABLE public.barbers DROP COLUMN IF EXISTS rating;

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.services DROP COLUMN IF EXISTS image_url;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Hapus data operasional lama (transaction_items → transactions → bookings)
DELETE FROM public.transaction_items;
DELETE FROM public.transactions;
DELETE FROM public.bookings;
DELETE FROM public.services;
DELETE FROM public.categories;

-- ========================================================================
-- 1. CATEGORIES
-- ========================================================================
INSERT INTO public.categories (name, slug, icon, description, display_order, is_active)
VALUES
    ('Haircut & Styling', 'haircut', 'Scissors', 'Potongan rambut presisi, fade, crop, dan styling pomade pria modern & anak-anak', 1, true),
    ('Perming & Texture', 'perming', 'Sparkles', 'Teknik pengeritingan modern Korean Wave dan Down Perm bertekstur natural', 2, true),
    ('Hair Colouring & Bleach', 'coloring', 'Palette', 'Pewarnaan rambut trendi, basic black/grey cover, highlighting, dan full bleaching', 3, true),
    ('Treatment & Spa Grooming', 'treatment', 'Smile', 'Perawatan kulit kepala, scalp scrub, masker wajah, dan pembersihan komedo', 4, true),
    ('Beard & Shaving', 'shaving', 'UserCheck', 'Cukur jenggot dan kumis tradisional handuk hangat serta perapian garis cambang', 5, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- ========================================================================
-- 2. SERVICES (Pricelist)
-- ========================================================================
DO $$
DECLARE
    v_haircut UUID; v_perming UUID; v_coloring UUID; v_treatment UUID; v_shaving UUID;
BEGIN
    SELECT id INTO v_haircut FROM public.categories WHERE slug = 'haircut';
    SELECT id INTO v_perming FROM public.categories WHERE slug = 'perming';
    SELECT id INTO v_coloring FROM public.categories WHERE slug = 'coloring';
    SELECT id INTO v_treatment FROM public.categories WHERE slug = 'treatment';
    SELECT id INTO v_shaving FROM public.categories WHERE slug = 'shaving';

    INSERT INTO public.services (category_id, category_slug, name, price, duration_minutes, description, badge, is_active, display_order)
    VALUES
        (v_haircut,  'haircut',  'Premium',           45000,  40,  'Pangkas rambut presisi, cuci rambut, pijat relaksasi kepala/leher, hair tonic, dan styling pomade.',           'Paling Populer',  true, 1),
        (v_haircut,  'haircut',  'Premium Kids',      30000,  30,  'Potongan rambut anak-anak (SMP / Remaja) dengan pelayanan ramah dan sabar.',                                   'Kids Choice',     true, 2),
        (v_haircut,  'haircut',  'Kids (SD ke bawah)', 20000,  25,  'Potongan rambut balita dan anak usia SD ke bawah.',                                                            'Hemat & Cepat',   true, 3),
        (v_perming,  'perming',  'Perming',           250000, 90,  'Korean wave texture perming untuk gaya rambut bervolume dan mudah diatur.',                                     'Trend 2026',      true, 4),
        (v_coloring, 'coloring', 'Basic Colour',      50000,  45,  'Pewarnaan hitam alami untuk menutup uban atau meratakan warna rambut asli.',                                     'Best Value',      true, 5),
        (v_coloring, 'coloring', 'Full Colour',       350000, 120, 'Pewarnaan rambut penuh (Ash Grey, Silver, Blonde, Brown) dengan teknik profesional.',                            'Fashion Look',    true, 6),
        (v_coloring, 'coloring', 'Highlight',         200000, 75,  'Aksen warna garis kontras untuk menambah dimensi tekstur rambut.',                                              'Modern Style',    true, 7),
        (v_coloring, 'coloring', 'Full Bleaching',    200000, 90,  'Proses pelunturan warna dasar rambut sebelum pewarnaan warna terang.',                                          NULL,              true, 8),
        (v_treatment,'treatment','Scalp Treatment',    75000,  60,  'Perawatan kulit kepala menyeluruh: scalp scrub, masker, dan pijat relaksasi.',                                 NULL,              true, 9),
        (v_shaving,  'shaving',  'Beard Grooming',    35000,  30,  'Perapihan jenggot dan kumis dengan pisau cukur premium dan handuk hangat.',                                     NULL,              true, 10)
    ON CONFLICT DO NOTHING;
END $$;

-- ========================================================================
-- 3. BARBERS (Simpel: name, phone, is_active, working_days)
-- ========================================================================
DELETE FROM public.barbers;
INSERT INTO public.barbers (name, phone, is_active, working_days)
VALUES
    ('Rian Pratama',  '+62 838-2633-6104', true, ARRAY[0,1,2,3,4,5,6]),
    ('Dimas Saputra', NULL,                true, ARRAY[0,1,2,3,4,5,6]),
    ('Aldi Wijaya',   NULL,                true, ARRAY[0,1,2,3,4,5,6]);

-- ========================================================================
-- 4. ADMIN USERS
-- ========================================================================
DELETE FROM public.admin_users;
INSERT INTO public.admin_users (username, password_hash, display_name, role)
VALUES
    ('admin', 'elegant2026', 'Admin Utama', 'superadmin'),
    ('kasir',  'kasir123',    'Kasir Elegant', 'kasir');

-- ========================================================================
-- 5. SYSTEM SETTINGS
-- ========================================================================
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
) ON CONFLICT (id) DO UPDATE SET
    shop_name = EXCLUDED.shop_name, tagline = EXCLUDED.tagline, address = EXCLUDED.address,
    phone = EXCLUDED.phone, whatsapp_number = EXCLUDED.whatsapp_number, email = EXCLUDED.email,
    instagram_handle = EXCLUDED.instagram_handle, google_maps_url = EXCLUDED.google_maps_url;
