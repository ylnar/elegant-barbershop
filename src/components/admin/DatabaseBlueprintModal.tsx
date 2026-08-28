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


  // Generate MongoDB collections, fields & index script
  const generateSqlScript = () => {
    return `// ========================================================================
// ELEGANT BARBERSHOP SOLOK - MONGO DB DATABASE SCHEMA
// COLLECTIONS: settings, services, barbers, bookings, transactions, customers, admins, sessions
// Slogan: "Masuak Cayah Kalua Cogah" | Jl. Perwira No. 12 Kota Solok
// Dokumen disimpan dalam camelCase (sama dengan tipe TypeScript aplikasi),
// setiap dokumen memiliki: id (unik), isDeleted (soft-delete),
// createdAt & updatedAt (ISO timestamp).
// ========================================================================

// Koneksi ke MongoDB (klien apa pun: mongosh / Compass / driver Node)
//   Local : mongodb://localhost:27017/elegant_barbershop
//   Atlas : mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/elegant_barbershop
//
// Jalankan via CLI aplikasi:
//   npm run db:setup -- "<connection-string>"
//   npm run db:status
//   npm run db:seed

// ------------------------------------------------------------------------
// 1. COLLECTION: services (Katalog Layanan & Pricelist Resmi)
// ------------------------------------------------------------------------
// {
//   id: 'srv-1',                 // string, unik
//   name: 'Premium',
//   category: 'haircut',         // haircut | treatment | ...
//   price: 45000,
//   durationMinutes: 40,
//   description: '',
//   badge: undefined,            // label promosi opsional
//   isActive: true,
//   isDeleted: false,
//   createdAt: '2026-08-27T00:00:00.000Z',
//   updatedAt: '2026-08-27T00:00:00.000Z',
// }
db.services.createIndex({ id: 1 }, { unique: true });
db.services.createIndex({ category: 1 });
db.services.createIndex({ isActive: 1, isDeleted: 1 });

// ------------------------------------------------------------------------
// 2. COLLECTION: barbers (Tim Master Barber & Hairdresser)
// ------------------------------------------------------------------------
// {
//   id: 'barber-1',
//   name: 'Rian Pratama',
//   phone: undefined,            // opsional
//   isActive: true,
//   workingDays: [0, 1, 2, 3, 4, 5, 6], // 0 = Minggu ...
//   isDeleted: false,
//   createdAt: '...',
//   updatedAt: '...',
// }
db.barbers.createIndex({ id: 1 }, { unique: true });
db.barbers.createIndex({ isActive: 1, isDeleted: 1 });

// ------------------------------------------------------------------------
// 3. COLLECTION: bookings (Sistem Reservasi Online & Tiket Pelanggan)
// ------------------------------------------------------------------------
// {
//   id: 'bk-...',
//   bookingCode: 'ELG-8821',     // string, unik
//   customerName: 'Rahmat',
//   customerPhone: '6281234567890',
//   customerEmail: undefined,
//   serviceId: 'srv-1',
//   serviceName: 'Premium',
//   servicePrice: 45000,
//   barberId: 'any',
//   barberName: 'Barber Siap Pertama',
//   date: '2026-08-27',          // YYYY-MM-DD (WIB)
//   timeSlot: '14:00',
//   totalAmount: 45000,
//   status: 'pending',           // pending | confirmed | in_service | completed | cancelled
//   isWalkIn: false,
//   notes: undefined,
//   isDeleted: false,
//   createdAt: '...',
//   updatedAt: '...',
// }
db.bookings.createIndex({ bookingCode: 1 }, { unique: true });
db.bookings.createIndex({ customerPhone: 1 });
db.bookings.createIndex({ date: 1, timeSlot: 1 });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ isDeleted: 1 });

// ------------------------------------------------------------------------
// 4. COLLECTION: transactions (Header Transaksi Kasir POS & Omzet)
// ------------------------------------------------------------------------
// {
//   id: 'trx-...',
//   invoiceNumber: 'TRX-2026-123', // string, unik
//   bookingId: undefined,           // referensi bookings.id (opsional)
//   customerName: 'Tamu Umum (Walk-in)',
//   customerPhone: undefined,
//   barberId: 'barber-1',
//   barberName: 'Rian Pratama',
//   items: [{ serviceId, serviceName, unitPrice, quantity, subtotal }],
//   subtotal: 45000,
//   discount: 0,
//   totalAmount: 45000,
//   paymentMethod: 'cash',        // cash | qris | transfer
//   amountPaid: 50000,
//   changeAmount: 5000,
//   notes: undefined,
//   isDeleted: false,
//   createdAt: '...',
// }
db.transactions.createIndex({ invoiceNumber: 1 }, { unique: true });
db.transactions.createIndex({ createdAt: -1 });
db.transactions.createIndex({ paymentMethod: 1 });
db.transactions.createIndex({ isDeleted: 1 });

// ------------------------------------------------------------------------
// 5. COLLECTION: customers (Data Pelanggan Otomatis)
// ------------------------------------------------------------------------
// {
//   id: 'cust-...',
//   name: 'Rahmat',
//   phone: '6281234567890',       // string, unik (ternormalisasi)
//   email: undefined,
//   totalBookings: 3,
//   lastBookingDate: '2026-08-27',
//   isActive: true,
//   isDeleted: false,
//   createdAt: '...',
//   updatedAt: '...',
// }
db.customers.createIndex({ phone: 1 }, { unique: true });
db.customers.createIndex({ isActive: 1, isDeleted: 1 });

// ------------------------------------------------------------------------
// 6. COLLECTION: settings (Pengaturan Global & Master Switch)
// ------------------------------------------------------------------------
// {
//   key: 'default_settings',      // string, unik
//   isBookingOpen: true,          // Master Switch booking online
//   walkInOnlyMessage: '...',
//   maintenanceMessage: '...',
//   currentWalkInQueue: 2,
//   estimatedWalkInWaitMinutes: 20,
//   shopName: 'ELEGANT BARBERSHOP SOLOK',
//   tagline: 'MASUAK CAYAH KALUA COGAH',
//   address: '...',
//   googleMapsUrl: '...',
//   phone: '...',
//   whatsappNumber: '...',
//   email: '...',
//   instagramHandle: '...',
//   openTime: '10:00',
//   closeTime: '22:00',
//   slotIntervalMinutes: 30,
//   maxSimultaneousBookingsPerSlot: 2,
//   currency: 'IDR',
// }
db.settings.createIndex({ key: 1 }, { unique: true });

// ------------------------------------------------------------------------
// 7. COLLECTION: admins (Akun Owner & Kasir — password ter-hash scrypt)
// ------------------------------------------------------------------------
// {
//   id: 'admin-owner',            // string, unik
//   username: 'owner',            // string, unik (login)
//   passwordHash: '<hex scrypt>', // HASH — jangan pernah simpan plaintext
//   passwordSalt: '<hex>',        // salt acak per user
//   displayName: 'Owner',
//   role: 'owner',                // owner | kasir
//   isActive: true,
//   createdAt: '...',
// }
db.admins.createIndex({ id: 1 }, { unique: true });
db.admins.createIndex({ username: 1 }, { unique: true });
db.admins.createIndex({ isActive: 1 });

// ------------------------------------------------------------------------
// 8. COLLECTION: sessions (Sesi Login Aktif — TTL 24 jam)
// ------------------------------------------------------------------------
// {
//   token: '<hex acak>',          // string, unik (httpOnly cookie eb_session)
//   adminId: 'admin-owner',       // referensi admins.id
//   username: 'owner',            // snapshot saat login
//   role: 'owner',
//   createdAt: '...',
//   expiresAt: '...',             // TTL index — terhapus otomatis
// }
db.sessions.createIndex({ token: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
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
                Dokumentasi struktur koleksi MongoDB (Bookings, Transactions, Services, Customers) & workflow sistem
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
            <span>Kamus Kolom Koleksi</span>
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
            <span>Skema Koleksi MongoDB</span>
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
                            ? 'Database MongoDB Terhubung'
                            : dbStatus?.isConfigured
                            ? 'Koneksi Terdeteksi (Menunggu Sinkronisasi Koleksi)'
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
                    Status Sinkronisasi Koleksi MongoDB:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { name: 'services', label: 'Pricelist & Paket', ready: dbStatus?.tables?.categories },
                      { name: 'services', label: 'Katalog Layanan', ready: dbStatus?.tables?.services },
                      { name: 'barbers', label: 'Data Master Barber', ready: dbStatus?.tables?.barbers },
                      { name: 'bookings', label: 'Antrean & Tiket', ready: dbStatus?.tables?.bookings },
                      { name: 'transactions', label: 'POS Kasir & Omzet', ready: dbStatus?.tables?.transactions },
                      { name: 'customers', label: 'Riwayat Pelanggan', ready: dbStatus?.tables?.customers },
                      { name: 'admins', label: 'Akun Owner & Kasir', ready: dbStatus?.tables?.admins },
                      { name: 'sessions', label: 'Sesi Login Aktif', ready: dbStatus?.tables?.sessions },
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
                    <li>Jika <code className="text-[#D4AF37] bg-stone-900 px-1 py-0.5 rounded font-mono">MONGODB_URI</code> diatur, seluruh data otomatis tersinkronisasi dua arah ke database MongoDB secara live.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-[#14141E] border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <FileCode className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      Langkah Menghubungkan MongoDB Cloud / Local
                    </h5>
                  </div>
                  <ol className="text-xs text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Buka tab <strong>Skema Koleksi MongoDB</strong> di atas dan klik <strong>Salin Skrip Skema</strong>.</li>
                    <li>Jalankan skrip tersebut di <strong>mongosh / MongoDB Compass</strong>, atau lebih mudah gunakan CLI aplikasi: <code className="text-[#D4AF37] bg-stone-900 px-1 py-0.5 rounded font-mono">npm run db:setup</code>.</li>
                    <li>Pastikan variabel <code className="text-[#D4AF37] bg-stone-900 px-1 py-0.5 rounded font-mono">MONGODB_URI</code> (mis. <code className="text-[#D4AF37] bg-stone-900 px-1 py-0.5 rounded font-mono">mongodb+srv://user:pass@cluster.mongodb.net/elegant_barbershop</code>) diatur pada environment project.</li>
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
                    Model Data Koleksi Terintegrasi
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Dokumen camelCase (padanan tipe TypeScript) untuk integritas transaksi booking & master switch.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold">
                  {DATABASE_SCHEMA_BLUEPRINT.length} Koleksi Utama
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
                  <span className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                    bookings (Slot Cek & ELG-XXXX)
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                  <span className="px-3 py-1.5 rounded-lg bg-[#1F1F2C] text-stone-200 border border-stone-700">
                    transactions (Kasir POS)
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                  <span className="px-3 py-1.5 rounded-lg bg-[#1F1F2C] text-stone-200 border border-stone-700">
                    customers (Riwayat)
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
                        Koleksi: {tbl.tableName}
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
                  Skema koleksi MongoDB lengkap siap dieksekusi di mongosh / MongoDB Compass / MongoDB Atlas.
                </span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-stone-950 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skrip Skema'}</span>
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
