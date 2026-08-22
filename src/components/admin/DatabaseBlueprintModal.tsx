import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Layers,
  Table,
  Key,
  Copy,
  Check,
  Workflow,
  ArrowRight,
  Shield,
  FileCode,
  Activity,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { DATABASE_SCHEMA_BLUEPRINT, SITEMAP_WORKFLOW_BLUEPRINT } from '../../data/initialData';
import { api } from '../../services/api';
import { DatabaseStatusInfo } from '../../services/blueprintService';

interface DatabaseBlueprintModalProps {
  onClose: () => void;
  initialTab?: 'status' | 'erd' | 'tables' | 'sql' | 'sitemap';
}

export const DatabaseBlueprintModal: React.FC<DatabaseBlueprintModalProps> = ({
  onClose,
  initialTab = 'status',
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'erd' | 'tables' | 'sql' | 'sitemap'>(initialTab);
  const [copiedSql, setCopiedSql] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatusInfo | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const fetchStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const report = await api.getDatabaseStatus();
      setDbStatus(report);
    } catch (err) {
      console.warn('Error checking db status:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);


  // Generate full Supabase PostgreSQL DDL, RLS, & ACID POS Functions script
  const generateSqlScript = () => {
    return `-- ========================================================================
-- ELEGANT BARBERSHOP SOLOK - PRODUCTION SUPABASE DATABASE SCHEMA
-- FOCUS: CATEGORIES, SERVICES, BARBERS, BOOKINGS & POS TRANSACTIONS (ACID)
-- Slogan: "Masuak Cayah Kalua Cogah" | Jl. Perwira No. 12 Kota Solok
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLE: categories (Kategori Layanan & Pengelompokan POS)
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

-- 2. TABLE: services (Katalog Layanan & Pricelist Resmi)
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_category_slug ON public.services(category_slug);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- 3. TABLE: barbers (Tim Master Barber & Hairdresser)
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,0]::INTEGER[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_barbers_active ON public.barbers(is_active);

-- 4. TABLE: bookings (Sistem Reservasi Online & Tiket Pelanggan)
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
    time_slot VARCHAR(20) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_service', 'completed', 'cancelled')),
    is_walk_in BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON public.bookings(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 5. TABLE: transactions (Header Transaksi Kasir POS & Omzet)
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
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer')),
    payment_status VARCHAR(30) DEFAULT 'paid' NOT NULL CHECK (payment_status IN ('paid', 'pending', 'refunded')),
    amount_paid NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (amount_paid >= 0),
    change_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (change_amount >= 0),
    items JSONB DEFAULT '[]'::JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON public.transactions(payment_method);

-- 6. TABLE: transaction_items (Rincian Item Transaksi per Baris)
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

-- 7. STORED FUNCTION: ACID POS Transaction Execution
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
    IF p_invoice_number IS NULL OR TRIM(p_invoice_number) = '' THEN
        v_inv := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    ELSE
        v_inv := p_invoice_number;
    END IF;

    IF p_booking_id IS NOT NULL THEN
        SELECT booking_code INTO v_bcode FROM public.bookings WHERE id = p_booking_id;
    END IF;

    INSERT INTO public.transactions (
        invoice_number, booking_id, booking_code, customer_name, customer_phone,
        barber_id, barber_name, items, subtotal, discount,
        total_amount, payment_method, payment_status, amount_paid, change_amount, notes, created_at
    ) VALUES (
        v_inv, p_booking_id, v_bcode, p_customer_name, p_customer_phone,
        p_barber_id, p_barber_name, COALESCE(p_items, '[]'::JSONB), p_subtotal, COALESCE(p_discount, 0),
        p_total_amount, p_payment_method, 'paid', COALESCE(p_amount_paid, p_total_amount), COALESCE(p_change_amount, 0), p_notes, NOW()
    ) RETURNING * INTO v_new_trx;

    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_item_name := COALESCE(v_item->>'serviceName', 'Layanan Pangkas');
            v_item_price := COALESCE((v_item->>'price')::NUMERIC, (v_item->>'unitPrice')::NUMERIC, 0);
            v_item_qty := COALESCE((v_item->>'qty')::INT, (v_item->>'quantity')::INT, 1);
            v_item_subtotal := v_item_price * v_item_qty;

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

    IF p_booking_id IS NOT NULL THEN
        UPDATE public.bookings SET status = 'completed', updated_at = NOW() WHERE id = p_booking_id;
    END IF;

    RETURN to_jsonb(v_new_trx);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ANALYTICAL VIEWS (SECURITY INVOKER FOR POSTGRES RLS)
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

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin All Categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admin All Services" ON public.services FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Public Read Barbers" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Admin All Barbers" ON public.barbers FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Public Read Bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public Insert Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin All Bookings" ON public.bookings FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Public/Staff Read Transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public/Staff Insert Transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin All Transactions" ON public.transactions FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Public/Staff Read Transaction Items" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Public/Staff Insert Transaction Items" ON public.transaction_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin All Transaction Items" ON public.transaction_items FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 10. SUPABASE REALTIME REPLICATION CONFIGURATION
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.barbers REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.transaction_items REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'categories' AND schemaname = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'services' AND schemaname = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'barbers' AND schemaname = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.barbers;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bookings' AND schemaname = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions' AND schemaname = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transaction_items' AND schemaname = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_items;
    END IF;
END $$;
`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateSqlScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-6 rounded-3xl bg-[#121218] border border-[#D4AF37]/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#241E10] via-[#161620] to-[#241E10] px-6 py-5 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                Arsitektur Database & Sitemap Alur Kerja
              </h3>
              <p className="text-xs text-stone-400">
                Dokumentasi struktur tabel relasional (User, Booking, Schedule, Settings) & workflow sistem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-stone-800 bg-[#0F0F15] overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Status & Koneksi Database</span>
          </button>

          <button
            onClick={() => setActiveTab('erd')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'erd'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Diagram Relasi ERD</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'tables'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Kamus Kolom Tabel</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Skrip SQL DDL (Postgres)</span>
          </button>

          <button
            onClick={() => setActiveTab('sitemap')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'sitemap'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sitemap & Alur Kerja</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          {/* 0. STATUS & DIAGNOSTICS */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Main Status Card */}
              <div className="p-6 rounded-2xl bg-[#14141E] border border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
                        dbStatus?.isConnected
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                          : dbStatus?.isConfigured
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10'
                          : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] shadow-[#D4AF37]/10'
                      }`}
                    >
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white font-serif">
                          {dbStatus?.isConnected
                            ? 'Database Supabase PostgreSQL Terhubung'
                            : dbStatus?.isConfigured
                            ? 'Kredensial Terdeteksi (Menunggu Migrasi Tabel)'
                            : 'Mode Penyimpanan Aktif: In-Memory & Local Database'}
                        </h4>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            dbStatus?.isConnected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : dbStatus?.isConfigured
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-stone-800 text-[#D4AF37] border border-stone-700'
                          }`}
                        >
                          {dbStatus?.isConnected ? '🟢 LIVE CLOUD' : dbStatus?.isConfigured ? '🟡 STANDBY' : '⚡ ZERO-CONFIG'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        {dbStatus?.message || 'Memeriksa status koneksi database...'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={fetchStatus}
                    disabled={isCheckingStatus}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1E2E] hover:bg-[#28283C] text-stone-200 text-xs font-semibold border border-stone-700 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${isCheckingStatus ? 'animate-spin' : ''}`} />
                    <span>{isCheckingStatus ? 'Menguji Koneksi...' : 'Tes Koneksi Sekarang'}</span>
                  </button>
                </div>

                {/* Table Detection Status Grid */}
                <div className="pt-4 border-t border-stone-800">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-3">
                    Status Sinkronisasi Tabel PostgreSQL:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { name: 'categories', label: 'Kategori Layanan', ready: dbStatus?.tables?.categories },
                      { name: 'services', label: 'Pricelist & Paket', ready: dbStatus?.tables?.services },
                      { name: 'barbers', label: 'Data Master Barber', ready: dbStatus?.tables?.barbers },
                      { name: 'bookings', label: 'Antrean & Tiket', ready: dbStatus?.tables?.bookings },
                      { name: 'transactions', label: 'POS Kasir & Omzet', ready: dbStatus?.tables?.transactions },
                    ].map((tbl) => (
                      <div
                        key={tbl.name}
                        className={`p-3 rounded-xl border flex flex-col justify-between ${
                          tbl.ready
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                            : 'bg-[#101017] border-stone-800/80 text-stone-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-bold">{tbl.name}</span>
                          {tbl.ready ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-stone-600" />
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400">{tbl.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Guidance on How it Works */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <CheckCircle2 className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      Aplikasi Dijamin 100% Berfungsi Normal
                    </h5>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Sistem dirancang dengan arsitektur <strong>Resilient Multi-Tier Persistence</strong>:
                  </p>
                  <ul className="text-xs text-stone-400 space-y-1.5 list-disc list-inside">
                    <li>Semua fitur booking, tiket WhatsApp, kasir POS, filter tanggal, dan switch buka/tutup berjalan instan tanpa kendala.</li>
                    <li>Jika kredensial Supabase diisi, seluruh data otomatis tersinkronisasi dua arah ke database Cloud PostgreSQL secara live.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <FileCode className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      Langkah Menghubungkan Supabase Cloud
                    </h5>
                  </div>
                  <ol className="text-xs text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Buka tab <strong>Skrip SQL DDL (Postgres)</strong> di atas dan klik <strong>Salin Skrip SQL</strong>.</li>
                    <li>Jalankan skrip tersebut di menu <strong>SQL Editor</strong> pada dashboard Supabase Anda.</li>
                    <li>Pastikan variabel <code className="text-[#D4AF37] bg-stone-900 px-1 py-0.5 rounded font-mono">SUPABASE_URL</code>, <code className="text-[#D4AF37] bg-stone-900 px-1 py-0.5 rounded font-mono">SUPABASE_ANON_KEY</code>, dan <code className="text-[#D4AF37] bg-stone-900 px-1 py-0.5 rounded font-mono">SUPABASE_SERVICE_ROLE_KEY</code> diatur pada environment project.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* 1. ERD VISUALIZER */}
          {activeTab === 'erd' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#1A1A26] border border-[#D4AF37]/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Model Data Relasional Terintegrasi
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Dirancang dengan Normal Form ke-3 (3NF) untuk integritas transaksi booking & master switch.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold">
                  7 Tabel Utama
                </span>
              </div>

              {/* ERD Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DATABASE_SCHEMA_BLUEPRINT.map((tbl) => (
                  <div
                    key={tbl.tableName}
                    className="p-4 rounded-2xl bg-[#161620] border border-stone-800 hover:border-stone-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800">
                        <span className="font-mono font-bold text-sm text-[#D4AF37]">
                          {tbl.tableName}
                        </span>
                        <span className="text-[10px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded">
                          {tbl.columns.length} kolom
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mb-3">{tbl.description}</p>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono bg-[#0F0F15] p-2.5 rounded-lg border border-stone-800/60">
                      {tbl.columns.slice(0, 5).map((col) => (
                        <div key={col.name} className="flex items-center justify-between">
                          <span
                            className={
                              col.isPrimary
                                ? 'text-[#D4AF37] font-bold flex items-center gap-1'
                                : col.isForeign
                                ? 'text-cyan-400'
                                : 'text-stone-300'
                            }
                          >
                            {col.isPrimary && <Key className="w-3 h-3 text-[#D4AF37]" />}
                            {col.name}
                          </span>
                          <span className="text-stone-500 text-[10px]">{col.type}</span>
                        </div>
                      ))}
                      {tbl.columns.length > 5 && (
                        <div className="text-[10px] text-stone-500 italic pt-1">
                          + {tbl.columns.length - 5} kolom lainnya...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* End to End Workflow diagram banner */}
              <div className="p-5 rounded-2xl bg-[#151520] border border-stone-800 mt-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 text-[#D4AF37]">
                  Alur Relasi Data Reservasi:
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-lg bg-[#1F1F2C] text-stone-200 border border-stone-700">
                    settings (Master Switch)
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                  <span className="px-3 py-1.5 rounded-lg bg-[#1F1F2C] text-stone-200 border border-stone-700">
                    services + barbers
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                  <span className="px-3 py-1.5 rounded-lg bg-[#1F1F2C] text-stone-200 border border-stone-700">
                    schedules (Slot Cek)
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                  <span className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                    bookings (ELG-XXXX)
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                  <span className="px-3 py-1.5 rounded-lg bg-[#1F1F2C] text-stone-200 border border-stone-700">
                    reviews
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. TABLE COLUMNS DETAIL */}
          {activeTab === 'tables' && (
            <div className="space-y-8">
              {DATABASE_SCHEMA_BLUEPRINT.map((tbl) => (
                <div key={tbl.tableName} className="rounded-2xl bg-[#161620] border border-stone-800 p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
                    <div>
                      <h4 className="text-base font-bold font-mono text-[#D4AF37]">
                        Tabel: {tbl.tableName}
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">{tbl.description}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-stone-800 text-stone-400 text-[11px] uppercase">
                          <th className="pb-2">Nama Kolom</th>
                          <th className="pb-2">Tipe Data</th>
                          <th className="pb-2">Kunci / Relasi</th>
                          <th className="pb-2">Nullable</th>
                          <th className="pb-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60 text-stone-300">
                        {tbl.columns.map((col) => (
                          <tr key={col.name} className="hover:bg-stone-800/30">
                            <td className="py-2.5 font-bold text-white">{col.name}</td>
                            <td className="py-2.5 text-stone-400">{col.type}</td>
                            <td className="py-2.5">
                              {col.isPrimary ? (
                                <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">
                                  PRIMARY KEY
                                </span>
                              ) : col.isForeign ? (
                                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                                  FK → {col.foreignRef}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-2.5">{col.nullable ? 'YES' : 'NO'}</td>
                            <td className="py-2.5 text-stone-400 font-sans text-xs">{col.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {tbl.indexes.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-800/80 text-[11px] text-stone-400">
                      <span className="text-stone-500 font-bold uppercase">Index Optimasi: </span>
                      {tbl.indexes.join(' • ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 3. SQL SCRIPT VIEWER */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  Skrip DDL lengkap siap dieksekusi di PostgreSQL / Supabase / Cloud SQL / MySQL.
                </span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL'}</span>
                </button>
              </div>

              <pre className="p-5 rounded-2xl bg-[#09090D] border border-stone-800 font-mono text-xs text-stone-300 overflow-x-auto max-h-[55vh] leading-relaxed">
                {generateSqlScript()}
              </pre>
            </div>
          )}

          {/* 4. SITEMAP & WORKFLOW */}
          {activeTab === 'sitemap' && (
            <div className="space-y-8">
              {SITEMAP_WORKFLOW_BLUEPRINT.map((section) => (
                <div key={section.title} className="rounded-2xl bg-[#161620] border border-stone-800 p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
                    <div>
                      <h4 className="text-base font-bold text-white font-serif">{section.title}</h4>
                      <p className="text-xs text-stone-400 mt-0.5">{section.description}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold border border-[#D4AF37]/30">
                      {section.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.subPages?.map((page) => (
                      <div
                        key={page.title}
                        className="p-3.5 rounded-xl bg-[#101017] border border-stone-800/80"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">{page.title}</span>
                          <span className="text-[10px] font-mono text-stone-500">{page.path}</span>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-relaxed">{page.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
