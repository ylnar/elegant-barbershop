-- ========================================================================
-- 0002_seed_data.sql — Data Produksi Elegant Barbershop Solok
-- Categories, Pricelist, Tim Barber — Tanpa data test/transaksi sampel.
-- Idempotent: aman dijalankan berulang kali.
-- Jalankan via: npm run db:migrate
-- ========================================================================

-- 1. Insert Categories
INSERT INTO public.categories (name, slug, icon, description, display_order, is_active)
VALUES
    ('Haircut & Styling', 'haircut', 'Scissors', 'Potongan rambut presisi, fade, crop, dan styling pomade pria modern & anak-anak', 1, true),
    ('Perming & Texture', 'perming', 'Sparkles', 'Teknik pengeritingan modern Korean Wave dan Down Perm bertekstur natural', 2, true),
    ('Hair Colouring & Bleach', 'coloring', 'Palette', 'Pewarnaan rambut trendi, basic black/grey cover, highlighting, dan full bleaching', 3, true),
    ('Treatment & Spa Grooming', 'treatment', 'Smile', 'Perawatan kulit kepala, scalp scrub, masker wajah, dan pembersihan komedo', 4, true),
    ('Beard & Shaving', 'shaving', 'UserCheck', 'Cukur jenggot dan kumis tradisional handuk hangat serta perapian garis cambang', 5, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- 2. Insert Services (Pricelist Resmi)
DO $$
DECLARE
    v_cat_haircut UUID;
    v_cat_perming UUID;
    v_cat_coloring UUID;
    v_cat_treatment UUID;
    v_cat_shaving UUID;
BEGIN
    SELECT id INTO v_cat_haircut FROM public.categories WHERE slug = 'haircut';
    SELECT id INTO v_cat_perming FROM public.categories WHERE slug = 'perming';
    SELECT id INTO v_cat_coloring FROM public.categories WHERE slug = 'coloring';
    SELECT id INTO v_cat_treatment FROM public.categories WHERE slug = 'treatment';
    SELECT id INTO v_cat_shaving FROM public.categories WHERE slug = 'shaving';

    INSERT INTO public.services (category_id, category_slug, name, price, duration_minutes, description, badge, image_url, is_active, display_order)
    VALUES
        (v_cat_haircut, 'haircut', 'Premium', 45000, 40, 'Pangkas rambut presisi, cuci rambut, pijat relaksasi kepala/leher, hair tonic, dan styling pomade.', 'Paling Populer', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80', true, 1),
        (v_cat_haircut, 'haircut', 'Premium kids', 30000, 30, 'Potongan rambut anak-anak (SMP / Remaja) dengan pelayanan ramah dan sabar.', 'Kids Choice', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', true, 2),
        (v_cat_haircut, 'haircut', 'Kids ( SD Kebawah )', 20000, 25, 'Potongan rambut balita dan anak usia SD ke bawah.', 'Hemat & Cepat', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', true, 3),
        (v_cat_treatment, 'treatment', 'Basic Colour', 50000, 45, 'Pewarnaan hitam alami untuk menutup uban atau meratakan warna rambut asli.', 'Best Value', 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=600&q=80', true, 4),
        (v_cat_perming, 'perming', 'Perming', 250000, 90, 'Korean wave texture perming untuk gaya rambut bervolume dan mudah diatur.', 'Trend 2026', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80', true, 5),
        (v_cat_coloring, 'coloring', 'Full Colour', 350000, 120, 'Pewarnaan rambut penuh (Ash Grey, Silver, Blonde, Brown) dengan teknik profesional.', 'Fashion Look', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80', true, 6),
        (v_cat_coloring, 'coloring', 'Highlight', 200000, 75, 'Aksen warna garis kontras untuk menambah dimensi tekstur rambut.', 'Modern Style', 'https://images.unsplash.com/photo-1517832606589-7629c3397143?auto=format&fit=crop&w=600&q=80', true, 7),
        (v_cat_coloring, 'coloring', 'Full Bleaching', 200000, 90, 'Proses pelunturan warna dasar rambut sebelum pewarnaan warna terang.', NULL, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', true, 8)
    ON CONFLICT DO NOTHING;
END $$;

-- 3. Insert Barbers
INSERT INTO public.barbers (name, nickname, role, experience_years, specialty, review_count, photo_url, bio, is_active, working_days)
VALUES
    ('Rian Pratama', 'Rian', 'Master Barber & Stylist', 4, ARRAY['Pangkas Rambut', 'Perming', 'Colouring'], 184, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop', 'Melayani pangkas rambut pria & anak, perming, serta pewarnaan di Elegant Barbershop Solok.', true, ARRAY[0, 1, 2, 3, 4, 5, 6]),
    ('Dimas Saputra', 'Dimas', 'Senior Barber', 3, ARRAY['Pangkas Rambut', 'Hair Styling', 'Beard Grooming'], 142, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop', 'Spesialis pangkas rambut pria modern, taper fade, dan perawatan rambut harian.', true, ARRAY[0, 1, 2, 3, 4, 5, 6]),
    ('Aldi Wijaya', 'Aldi', 'Creative Hairdresser', 3, ARRAY['Pangkas Rambut', 'Bleaching', 'Hair Colouring'], 98, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop', 'Ahli pewarnaan rambut, highlighting, dan potongan rambut trendi untuk anak muda & dewasa.', true, ARRAY[0, 1, 2, 3, 4, 5, 6])
ON CONFLICT DO NOTHING;
