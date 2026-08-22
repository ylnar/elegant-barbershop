var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/apiEntry.ts
var apiEntry_exports = {};
__export(apiEntry_exports, {
  default: () => handler
});
module.exports = __toCommonJS(apiEntry_exports);
var import_config4 = require("dotenv/config");

// server/app.ts
var import_express9 = __toESM(require("express"), 1);

// server/middleware/security.ts
var ipRequestCounts = /* @__PURE__ */ new Map();
function securityHeadersMiddleware(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}
function rateLimiter(maxRequests = 60, windowMs = 6e4) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const record = ipRequestCounts.get(ip);
    if (!record || now > record.resetTime) {
      ipRequestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: "Terlalu banyak permintaan. Silakan coba beberapa saat lagi."
      });
    }
    record.count += 1;
    next();
  };
}
function sanitizeString(input) {
  if (typeof input !== "string") return "";
  return input.replace(/[<>]/g, "").trim();
}

// server/routes/settings.ts
var import_express = require("express");

// src/data/initialData.ts
var INITIAL_SETTINGS = {
  isBookingOpen: true,
  walkInOnlyMessage: "Saat ini kami memprioritaskan antrean langsung (Walk-in) di outlet Jl. Perwira Solok.",
  maintenanceMessage: "Sistem booking online sedang pemeliharaan. Silakan hubungi WhatsApp kami.",
  currentWalkInQueue: 2,
  estimatedWalkInWaitMinutes: 20,
  shopName: "ELEGANT BARBERSHOP SOLOK",
  tagline: "MASUAK CAYAH KALUA COGAH",
  address: "6J6W+VR7, Jl. Perwira, VI Suku, Kec. Lubuk Sikarah, Kota Solok, Sumatera Barat 27313",
  googleMapsUrl: "https://maps.app.goo.gl/QRDFBXn7vS76o5f19",
  phone: "+62 838-2633-6104",
  whatsappNumber: "6283826336104",
  email: "elegantbarbersolok@gmail.com",
  instagramHandle: "@elegantbarber.id",
  openTime: "10:00",
  closeTime: "22:00",
  slotIntervalMinutes: 30,
  maxSimultaneousBookingsPerSlot: 2,
  currency: "IDR"
};
var INITIAL_SERVICES = [
  {
    id: "srv-1",
    name: "Premium",
    category: "haircut",
    price: 45e3,
    durationMinutes: 40,
    description: "",
    isActive: true
  },
  {
    id: "srv-2",
    name: "Premium kids",
    category: "haircut",
    price: 3e4,
    durationMinutes: 30,
    description: "",
    isActive: true
  },
  {
    id: "srv-3",
    name: "Kids ( SD Kebawah )",
    category: "haircut",
    price: 2e4,
    durationMinutes: 25,
    description: "",
    isActive: true
  },
  {
    id: "srv-4",
    name: "Basic Colour",
    category: "treatment",
    price: 5e4,
    durationMinutes: 45,
    description: "",
    isActive: true
  },
  {
    id: "srv-5",
    name: "Perming",
    category: "treatment",
    price: 25e4,
    durationMinutes: 90,
    description: "",
    isActive: true
  },
  {
    id: "srv-6",
    name: "Full Colour",
    category: "treatment",
    price: 35e4,
    durationMinutes: 120,
    description: "",
    isActive: true
  },
  {
    id: "srv-7",
    name: "Higtlight",
    category: "treatment",
    price: 2e5,
    durationMinutes: 75,
    description: "",
    isActive: true
  },
  {
    id: "srv-8",
    name: "full Bleching",
    category: "treatment",
    price: 2e5,
    durationMinutes: 90,
    description: "",
    isActive: true
  }
];
var INITIAL_BARBERS = [
  {
    id: "barber-1",
    name: "Rian Pratama",
    isActive: true,
    workingDays: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    id: "barber-2",
    name: "Dimas Saputra",
    isActive: true,
    workingDays: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    id: "barber-3",
    name: "Aldi Wijaya",
    isActive: true,
    workingDays: [0, 1, 2, 3, 4, 5, 6]
  }
];
var INITIAL_BOOKINGS = [
  {
    id: "bk-1",
    bookingCode: "ELG-7712",
    customerName: "Fajri Rahman",
    customerPhone: "081266778899",
    customerEmail: "fajri.solok@gmail.com",
    serviceId: "srv-1",
    serviceName: "Premium",
    servicePrice: 45e3,
    barberId: "barber-1",
    barberName: "Rian Pratama",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    timeSlot: "14:00",
    totalAmount: 45e3,
    status: "confirmed",
    createdAt: new Date(Date.now() - 36e5 * 2).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "bk-2",
    bookingCode: "ELG-3401",
    customerName: "Ilham Saputra",
    customerPhone: "085277889900",
    customerEmail: "ilham.s@gmail.com",
    serviceId: "srv-5",
    serviceName: "Perming",
    servicePrice: 25e4,
    barberId: "barber-1",
    barberName: "Rian Pratama",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    timeSlot: "16:00",
    totalAmount: 25e4,
    status: "confirmed",
    createdAt: new Date(Date.now() - 36e5 * 4).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "bk-3",
    bookingCode: "ELG-5521",
    customerName: "Rendi Pratama",
    customerPhone: "082188776655",
    serviceId: "srv-1",
    serviceName: "Premium",
    servicePrice: 45e3,
    barberId: "barber-2",
    barberName: "Dimas Saputra",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    timeSlot: "16:00",
    totalAmount: 45e3,
    status: "confirmed",
    createdAt: new Date(Date.now() - 36e5 * 3).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "bk-4",
    bookingCode: "ELG-8801",
    customerName: "Bayu Nugraha",
    customerPhone: "081399887766",
    serviceId: "srv-1",
    serviceName: "Premium",
    servicePrice: 45e3,
    barberId: "barber-1",
    barberName: "Rian Pratama",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    timeSlot: "19:00",
    totalAmount: 45e3,
    status: "confirmed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "bk-5",
    bookingCode: "ELG-8802",
    customerName: "Hendra Saputra",
    customerPhone: "085266778811",
    serviceId: "srv-4",
    serviceName: "Basic Colour",
    servicePrice: 5e4,
    barberId: "barber-2",
    barberName: "Dimas Saputra",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    timeSlot: "19:00",
    totalAmount: 5e4,
    status: "confirmed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "bk-6",
    bookingCode: "ELG-8803",
    customerName: "Gilang Ramadhan",
    customerPhone: "082199881122",
    serviceId: "srv-1",
    serviceName: "Premium",
    servicePrice: 45e3,
    barberId: "barber-3",
    barberName: "Aldi Wijaya",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    timeSlot: "19:00",
    totalAmount: 45e3,
    status: "confirmed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "bk-7",
    bookingCode: "ELG-9120",
    customerName: "Budi Hartono",
    customerPhone: "081388990011",
    serviceId: "srv-1",
    serviceName: "Premium",
    servicePrice: 45e3,
    barberId: "barber-1",
    barberName: "Rian Pratama",
    date: new Date(Date.now() + 864e5).toISOString().split("T")[0],
    timeSlot: "11:00",
    totalAmount: 45e3,
    status: "confirmed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var INITIAL_TRANSACTIONS = [
  {
    id: "trx-1",
    invoiceNumber: "TRX-2026-001",
    customerName: "Fajri Rahman",
    customerPhone: "081266778899",
    barberId: "barber-1",
    barberName: "Rian Pratama",
    items: [
      {
        serviceId: "srv-1",
        serviceName: "Premium Haircut (Pangkas + Keramas + Pijat)",
        price: 45e3,
        qty: 1
      }
    ],
    subtotal: 45e3,
    discount: 0,
    totalAmount: 45e3,
    paymentMethod: "qris",
    amountPaid: 45e3,
    changeAmount: 0,
    notes: "Pembayaran QRIS via BCA Mobile",
    createdAt: new Date(Date.now() - 36e5 * 3).toISOString()
  },
  {
    id: "trx-2",
    invoiceNumber: "TRX-2026-002",
    customerName: "Dedi Kurniawan (Walk-in)",
    customerPhone: "082177443322",
    barberId: "barber-1",
    barberName: "Rian Pratama",
    items: [
      {
        serviceId: "srv-2",
        serviceName: "Reguler Haircut",
        price: 35e3,
        qty: 1
      },
      {
        serviceId: "srv-4",
        serviceName: "Black Mask & Scrub",
        price: 25e3,
        qty: 1
      }
    ],
    subtotal: 6e4,
    discount: 5e3,
    totalAmount: 55e3,
    paymentMethod: "cash",
    amountPaid: 1e5,
    changeAmount: 45e3,
    notes: "Diskon promo paket potong + masker",
    createdAt: new Date(Date.now() - 36e5 * 1).toISOString()
  }
];
var DATABASE_SCHEMA_BLUEPRINT = [
  {
    tableName: "categories",
    description: "Kategori layanan pangkas, perming, pewarnaan, dan perawatan (Haircut, Perming, Colouring, Treatment, Shaving).",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, nullable: false, defaultVal: "gen_random_uuid()", description: "Primary key kategori unik" },
      { name: "name", type: "VARCHAR(100)", nullable: false, description: "Nama kategori tampilan" },
      { name: "slug", type: "VARCHAR(100)", nullable: false, description: "Slug unik URL/filter" },
      { name: "icon", type: "VARCHAR(50)", nullable: false, defaultVal: "'Scissors'", description: "Nama icon representasi" },
      { name: "description", type: "TEXT", nullable: true, description: "Deskripsi kelompok layanan" },
      { name: "display_order", type: "INTEGER", nullable: false, defaultVal: "0", description: "Urutan tampilan di UI" },
      { name: "is_active", type: "BOOLEAN", nullable: false, defaultVal: "true", description: "Status aktif kategori" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", nullable: false, defaultVal: "NOW()", description: "Waktu pembuatan" }
    ],
    indexes: ["idx_categories_slug (UNIQUE)", "idx_categories_active"]
  },
  {
    tableName: "services",
    description: "Katalog layanan resmi, harga rupiah, dan durasi pengerjaan.",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, nullable: false, defaultVal: "gen_random_uuid()", description: "ID unik layanan" },
      { name: "category_id", type: "UUID", isForeign: true, foreignRef: "categories.id", nullable: true, description: "Kategori relasional" },
      { name: "category_slug", type: "VARCHAR(50)", nullable: false, description: "Kategori slug cepat" },
      { name: "name", type: "VARCHAR(150)", nullable: false, description: "Nama layanan (e.g. Premium, Perming)" },
      { name: "price", type: "NUMERIC(12, 2)", nullable: false, description: "Tarif harga dalam Rupiah" },
      { name: "duration_minutes", type: "INTEGER", nullable: false, defaultVal: "35", description: "Durasi pengerjaan dalam menit" },
      { name: "description", type: "TEXT", nullable: true, description: "Rincian fasilitas dan layanan" },
      { name: "badge", type: "VARCHAR(50)", nullable: true, description: "Label promosi" },
      { name: "is_active", type: "BOOLEAN", nullable: false, defaultVal: "true", description: "Status tampil di form booking" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", nullable: false, defaultVal: "NOW()", description: "Waktu pencatatan" }
    ],
    indexes: ["idx_services_category_slug", "idx_services_category_id", "idx_services_active"]
  },
  {
    tableName: "barbers",
    description: "Profil Master Barber & Hairdresser di Elegant Barbershop Solok.",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, nullable: false, defaultVal: "gen_random_uuid()", description: "ID master barber" },
      { name: "name", type: "VARCHAR(120)", nullable: false, description: "Nama barber" },
      { name: "rating", type: "NUMERIC(3, 2)", nullable: false, defaultVal: "5.00", description: "Rata-rata kepuasan pelanggan" },
      { name: "bio", type: "TEXT", nullable: true, description: "Deskripsi singkat tentang barber" },
      { name: "is_active", type: "BOOLEAN", nullable: false, defaultVal: "true", description: "Status aktif bekerja" }
    ],
    indexes: ["idx_barbers_active"]
  },
  {
    tableName: "bookings",
    description: "Transaksi booking reservasi pelanggan dan antrean online.",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, nullable: false, defaultVal: "gen_random_uuid()", description: "Primary key booking" },
      { name: "booking_code", type: "VARCHAR(30)", nullable: false, description: "Kode tiket reservasi unik (e.g. ELG-8821)" },
      { name: "customer_name", type: "VARCHAR(120)", nullable: false, description: "Nama lengkap pelanggan" },
      { name: "customer_phone", type: "VARCHAR(30)", nullable: false, description: "Nomor WhatsApp untuk konfirmasi" },
      { name: "customer_email", type: "VARCHAR(150)", nullable: true, description: "Email pelanggan" },
      { name: "service_id", type: "UUID", isForeign: true, foreignRef: "services.id", nullable: true, description: "Layanan yang dipilih" },
      { name: "service_name", type: "VARCHAR(150)", nullable: false, description: "Nama layanan snapshot" },
      { name: "service_price", type: "NUMERIC(12, 2)", nullable: false, description: "Tarif harga layanan" },
      { name: "barber_id", type: "UUID", isForeign: true, foreignRef: "barbers.id", nullable: true, description: "Barber yang dipilih" },
      { name: "barber_name", type: "VARCHAR(120)", nullable: false, description: "Nama barber snapshot" },
      { name: "date", type: "DATE", nullable: false, description: "Tanggal kedatangan" },
      { name: "time_slot", type: "VARCHAR(20)", nullable: false, description: "Jam kedatangan yang di-booking" },
      { name: "total_amount", type: "NUMERIC(12, 2)", nullable: false, description: "Total biaya layanan" },
      { name: "status", type: "VARCHAR(30)", nullable: false, defaultVal: "'pending'", description: "Status: pending, confirmed, completed, cancelled" },
      { name: "is_walk_in", type: "BOOLEAN", nullable: false, defaultVal: "false", description: "Penanda walk-in / reservasi online" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", nullable: false, defaultVal: "NOW()", description: "Waktu booking" }
    ],
    indexes: ["idx_bookings_code (UNIQUE)", "idx_bookings_date_slot", "idx_bookings_phone", "idx_bookings_status"]
  },
  {
    tableName: "transactions",
    description: "Header transaksi kasir POS, metode pembayaran, diskon, dan omzet.",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, nullable: false, defaultVal: "gen_random_uuid()", description: "ID transaksi unik" },
      { name: "invoice_number", type: "VARCHAR(40)", nullable: false, description: "Nomor invoice resmi (INV-YYYYMMDD-XXXX)" },
      { name: "booking_id", type: "UUID", isForeign: true, foreignRef: "bookings.id", nullable: true, description: "Referensi ID booking (jika ada)" },
      { name: "booking_code", type: "VARCHAR(30)", nullable: true, description: "Kode tiket booking" },
      { name: "customer_name", type: "VARCHAR(120)", nullable: false, description: "Nama pelanggan" },
      { name: "customer_phone", type: "VARCHAR(30)", nullable: true, description: "Nomor telepon pelanggan" },
      { name: "barber_id", type: "UUID", isForeign: true, foreignRef: "barbers.id", nullable: true, description: "Barber yang melayani" },
      { name: "barber_name", type: "VARCHAR(120)", nullable: false, description: "Nama barber snapshot" },
      { name: "subtotal", type: "NUMERIC(12, 2)", nullable: false, description: "Subtotal harga layanan" },
      { name: "discount", type: "NUMERIC(12, 2)", nullable: false, defaultVal: "0", description: "Potongan diskon promo" },
      { name: "total_amount", type: "NUMERIC(12, 2)", nullable: false, description: "Total akhir yang wajib dibayar" },
      { name: "payment_method", type: "VARCHAR(30)", nullable: false, description: "Metode: cash, qris, transfer, debit" },
      { name: "amount_paid", type: "NUMERIC(12, 2)", nullable: false, defaultVal: "0", description: "Nominal uang yang diserahkan" },
      { name: "change_amount", type: "NUMERIC(12, 2)", nullable: false, defaultVal: "0", description: "Uang kembalian pelanggan" },
      { name: "items", type: "JSONB", nullable: false, defaultVal: "'[]'::JSONB", description: "Snapshot data item layanan" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", nullable: false, defaultVal: "NOW()", description: "Waktu transaksi" }
    ],
    indexes: ["idx_transactions_invoice (UNIQUE)", "idx_transactions_created", "idx_transactions_payment", "idx_transactions_booking_id"]
  },
  {
    tableName: "transaction_items",
    description: "Rincian setiap item layanan / produk yang dibeli per transaksi untuk analitik kategori.",
    columns: [
      { name: "id", type: "UUID", isPrimary: true, nullable: false, defaultVal: "gen_random_uuid()", description: "ID rincian item" },
      { name: "transaction_id", type: "UUID", isForeign: true, foreignRef: "transactions.id", nullable: false, description: "Header transaksi induk" },
      { name: "service_id", type: "UUID", isForeign: true, foreignRef: "services.id", nullable: true, description: "Layanan terkait" },
      { name: "service_name", type: "VARCHAR(150)", nullable: false, description: "Nama layanan dibeli" },
      { name: "category_name", type: "VARCHAR(100)", nullable: true, description: "Nama kategori layanan" },
      { name: "unit_price", type: "NUMERIC(12, 2)", nullable: false, description: "Harga satuan" },
      { name: "quantity", type: "INTEGER", nullable: false, defaultVal: "1", description: "Jumlah kuantitas" },
      { name: "subtotal", type: "NUMERIC(12, 2)", nullable: false, description: "Total harga item (price * qty)" },
      { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", nullable: false, defaultVal: "NOW()", description: "Waktu pencatatan" }
    ],
    indexes: ["idx_trx_items_transaction_id", "idx_trx_items_service_id"]
  }
];
var SITEMAP_WORKFLOW_BLUEPRINT = [
  {
    title: "1. Frontend Pelanggan",
    path: "/",
    role: "Public / Customer",
    description: "Tampilan website publik Elegant Barbershop Solok.",
    subPages: [
      { title: "Beranda & Info Solok", path: "/#home", role: "Public / Customer", description: "Profil barbershop, slogan Minang, dan tombol booking." },
      { title: "Price List Resmi", path: "/#services", role: "Public / Customer", description: "Daftar harga: Premium 45k, Kids 20k/30k, Perming 250k, Colouring, dsb." },
      { title: "Master Barber", path: "/#barbers", role: "Public / Customer", description: "Profil hairdresser dan keahlian spesialisasi." },
      { title: "Sistem Reservasi Dinamis", path: "/#booking", role: "Public / Customer", description: "Form pemesanan jadwal terhubung WhatsApp." },
      { title: "Ulasan Pelanggan", path: "/#reviews", role: "Public / Customer", description: "Ulasan dan penilaian kepuasan pelanggan." },
      { title: "Lokasi Jl. Perwira Solok", path: "/#location", role: "Public / Customer", description: "Peta Google Maps dan rute Jl. Perwira Kota Solok." }
    ]
  },
  {
    title: "2. Dashboard Admin & Kasir",
    path: "/admin",
    role: "Admin & Staff",
    description: "Portal manajemen transaksi POS, kasir cepat, jadwal, dan layanan.",
    subPages: [
      { title: "Kasir & Transaksi POS", path: "/admin#pos", role: "Admin & Staff", description: "Input transaksi cepat (pilih item & bayar) dan pencatatan omzet harian." },
      { title: "Master Switch Booking", path: "/admin#switch", role: "Admin & Staff", description: "Buka / tutup reservasi online sekali klik." },
      { title: "Kelola Antrean & Reservasi", path: "/admin#bookings", role: "Admin & Staff", description: "Manajemen tiket dan konfirmasi WhatsApp." },
      { title: "Kelola Layanan & Harga", path: "/admin#services", role: "Admin & Staff", description: "Tambah dan ubah harga pricelist." },
      { title: "Kelola Tim Barber", path: "/admin#barbers", role: "Admin & Staff", description: "Tambah atau ubah data barber." },
      { title: "Laporan Keuangan & Omzet", path: "/admin#reports", role: "Admin & Staff", description: "Analitik pendapatan harian, mingguan, dan bulanan." }
    ]
  }
];

// server/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");

// server/config.ts
function env(key, opts = {}) {
  let val = process.env[key]?.trim() ?? "";
  if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1).trim();
  }
  if (!val && opts.required) {
    throw new Error(
      `[Config] Env var "${key}" wajib diisi. Lihat .env.example atau dokumentasi.`
    );
  }
  return val || (opts.default ?? "");
}
function envInt(key, opts = {}) {
  const raw = env(key, { required: opts.required });
  const num = parseInt(raw, 10);
  if (isNaN(num)) {
    if (opts.required) {
      throw new Error(`[Config] Env var "${key}" harus berupa angka integer.`);
    }
    return opts.default ?? 0;
  }
  return num;
}
function envBool(key, defaultValue = false) {
  const raw = env(key).toLowerCase();
  if (!raw) return defaultValue;
  return raw === "true" || raw === "1" || raw === "on";
}
var serverConfig = {
  /** Port HTTP server */
  port: envInt("PORT", { default: 3e3 }),
  /**
   * Host bind address.
   * - "0.0.0.0" → listen semua interface (cocok untuk Docker/VM)
   * - "localhost" → hanya local (aman untuk dev)
   * - "127.0.0.1" → hanya loopback
   *
   * Default: "localhost" supaya browser bisa akses http://localhost:3000
   */
  host: env("HOST", { default: "localhost" }),
  /** Node environment: development | production | test */
  nodeEnv: env("NODE_ENV", { default: "development" }),
  /** App base URL (untuk CORS, redirect, dll) */
  appUrl: env("APP_URL", { default: "http://localhost:3000" }),
  get isProduction() {
    return this.nodeEnv === "production";
  },
  get isDevelopment() {
    return this.nodeEnv !== "production";
  },
  /** Display-friendly server URL */
  get displayUrl() {
    return `http://${this.host}:${this.port}`;
  }
};
var supabaseConfig = {
  /** Supabase project URL (https://xxx.supabase.co) */
  url: env("SUPABASE_URL") || env("VITE_SUPABASE_URL"),
  /** Anon key (public, untuk client browser) */
  anonKey: env("SUPABASE_ANON_KEY") || env("VITE_SUPABASE_ANON_KEY"),
  /** Service role key (server-side, full access) — HANYA di server */
  serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  /** Database password (hanya untuk migrasi CLI) */
  dbPassword: env("SUPABASE_DB_PASSWORD"),
  /**
   * PostgreSQL connection string untuk migration CLI.
   * Jika kosong, otomatis disusun dari dbPassword + host pattern.
   */
  get databaseUrl() {
    const explicit = env("DATABASE_URL");
    if (explicit) return explicit;
    if (this.dbPassword && this.url) {
      const host = this.url.replace("https://", "db.");
      return `postgresql://postgres:${this.dbPassword}@${host.replace(".supabase.co", "")}.supabase.co:5432/postgres`;
    }
    return "";
  },
  /** Server-side client pakai service role key */
  get serverKey() {
    return this.serviceRoleKey || this.anonKey;
  },
  get isConfigured() {
    return Boolean(this.url && this.serverKey && this.url.startsWith("http"));
  },
  /** Deteksi detail masalah env Supabase untuk pesan error yang jelas */
  diagnose() {
    const issues = [];
    if (!this.url) {
      issues.push("SUPABASE_URL / VITE_SUPABASE_URL tidak terbaca oleh Functions");
    } else if (!this.url.startsWith("http")) {
      issues.push(`SUPABASE_URL tidak valid (harus diawali https://)`);
    }
    if (!this.serviceRoleKey) {
      issues.push(
        this.anonKey ? "SUPABASE_SERVICE_ROLE_KEY tidak terbaca (yang terdeteksi hanya anon key)" : "SUPABASE_SERVICE_ROLE_KEY & SUPABASE_ANON_KEY tidak terbaca"
      );
    }
    return issues.length > 0 ? issues : ["Konfigurasi terbaca, namun kredensial ditolak \u2014 cek nilai di dashboard Vercel"];
  }
};
var dbConfig = {
  /** Jalankan auto-migrate saat server boot */
  autoMigrate: envBool("DB_AUTO_MIGRATE", true)
};
var aiConfig = {
  /** Google Gemini API key */
  apiKey: env("GEMINI_API_KEY"),
  /** Model name */
  model: env("GEMINI_MODEL", { default: "gemini-3.7-flash" }),
  get isEnabled() {
    return Boolean(this.apiKey);
  }
};
var rateLimitConfig = {
  /** Default max requests per window */
  maxRequests: envInt("RATE_LIMIT_MAX", { default: 60 }),
  /** Window size in ms */
  windowMs: envInt("RATE_LIMIT_WINDOW_MS", { default: 6e4 })
};
var securityConfig = {
  /** Trusted proxy count (reverse proxy) */
  trustProxy: envInt("TRUST_PROXY", { default: 0 }),
  /** CORS origins (comma-separated) */
  corsOrigins: env("CORS_ORIGINS", { default: "" }).split(",").map((s) => s.trim()).filter(Boolean)
};

// server/supabase.ts
var serverSupabaseInstance = null;
var lastUsedKey = "";
var getServerSupabase = () => {
  if (!supabaseConfig.isConfigured) return null;
  const { url, serverKey } = supabaseConfig;
  if (!serverSupabaseInstance || lastUsedKey !== serverKey) {
    try {
      serverSupabaseInstance = (0, import_supabase_js.createClient)(url, serverKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      lastUsedKey = serverKey;
      const masked = url.replace(/^(https?:\/\/[^/]{6})[^/]+/, "$1****");
      console.log(`\u2705 [Supabase Server] Client initialized for ${masked}`);
    } catch (err) {
      console.warn("\u26A0\uFE0F Failed to initialize Supabase server client:", err);
      return null;
    }
  }
  return serverSupabaseInstance;
};
var checkServerSupabaseStatus = async () => {
  const mask = (s) => s.replace(/^(https?:\/\/[^/]{4})[^/]+/, "$1****");
  if (!supabaseConfig.isConfigured) {
    return {
      isConfigured: false,
      isConnected: false,
      supabaseUrlMasked: null,
      mode: "in_memory_fallback",
      tables: {
        categories: false,
        services: false,
        barbers: false,
        bookings: false,
        transactions: false
      },
      message: "Variabel SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum terisi. Server beroperasi dalam mode In-Memory."
    };
  }
  const client = getServerSupabase();
  if (!client) {
    return {
      isConfigured: true,
      isConnected: false,
      supabaseUrlMasked: mask(supabaseConfig.url),
      mode: "in_memory_fallback",
      tables: {
        categories: false,
        services: false,
        barbers: false,
        bookings: false,
        transactions: false
      },
      message: "Gagal menginisialisasi Supabase Client dengan kredensial yang diberikan."
    };
  }
  try {
    const [catRes, srvRes, brbRes, bkgRes, trxRes] = await Promise.all([
      client.from("categories").select("id").limit(1),
      client.from("services").select("id").limit(1),
      client.from("barbers").select("id").limit(1),
      client.from("bookings").select("id").limit(1),
      client.from("transactions").select("id").limit(1)
    ]);
    const tables = {
      categories: !catRes.error,
      services: !srvRes.error,
      barbers: !brbRes.error,
      bookings: !bkgRes.error,
      transactions: !trxRes.error
    };
    const hasAnyTable = Object.values(tables).some(Boolean);
    const firstError = [catRes, srvRes, brbRes, bkgRes, trxRes].find((result) => result.error)?.error;
    if (hasAnyTable) {
      return {
        isConfigured: true,
        isConnected: true,
        supabaseUrlMasked: mask(supabaseConfig.url),
        mode: "supabase_live",
        tables,
        message: "Koneksi ke Supabase PostgreSQL aktif dan tabel terdeteksi secara real-time!"
      };
    } else {
      return {
        isConfigured: true,
        isConnected: false,
        supabaseUrlMasked: mask(supabaseConfig.url),
        mode: "in_memory_fallback",
        tables,
        message: firstError?.code === "PGRST301" || firstError?.message?.toLowerCase().includes("jwt") ? "Supabase API menolak key server (401). Ganti SUPABASE_SERVICE_ROLE_KEY dengan secret/service_role key yang valid dari Project Settings > API." : `Supabase API tidak dapat membaca tabel. ${firstError?.message || "Periksa kredensial dan RLS."}`
      };
    }
  } catch (err) {
    return {
      isConfigured: true,
      isConnected: false,
      supabaseUrlMasked: mask(supabaseConfig.url),
      mode: "in_memory_fallback",
      tables: {
        categories: false,
        services: false,
        barbers: false,
        bookings: false,
        transactions: false
      },
      message: `Gagal menghubungi Supabase: ${err?.message || "Network error"}`
    };
  }
};

// server/supabaseRepo.ts
var SupabaseRepo = class {
  // --- Settings ---
  static async fetchSettings() {
    const client = getServerSupabase();
    if (!client) return null;
    try {
      const { data, error } = await client.from("system_settings").select("*").limit(1).maybeSingle();
      if (error || !data) return null;
      return {
        ...INITIAL_SETTINGS,
        shopName: data.shop_name || data.shopName || INITIAL_SETTINGS.shopName,
        tagline: data.tagline || INITIAL_SETTINGS.tagline,
        address: data.address || INITIAL_SETTINGS.address,
        phone: data.phone || INITIAL_SETTINGS.phone,
        whatsappNumber: data.whatsapp_number || data.whatsappNumber || INITIAL_SETTINGS.whatsappNumber,
        isBookingOpen: data.is_booking_open !== void 0 ? Boolean(data.is_booking_open) : data.isBookingOpen !== void 0 ? Boolean(data.isBookingOpen) : INITIAL_SETTINGS.isBookingOpen,
        walkInOnlyMessage: data.walk_in_only_message || data.walkInOnlyMessage || INITIAL_SETTINGS.walkInOnlyMessage,
        currentWalkInQueue: Number(data.active_lounge_queue ?? data.currentWalkInQueue ?? INITIAL_SETTINGS.currentWalkInQueue),
        estimatedWalkInWaitMinutes: Number(data.estimated_wait_minutes ?? data.estimatedWalkInWaitMinutes ?? INITIAL_SETTINGS.estimatedWalkInWaitMinutes)
      };
    } catch {
      return null;
    }
  }
  static async saveSettings(settings) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("system_settings").upsert({
        id: "default_settings",
        shop_name: settings.shopName,
        tagline: settings.tagline,
        address: settings.address,
        phone: settings.phone,
        whatsapp_number: settings.whatsappNumber,
        is_booking_open: settings.isBookingOpen,
        walk_in_only_message: settings.walkInOnlyMessage,
        active_lounge_queue: settings.currentWalkInQueue,
        estimated_wait_minutes: settings.estimatedWalkInWaitMinutes,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      return !error;
    } catch {
      return false;
    }
  }
  // --- Services ---
  static async fetchServices() {
    const client = getServerSupabase();
    if (!client) return null;
    try {
      const { data, error } = await client.from("services").select("*").eq("is_deleted", false);
      if (error || !data || data.length === 0) {
        return null;
      }
      return data.map((s) => ({
        id: String(s.id),
        name: s.name || s.nama || s.service_name || "Layanan Pangkas",
        category: s.category_slug || s.category || s.kategori || "haircut",
        price: Number(s.price ?? s.harga ?? 0),
        durationMinutes: Number(s.duration_minutes ?? s.durationMinutes ?? s.durasi ?? 35),
        description: s.description || s.deskripsi || "",
        badge: s.badge || void 0,
        isActive: s.is_active !== void 0 ? Boolean(s.is_active) : s.isActive !== void 0 ? Boolean(s.isActive) : true
      }));
    } catch {
      return null;
    }
  }
  static async insertService(service) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("services").insert({
        name: service.name,
        category_slug: service.category,
        price: service.price,
        duration_minutes: service.durationMinutes,
        description: service.description,
        badge: service.badge || null,
        is_active: service.isActive
      });
      return !error;
    } catch {
      return false;
    }
  }
  static async updateService(id, updates) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const payload = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.category) payload.category_slug = updates.category;
      if (updates.price !== void 0) payload.price = updates.price;
      if (updates.durationMinutes !== void 0) payload.duration_minutes = updates.durationMinutes;
      if (updates.description !== void 0) payload.description = updates.description;
      if (updates.badge !== void 0) payload.badge = updates.badge;
      if (updates.isActive !== void 0) payload.is_active = updates.isActive;
      const { error } = await client.from("services").update(payload).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  static async deleteService(id) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("services").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  static async restoreService(id) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("services").update({
        is_deleted: false,
        deleted_at: null
      }).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  // --- Barbers ---
  static async fetchBarbers() {
    const client = getServerSupabase();
    if (!client) return null;
    try {
      const { data, error } = await client.from("barbers").select("*").eq("is_deleted", false);
      if (error || !data || data.length === 0) {
        return null;
      }
      return data.map((b) => ({
        id: String(b.id),
        name: b.name || "Barber",
        phone: b.phone || void 0,
        isActive: b.is_active !== void 0 ? Boolean(b.is_active) : true,
        workingDays: Array.isArray(b.working_days) ? b.working_days : [0, 1, 2, 3, 4, 5, 6]
      }));
    } catch {
      return null;
    }
  }
  static async insertBarber(barber) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("barbers").insert({
        name: barber.name,
        phone: barber.phone || null,
        is_active: barber.isActive,
        working_days: barber.workingDays
      });
      return !error;
    } catch {
      return false;
    }
  }
  static async updateBarber(id, updates) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const payload = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.phone !== void 0) payload.phone = updates.phone || null;
      if (updates.isActive !== void 0) payload.is_active = updates.isActive;
      if (updates.workingDays) payload.working_days = updates.workingDays;
      const { error } = await client.from("barbers").update(payload).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  static async deleteBarber(id) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("barbers").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  static async restoreBarber(id) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("barbers").update({
        is_deleted: false,
        deleted_at: null
      }).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
  // --- Bookings ---
  static async fetchBookings() {
    const client = getServerSupabase();
    if (!client) return null;
    try {
      const { data, error } = await client.from("bookings").select("*").eq("is_deleted", false);
      if (error || !data || data.length === 0) {
        return null;
      }
      return data.map((b) => ({
        id: String(b.id),
        bookingCode: b.booking_code || b.bookingCode || `ELG-${String(b.id).slice(-4)}`,
        customerName: b.customer_name || b.customerName || "Pelanggan",
        customerPhone: b.customer_phone || b.customerPhone || "",
        customerEmail: b.customer_email || b.customerEmail || void 0,
        serviceId: String(b.service_id || b.serviceId || "srv-1"),
        serviceName: b.service_name || b.serviceName || "Layanan Pangkas",
        servicePrice: Number(b.service_price ?? b.servicePrice ?? 0),
        barberId: String(b.barber_id || b.barberId || "any"),
        barberName: b.barber_name || b.barberName || "Barber Siap Pertama",
        date: typeof b.date === "string" ? b.date.split("T")[0] : b.date,
        timeSlot: b.time_slot || b.timeSlot || "10:00",
        totalAmount: Number(b.total_amount ?? b.totalAmount ?? 0),
        status: b.status || "pending",
        notes: b.notes || void 0,
        isWalkIn: Boolean(b.is_walk_in ?? b.isWalkIn ?? false),
        createdAt: b.created_at || b.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: b.updated_at || b.updatedAt || b.created_at || (/* @__PURE__ */ new Date()).toISOString()
      }));
    } catch {
      return null;
    }
  }
  static async insertBooking(booking) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("bookings").insert({
        booking_code: booking.bookingCode,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail || null,
        service_id: booking.serviceId.length > 20 ? booking.serviceId : null,
        service_name: booking.serviceName,
        service_category: "haircut",
        service_price: booking.servicePrice,
        barber_id: booking.barberId.length > 20 ? booking.barberId : null,
        barber_name: booking.barberName,
        date: booking.date,
        time_slot: booking.timeSlot,
        total_amount: booking.totalAmount,
        status: booking.status,
        is_walk_in: booking.isWalkIn
      });
      return !error;
    } catch {
      return false;
    }
  }
  static async updateBooking(id, updates) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const payload = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (updates.status) payload.status = updates.status;
      if (updates.customerName) payload.customer_name = updates.customerName;
      if (updates.customerPhone) payload.customer_phone = updates.customerPhone;
      const { error } = await client.from("bookings").update(payload).or(`id.eq.${id},booking_code.eq.${id}`);
      return !error;
    } catch {
      return false;
    }
  }
  static async deleteBooking(id) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("bookings").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).or(`id.eq.${id},booking_code.eq.${id}`);
      return !error;
    } catch {
      return false;
    }
  }
  // --- Transactions ---
  static async fetchTransactions() {
    const client = getServerSupabase();
    if (!client) return null;
    try {
      const { data, error } = await client.from("transactions").select("*").eq("is_deleted", false);
      if (error || !data || data.length === 0) {
        return null;
      }
      return data.map((t) => ({
        id: String(t.id),
        invoiceNumber: t.invoice_number || t.invoiceNumber || `TRX-${String(t.id).slice(-4)}`,
        bookingId: t.booking_id ? String(t.booking_id) : void 0,
        customerName: t.customer_name || t.customerName || "Pelanggan",
        customerPhone: t.customer_phone || t.customerPhone || void 0,
        barberId: String(t.barber_id || t.barberId || "barber-1"),
        barberName: t.barber_name || t.barberName || "Staff Barber",
        items: Array.isArray(t.items) ? t.items : [],
        subtotal: Number(t.subtotal ?? t.total_amount ?? 0),
        discount: Number(t.discount ?? 0),
        totalAmount: Number(t.total_amount ?? 0),
        paymentMethod: t.payment_method || t.paymentMethod || "cash",
        amountPaid: Number(t.amount_paid ?? t.total_amount ?? 0),
        changeAmount: Number(t.change_amount ?? 0),
        notes: t.notes || void 0,
        createdAt: t.created_at || t.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      }));
    } catch {
      return null;
    }
  }
  static async insertTransaction(trx) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.rpc("fn_create_pos_transaction", {
        p_invoice_number: trx.invoiceNumber,
        p_booking_id: trx.bookingId && trx.bookingId.length > 20 ? trx.bookingId : null,
        p_customer_name: trx.customerName,
        p_customer_phone: trx.customerPhone || null,
        p_barber_id: trx.barberId && trx.barberId.length > 20 ? trx.barberId : null,
        p_barber_name: trx.barberName,
        p_items: trx.items,
        p_subtotal: trx.subtotal,
        p_discount: trx.discount,
        p_total_amount: trx.totalAmount,
        p_payment_method: trx.paymentMethod,
        p_amount_paid: trx.amountPaid,
        p_change_amount: trx.changeAmount,
        p_notes: trx.notes || null
      });
      if (error) {
        const { error: insertErr } = await client.from("transactions").insert({
          invoice_number: trx.invoiceNumber,
          customer_name: trx.customerName,
          customer_phone: trx.customerPhone || null,
          barber_name: trx.barberName,
          items: trx.items,
          subtotal: trx.subtotal,
          discount: trx.discount,
          total_amount: trx.totalAmount,
          payment_method: trx.paymentMethod,
          payment_status: "paid",
          amount_paid: trx.amountPaid,
          change_amount: trx.changeAmount,
          notes: trx.notes || null
        });
        return !insertErr;
      }
      return true;
    } catch {
      return false;
    }
  }
  static async deleteTransaction(id) {
    const client = getServerSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from("transactions").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
};

// server/state.ts
var ServerStore = class {
  constructor() {
    this.settings = { ...INITIAL_SETTINGS };
    this.services = [...INITIAL_SERVICES];
    this.barbers = [...INITIAL_BARBERS];
    this.bookings = [...INITIAL_BOOKINGS];
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.isInitialized = false;
    this.initSupabaseSync();
  }
  async initSupabaseSync() {
    try {
      const [remoteSettings, remoteServices, remoteBarbers, remoteBookings, remoteTransactions] = await Promise.all([
        SupabaseRepo.fetchSettings(),
        SupabaseRepo.fetchServices(),
        SupabaseRepo.fetchBarbers(),
        SupabaseRepo.fetchBookings(),
        SupabaseRepo.fetchTransactions()
      ]);
      if (remoteSettings) this.settings = remoteSettings;
      if (remoteServices && remoteServices.length > 0) this.services = remoteServices;
      if (remoteBarbers && remoteBarbers.length > 0) this.barbers = remoteBarbers;
      if (remoteBookings && remoteBookings.length > 0) this.bookings = remoteBookings;
      if (remoteTransactions && remoteTransactions.length > 0) this.transactions = remoteTransactions;
      this.isInitialized = true;
      console.log("\u26A1 ServerStore synced with Supabase PostgreSQL");
    } catch (err) {
      console.log("\u2139\uFE0F Supabase not active or using local fallback state");
    }
  }
  // --- Settings ---
  getSettings() {
    return { ...this.settings };
  }
  updateSettings(updates, persist = true) {
    this.settings = { ...this.settings, ...updates };
    if (persist) {
      void SupabaseRepo.saveSettings(this.settings);
    }
    return { ...this.settings };
  }
  toggleBookingSwitch(isOpen) {
    if (typeof isOpen === "boolean") {
      this.settings.isBookingOpen = isOpen;
    } else {
      this.settings.isBookingOpen = !this.settings.isBookingOpen;
    }
    void SupabaseRepo.saveSettings(this.settings);
    return {
      isBookingOpen: this.settings.isBookingOpen,
      message: this.settings.isBookingOpen ? "Sistem Booking Online DIBUKA. Pelanggan dapat reservasi." : "Sistem Booking Online DITUTUP. Form di halaman depan kini menampilkan mode Walk-In Only."
    };
  }
  // --- Services ---
  getServices() {
    return [...this.services];
  }
  setServices(services) {
    this.services = [...services];
  }
  getServiceById(id) {
    return this.services.find((s) => s.id === id);
  }
  addService(service, persist = true) {
    this.services.push(service);
    if (persist) {
      void SupabaseRepo.insertService(service);
    }
    return service;
  }
  updateService(id, updates, persist = true) {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.services[idx] = { ...this.services[idx], ...updates };
    if (persist) {
      void SupabaseRepo.updateService(id, updates);
    }
    return this.services[idx];
  }
  deleteService(id, persist = true) {
    const prevLen = this.services.length;
    this.services = this.services.filter((s) => s.id !== id);
    if (persist) {
      void SupabaseRepo.deleteService(id);
    }
    return this.services.length < prevLen;
  }
  // --- Barbers ---
  getBarbers() {
    return [...this.barbers];
  }
  setBarbers(barbers) {
    this.barbers = [...barbers];
  }
  getBarberById(id) {
    return this.barbers.find((b) => b.id === id);
  }
  addBarber(barber, persist = true) {
    this.barbers.push(barber);
    if (persist) {
      void SupabaseRepo.insertBarber(barber);
    }
    return barber;
  }
  updateBarber(id, updates, persist = true) {
    const idx = this.barbers.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.barbers[idx] = { ...this.barbers[idx], ...updates };
    if (persist) {
      void SupabaseRepo.updateBarber(id, updates);
    }
    return this.barbers[idx];
  }
  deleteBarber(id, persist = true) {
    const prevLen = this.barbers.length;
    this.barbers = this.barbers.filter((b) => b.id !== id);
    if (persist) {
      void SupabaseRepo.deleteBarber(id);
    }
    return this.barbers.length < prevLen;
  }
  // --- Bookings ---
  getBookings() {
    return [...this.bookings];
  }
  setBookings(bookings) {
    this.bookings = [...bookings];
  }
  addBooking(booking, persist = true) {
    this.bookings.unshift(booking);
    if (persist) {
      void SupabaseRepo.insertBooking(booking);
    }
    return booking;
  }
  updateBooking(id, updates, persist = true) {
    const idx = this.bookings.findIndex((b) => b.id === id || b.bookingCode === id);
    if (idx === -1) return null;
    this.bookings[idx] = {
      ...this.bookings[idx],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (persist) {
      void SupabaseRepo.updateBooking(id, updates);
    }
    return this.bookings[idx];
  }
  deleteBooking(id, persist = true) {
    const prevLen = this.bookings.length;
    this.bookings = this.bookings.filter((b) => b.id !== id && b.bookingCode !== id);
    if (persist) {
      void SupabaseRepo.deleteBooking(id);
    }
    return this.bookings.length < prevLen;
  }
  // --- Transactions ---
  getTransactions() {
    return [...this.transactions];
  }
  setTransactions(transactions) {
    this.transactions = [...transactions];
  }
  addTransaction(trx, persist = true) {
    this.transactions.unshift(trx);
    if (persist) {
      void SupabaseRepo.insertTransaction(trx);
    }
    if (trx.bookingId) {
      this.updateBooking(trx.bookingId, { status: "completed" }, false);
    }
    return trx;
  }
  deleteTransaction(id, persist = true) {
    const prevLen = this.transactions.length;
    this.transactions = this.transactions.filter((t) => t.id !== id);
    if (persist) {
      void SupabaseRepo.deleteTransaction(id);
    }
    return this.transactions.length < prevLen;
  }
};
var serverStore = new ServerStore();

// server/routes/settings.ts
var settingsRouter = (0, import_express.Router)();
settingsRouter.get("/", (_req, res) => {
  res.json(serverStore.getSettings());
});
settingsRouter.put("/", (req, res) => {
  const updates = req.body;
  if (updates.shopName) updates.shopName = sanitizeString(updates.shopName);
  if (updates.tagline) updates.tagline = sanitizeString(updates.tagline);
  if (updates.address) updates.address = sanitizeString(updates.address);
  if (updates.phone) updates.phone = sanitizeString(updates.phone);
  if (updates.whatsappNumber) updates.whatsappNumber = sanitizeString(updates.whatsappNumber);
  const newSettings = serverStore.updateSettings(updates);
  res.json({
    success: true,
    settings: newSettings,
    message: "Pengaturan sistem berhasil diperbarui."
  });
});
settingsRouter.post("/toggle-booking", (req, res) => {
  const { isOpen } = req.body;
  const result = serverStore.toggleBookingSwitch(typeof isOpen === "boolean" ? isOpen : void 0);
  res.json({
    success: true,
    isBookingOpen: result.isBookingOpen,
    message: result.message
  });
});

// server/routes/services.ts
var import_express2 = require("express");
var servicesRouter = (0, import_express2.Router)();
servicesRouter.get("/", async (_req, res) => {
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase.from("services").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map((s) => ({
          id: String(s.id),
          name: s.name || "Layanan Pangkas",
          category: s.category_slug || s.category || "haircut",
          price: Number(s.price ?? 0),
          durationMinutes: Number(s.duration_minutes ?? s.durationMinutes ?? 35),
          description: s.description || "",
          badge: s.badge || void 0,
          isActive: s.is_active !== void 0 ? Boolean(s.is_active) : true
        }));
        serverStore.setServices(mapped);
        return res.json(mapped);
      }
    }
  } catch (err) {
    console.warn("[Services Route] Remote fetch error:", err);
  }
  res.json(serverStore.getServices());
});
servicesRouter.post("/", async (req, res) => {
  const name = sanitizeString(req.body.name);
  if (!name) {
    return res.status(400).json({ error: "Nama layanan wajib diisi." });
  }
  const parsedPrice = Number(req.body.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "Harga layanan harus berupa angka yang valid." });
  }
  const price = parsedPrice;
  const newService = {
    id: req.body.id || `srv-${Date.now()}`,
    name,
    category: req.body.category || "haircut",
    price,
    durationMinutes: Math.max(5, Number(req.body.durationMinutes) || 40),
    description: sanitizeString(req.body.description || ""),
    badge: req.body.badge ? sanitizeString(req.body.badge) : void 0,
    isActive: req.body.isActive !== false
  };
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("services").insert({
        name: newService.name,
        category_slug: newService.category,
        price: newService.price,
        duration_minutes: newService.durationMinutes,
        description: newService.description,
        badge: newService.badge || null,
        is_active: newService.isActive
      });
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Insert Service Error]:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Insert Service Error]:", err);
    }
  }
  const created = serverStore.addService(newService, false);
  res.status(201).json({
    success: true,
    service: created,
    message: persistedToDatabase ? "Layanan berhasil disimpan ke database." : "Layanan berhasil disimpan (mode lokal)."
  });
});
servicesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.name) updates.name = sanitizeString(updates.name);
  if (updates.description) updates.description = sanitizeString(updates.description);
  if (updates.badge) updates.badge = sanitizeString(updates.badge);
  if (updates.price !== void 0) {
    const parsedPrice = Number(updates.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "Harga layanan harus berupa angka yang valid." });
    }
    updates.price = parsedPrice;
  }
  const existing = serverStore.getServiceById(id);
  if (!existing) {
    return res.status(404).json({ error: "Layanan tidak ditemukan." });
  }
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const payload = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.category) payload.category_slug = updates.category;
      if (updates.price !== void 0) payload.price = updates.price;
      if (updates.durationMinutes !== void 0) payload.duration_minutes = updates.durationMinutes;
      if (updates.description !== void 0) payload.description = updates.description;
      if (updates.badge !== void 0) payload.badge = updates.badge;
      if (updates.isActive !== void 0) payload.is_active = updates.isActive;
      const { error } = await supabase.from("services").update(payload).eq("id", id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Update Service Error]:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Update Service Error]:", err);
    }
  }
  const updated = serverStore.updateService(id, updates, false);
  if (!updated) {
    return res.status(404).json({ error: "Layanan tidak ditemukan." });
  }
  res.json({
    success: true,
    service: updated,
    message: persistedToDatabase ? "Layanan berhasil diperbarui di database." : "Layanan berhasil diperbarui (mode lokal)."
  });
});
servicesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!serverStore.getServiceById(id)) {
    return res.status(404).json({ error: "Layanan tidak ditemukan." });
  }
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("services").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Delete Service Error]:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Delete Service Error]:", err);
    }
  }
  serverStore.deleteService(id, false);
  res.json({
    success: true,
    message: persistedToDatabase ? "Layanan berhasil dihapus dari database." : "Layanan berhasil dihapus (mode lokal)."
  });
});

// server/routes/barbers.ts
var import_express3 = require("express");
var barbersRouter = (0, import_express3.Router)();
barbersRouter.get("/", async (_req, res) => {
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase.from("barbers").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map((b) => ({
          id: String(b.id),
          name: b.name || "Barber",
          isActive: b.is_active !== void 0 ? Boolean(b.is_active) : true,
          workingDays: Array.isArray(b.working_days) ? b.working_days : [0, 1, 2, 3, 4, 5, 6]
        }));
        serverStore.setBarbers(mapped);
        return res.json(mapped);
      }
    }
  } catch (err) {
    console.warn("[Barbers Route] Remote fetch error:", err);
  }
  res.json(serverStore.getBarbers());
});
barbersRouter.post("/", async (req, res) => {
  const name = sanitizeString(req.body.name);
  if (!name) {
    return res.status(400).json({ error: "Nama barber wajib diisi." });
  }
  const newBarber = {
    id: req.body.id || `barber-${Date.now()}`,
    name,
    isActive: req.body.isActive !== false,
    workingDays: Array.isArray(req.body.workingDays) ? req.body.workingDays : [0, 1, 2, 3, 4, 5, 6]
  };
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("barbers").insert({
        name: newBarber.name,
        is_active: newBarber.isActive,
        working_days: newBarber.workingDays
      });
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Insert Barber Error]:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Insert Barber Error]:", err);
    }
  }
  const created = serverStore.addBarber(newBarber, false);
  res.status(201).json({
    success: true,
    barber: created,
    message: persistedToDatabase ? "Barber berhasil disimpan ke database." : "Barber berhasil disimpan (mode lokal)."
  });
});
barbersRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.name) updates.name = sanitizeString(updates.name);
  const existing = serverStore.getBarberById(id);
  if (!existing) {
    return res.status(404).json({ error: "Barber tidak ditemukan." });
  }
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const payload = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.isActive !== void 0) payload.is_active = updates.isActive;
      if (updates.workingDays) payload.working_days = updates.workingDays;
      const { error } = await supabase.from("barbers").update(payload).eq("id", id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Update Barber Error]:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Update Barber Error]:", err);
    }
  }
  const updated = serverStore.updateBarber(id, updates, false);
  if (!updated) {
    return res.status(404).json({ error: "Barber tidak ditemukan." });
  }
  res.json({
    success: true,
    barber: updated,
    message: persistedToDatabase ? "Barber berhasil diperbarui di database." : "Barber berhasil diperbarui (mode lokal)."
  });
});
barbersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!serverStore.getBarberById(id)) {
    return res.status(404).json({ error: "Barber tidak ditemukan." });
  }
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("barbers").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Delete Barber Error]:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Delete Barber Error]:", err);
    }
  }
  serverStore.deleteBarber(id, false);
  res.json({
    success: true,
    message: persistedToDatabase ? "Barber berhasil dihapus dari database." : "Barber berhasil dihapus (mode lokal)."
  });
});

// server/routes/bookings.ts
var import_express4 = require("express");
var bookingsRouter = (0, import_express4.Router)();
function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^0-9]/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}
var ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "in_service"];
async function findActiveBookingByPhone(phone, todayStr) {
  const normalized = normalizePhone(phone);
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("bookings").select("id, booking_code, customer_phone, date, time_slot").eq("is_deleted", false).in("status", ACTIVE_BOOKING_STATUSES).gte("date", todayStr).order("created_at", { ascending: false }).limit(200);
      if (!error && data) {
        const found = data.find((b) => normalizePhone(b.customer_phone) === normalized);
        if (found) {
          return { code: String(found.booking_code || ""), date: String(found.date || "") };
        }
        return null;
      }
    } catch (err) {
      console.warn("[Bookings Route] Duplikat phone check error:", err);
    }
  }
  const memFound = serverStore.getBookings().find(
    (b) => normalizePhone(b.customerPhone) === normalized && ACTIVE_BOOKING_STATUSES.includes(b.status) && b.date >= todayStr
  );
  return memFound ? { code: memFound.bookingCode, date: memFound.date } : null;
}
bookingsRouter.get("/", async (req, res) => {
  const { date, status, search, code } = req.query;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from("bookings").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
      if (code) {
        query = query.ilike("booking_code", String(code));
      }
      if (date) {
        query = query.eq("date", String(date));
      }
      if (status && status !== "all") {
        query = query.eq("status", String(status));
      }
      if (search) {
        const q = String(search);
        query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,booking_code.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const formatted = data.map((b) => ({
          id: b.id,
          bookingCode: b.booking_code,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          customerEmail: b.customer_email || void 0,
          serviceId: b.service_id || "srv-1",
          serviceName: b.service_name,
          servicePrice: Number(b.service_price) || 0,
          barberId: b.barber_id || "any",
          barberName: b.barber_name,
          date: b.date,
          timeSlot: b.time_slot,
          totalAmount: Number(b.total_amount) || 0,
          status: b.status || "pending",
          isWalkIn: b.is_walk_in || false,
          createdAt: b.created_at,
          updatedAt: b.updated_at || b.created_at
        }));
        return res.json(formatted);
      }
    } catch (err) {
      console.warn("[Supabase Bookings Error]:", err);
    }
  }
  let filtered = serverStore.getBookings();
  if (code) {
    filtered = filtered.filter((b) => b.bookingCode.toLowerCase() === String(code).toLowerCase());
  }
  if (date) {
    filtered = filtered.filter((b) => b.date === date);
  }
  if (status && status !== "all") {
    filtered = filtered.filter((b) => b.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (b) => b.customerName.toLowerCase().includes(q) || b.customerPhone.includes(q) || b.bookingCode.toLowerCase().includes(q) || b.serviceName.toLowerCase().includes(q)
    );
  }
  res.json(filtered);
});
bookingsRouter.post("/", rateLimiter(30, 6e4), async (req, res) => {
  const settings = serverStore.getSettings();
  const isManualWalkIn = req.body.isWalkIn === true;
  const isAdminEntry = req.body.isAdminEntry === true;
  if (!settings.isBookingOpen && !isManualWalkIn && !isAdminEntry) {
    return res.status(403).json({
      error: "Sistem booking online saat ini sedang ditutup atau dalam mode walk-in.",
      message: settings.walkInOnlyMessage
    });
  }
  const customerName = sanitizeString(req.body.customerName);
  const customerPhone = sanitizeString(req.body.customerPhone).replace(/[^0-9]/g, "").slice(0, 16);
  const customerEmail = req.body.customerEmail ? sanitizeString(req.body.customerEmail) : void 0;
  const serviceId = sanitizeString(req.body.serviceId);
  const barberId = sanitizeString(req.body.barberId || "any");
  const date = sanitizeString(req.body.date);
  const timeSlot = sanitizeString(req.body.timeSlot);
  if (!customerName || !customerPhone || !serviceId || !date || !timeSlot) {
    return res.status(400).json({
      error: "Data booking belum lengkap. Nama, Telepon, Layanan, Tanggal, dan Jam wajib diisi."
    });
  }
  const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1e3);
  const todayStr = nowWIB.toISOString().split("T")[0];
  if (date === todayStr && !isManualWalkIn) {
    const [slotH, slotM] = timeSlot.split(":").map(Number);
    const currentH = nowWIB.getUTCHours();
    const currentM = nowWIB.getUTCMinutes();
    if (slotH < currentH || slotH === currentH && slotM <= currentM) {
      return res.status(400).json({
        error: `Jam ${timeSlot} sudah lewat untuk hari ini. Silakan pilih jam yang tersedia.`
      });
    }
  }
  if (date < todayStr && !isManualWalkIn) {
    return res.status(400).json({
      error: "Tidak dapat membuat booking untuk tanggal yang sudah lewat."
    });
  }
  if (!isManualWalkIn && !isAdminEntry) {
    try {
      const existing = await findActiveBookingByPhone(customerPhone, todayStr);
      if (existing) {
        return res.status(409).json({
          error: `Nomor WhatsApp ini sudah memiliki reservasi aktif dengan kode ${existing.code} pada ${existing.date}. Satu nomor hanya boleh satu reservasi aktif. Setelah hari reservasi terlewat, Anda bisa memesan lagi.`
        });
      }
    } catch (err) {
      console.warn("[Bookings Route] Gagal cek duplikat nomor:", err);
    }
  }
  const service = serverStore.getServiceById(serviceId);
  const serviceName = service ? service.name : req.body.serviceName || "Layanan Pangkas";
  const servicePrice = service ? service.price : Number(req.body.servicePrice) || 45e3;
  let barberName = "Barber Siap Pertama";
  if (barberId && barberId !== "any") {
    const b = serverStore.getBarberById(barberId);
    if (b) barberName = b.name;
    else if (req.body.barberName) barberName = req.body.barberName;
  }
  const randomDigits = Math.floor(1e3 + Math.random() * 9e3);
  const bookingCode = `ELG-${randomDigits}`;
  const newBooking = {
    id: `bk-${Date.now()}`,
    bookingCode,
    customerName,
    customerPhone,
    customerEmail,
    serviceId,
    serviceName,
    servicePrice,
    barberId,
    barberName,
    date,
    timeSlot,
    totalAmount: servicePrice,
    status: "pending",
    isWalkIn: isManualWalkIn,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("bookings").insert({
        booking_code: bookingCode,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        service_id: serviceId.length > 20 ? serviceId : null,
        service_name: serviceName,
        service_category: service?.category || "haircut",
        service_price: servicePrice,
        barber_id: barberId !== "any" && barberId.length > 20 ? barberId : null,
        barber_name: barberName,
        date,
        time_slot: timeSlot,
        total_amount: servicePrice,
        status: "pending",
        is_walk_in: isManualWalkIn
      }).select().single();
      if (!error && data) {
        newBooking.id = data.id;
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Insert Booking] Gagal:", error?.message);
      }
    } catch (err) {
      console.error("[Supabase Insert Booking] Gagal:", err);
    }
  }
  const created = serverStore.addBooking(newBooking, false);
  res.status(201).json({
    success: true,
    booking: created,
    message: `Reservasi berhasil tercatat! Kode: ${bookingCode}`
  });
});
bookingsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.customerName) updates.customerName = sanitizeString(updates.customerName);
  if (updates.customerPhone) updates.customerPhone = sanitizeString(updates.customerPhone);
  if (updates.notes) updates.notes = sanitizeString(updates.notes);
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const payload = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (updates.status) payload.status = updates.status;
      if (updates.customerName) payload.customer_name = updates.customerName;
      if (updates.customerPhone) payload.customer_phone = updates.customerPhone;
      if (updates.notes !== void 0) payload.notes = updates.notes;
      const { error } = await supabase.from("bookings").update(payload).or(`id.eq.${id},booking_code.eq.${id}`);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Update Booking Error]:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Update Booking Error]:", err);
    }
  }
  const updated = serverStore.updateBooking(id, updates, false);
  if (!updated) {
    return res.status(404).json({ error: "Data booking tidak ditemukan." });
  }
  res.json({ success: true, booking: updated });
});
bookingsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("bookings").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).or(`id.eq.${id},booking_code.eq.${id}`);
      if (error) console.error("[Supabase Delete Booking Error]:", error.message);
    } catch (err) {
      console.error("[Supabase Delete Booking Error]:", err);
    }
  }
  const removed = serverStore.deleteBooking(id, false);
  if (!removed) {
    return res.status(404).json({ error: "Data booking tidak ditemukan." });
  }
  res.json({ success: true, message: "Data reservasi berhasil dihapus." });
});
bookingsRouter.get("/track/:query", async (req, res) => {
  const query = sanitizeString(req.params.query).toLowerCase();
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("bookings").select("*").eq("is_deleted", false).or(`booking_code.ilike.%${query}%,customer_phone.ilike.%${query}%`);
      if (!error && data && data.length > 0) {
        const formatted = data.map((b) => ({
          id: b.id,
          bookingCode: b.booking_code,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          customerEmail: b.customer_email || void 0,
          serviceId: b.service_id || "srv-1",
          serviceName: b.service_name,
          servicePrice: Number(b.service_price) || 0,
          barberId: b.barber_id || "any",
          barberName: b.barber_name,
          date: b.date,
          timeSlot: b.time_slot,
          totalAmount: Number(b.total_amount) || 0,
          status: b.status || "pending",
          isWalkIn: b.is_walk_in || false,
          createdAt: b.created_at,
          updatedAt: b.updated_at || b.created_at
        }));
        return res.json(formatted);
      }
    } catch (err) {
      console.warn("[Supabase Track Booking Error]:", err);
    }
  }
  const bookings = serverStore.getBookings();
  const found = bookings.filter(
    (b) => b.bookingCode.toLowerCase() === query || b.customerPhone.replace(/[^0-9]/g, "") === query.replace(/[^0-9]/g, "")
  );
  if (found.length === 0) {
    return res.status(404).json({ error: "Tidak ditemukan reservasi dengan kode atau nomor tersebut." });
  }
  res.json(found);
});

// server/routes/transactions.ts
var import_express5 = require("express");
var transactionsRouter = (0, import_express5.Router)();
transactionsRouter.get("/", async (req, res) => {
  const { date, paymentMethod, search } = req.query;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (date) {
        query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
      }
      if (paymentMethod && paymentMethod !== "all") {
        query = query.eq("payment_method", String(paymentMethod));
      }
      if (search) {
        const q = String(search);
        query = query.or(`invoice_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,barber_name.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const formatted = data.map((t) => ({
          id: t.id,
          invoiceNumber: t.invoice_number,
          bookingId: t.booking_id || void 0,
          customerName: t.customer_name,
          customerPhone: t.customer_phone || void 0,
          barberId: t.barber_id || "barber-1",
          barberName: t.barber_name,
          items: Array.isArray(t.items) ? t.items : [],
          subtotal: Number(t.subtotal) || 0,
          discount: Number(t.discount) || 0,
          totalAmount: Number(t.total_amount) || 0,
          paymentMethod: t.payment_method || "cash",
          amountPaid: Number(t.amount_paid) || 0,
          changeAmount: Number(t.change_amount) || 0,
          notes: t.notes || void 0,
          createdAt: t.created_at
        }));
        return res.json(formatted);
      }
    } catch (err) {
      console.warn("[Supabase Transactions Error]:", err);
    }
  }
  let filtered = serverStore.getTransactions();
  if (date) {
    filtered = filtered.filter((t) => t.createdAt.startsWith(String(date)));
  }
  if (paymentMethod && paymentMethod !== "all") {
    filtered = filtered.filter((t) => t.paymentMethod === paymentMethod);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (t) => t.invoiceNumber.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.customerPhone && t.customerPhone.includes(q) || t.barberName.toLowerCase().includes(q)
    );
  }
  res.json(filtered);
});
transactionsRouter.post("/", async (req, res) => {
  const {
    bookingId,
    customerName,
    customerPhone,
    barberId,
    items,
    subtotal,
    discount,
    totalAmount,
    paymentMethod,
    amountPaid,
    changeAmount,
    notes
  } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Minimal pilih 1 layanan transaksi." });
  }
  let barberName = "Staff Barber";
  if (barberId) {
    const b = serverStore.getBarberById(barberId);
    if (b) barberName = b.name;
    else if (req.body.barberName) barberName = req.body.barberName;
  }
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const invoiceNumber = `TRX-${(/* @__PURE__ */ new Date()).getFullYear()}-${randomSuffix}`;
  const cleanCustomerName = sanitizeString(customerName) || "Tamu Umum (Walk-in)";
  const cleanCustomerPhone = customerPhone ? sanitizeString(customerPhone) : void 0;
  const cleanNotes = notes ? sanitizeString(notes) : void 0;
  const newTransaction = {
    id: `trx-${Date.now()}`,
    invoiceNumber,
    bookingId: bookingId ? sanitizeString(bookingId) : void 0,
    customerName: cleanCustomerName,
    customerPhone: cleanCustomerPhone,
    barberId: barberId || "barber-1",
    barberName,
    items,
    subtotal: Math.max(0, Number(subtotal) || Number(totalAmount)),
    discount: Math.max(0, Number(discount) || 0),
    totalAmount: Math.max(0, Number(totalAmount)),
    paymentMethod: paymentMethod || "cash",
    amountPaid: Math.max(0, Number(amountPaid) || Number(totalAmount)),
    changeAmount: Math.max(0, Number(changeAmount) || 0),
    notes: cleanNotes,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data: insData, error: insertError } = await supabase.from("transactions").insert({
        invoice_number: invoiceNumber,
        customer_name: cleanCustomerName,
        customer_phone: cleanCustomerPhone || null,
        barber_id: barberId && barberId.length > 20 ? barberId : null,
        barber_name: barberName,
        items: items || [],
        subtotal: newTransaction.subtotal,
        discount: newTransaction.discount,
        total_amount: newTransaction.totalAmount,
        payment_method: newTransaction.paymentMethod,
        payment_status: "paid",
        amount_paid: newTransaction.amountPaid,
        change_amount: newTransaction.changeAmount,
        notes: cleanNotes || null
      }).select().single();
      if (!insertError && insData) {
        newTransaction.id = insData.id;
        persistedToDatabase = true;
      } else {
        console.error("[Supabase Insert Transaction Error]:", insertError?.message);
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc("fn_create_pos_transaction", {
            p_invoice_number: invoiceNumber,
            p_booking_id: bookingId && bookingId.length > 20 ? bookingId : null,
            p_customer_name: cleanCustomerName,
            p_customer_phone: cleanCustomerPhone || null,
            p_barber_id: barberId && barberId.length > 20 ? barberId : null,
            p_barber_name: barberName,
            p_items: items,
            p_subtotal: newTransaction.subtotal,
            p_discount: newTransaction.discount,
            p_total_amount: newTransaction.totalAmount,
            p_payment_method: newTransaction.paymentMethod,
            p_amount_paid: newTransaction.amountPaid,
            p_change_amount: newTransaction.changeAmount,
            p_notes: cleanNotes || null
          });
          if (!rpcError && rpcData) {
            newTransaction.id = rpcData.id;
            newTransaction.invoiceNumber = rpcData.invoice_number || invoiceNumber;
            persistedToDatabase = true;
            await supabase.from("transactions").update({ items: items || [] }).eq("id", rpcData.id);
          }
        } catch {
        }
      }
    } catch (err) {
      console.error("[Supabase Insert Transaction Error]:", err);
    }
  }
  const created = serverStore.addTransaction(newTransaction, false);
  res.status(201).json({
    success: true,
    transaction: created,
    message: `Transaksi kasir ${newTransaction.invoiceNumber} berhasil disimpan.`
  });
});
transactionsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  let persistedToDatabase = false;
  const supabase = getServerSupabase();
  if (supabase && id.length > 20) {
    try {
      const { error } = await supabase.from("transactions").update({
        is_deleted: true,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      if (!error) {
        persistedToDatabase = true;
      } else {
        console.warn("[Supabase Soft Delete Transaction Error]:", error.message);
      }
    } catch (err) {
      console.warn("[Supabase Soft Delete Transaction Error]:", err);
    }
  }
  const deleted = serverStore.deleteTransaction(id, false);
  if (!deleted) {
    return res.status(404).json({ error: "Transaksi tidak ditemukan." });
  }
  res.json({ success: true, message: "Transaksi berhasil dihapus." });
});

// server/routes/ai.ts
var import_express6 = require("express");
var import_genai = require("@google/genai");
var aiRouter = (0, import_express6.Router)();
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new import_genai.GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Error initializing Gemini client:", err);
    return null;
  }
}
var fallbackRecommendations = {
  Oval: {
    recommendedStyleName: "The Classic Executive Side-Part & Low Skin Fade",
    reasoning: "Bentuk wajah Oval memiliki proporsi ideal dan seimbang. Side-part bertekstur dengan low fade mempertegas garis rahang tanpa membuat wajah terlihat terlalu lonjong.",
    stylingTips: [
      "Gunakan matte paste atau water-based pomade dengan kilau sedang saat rambut setengah kering.",
      "Sisir ke arah diagonal belakang (45 derajat) untuk memberi dimensi natural.",
      "Gunakan blow dryer suhu sedang untuk mengunci volume bagian atas."
    ],
    recommendedProduct: "High-Hold Matte Clay & Sea Salt Spray",
    recommendedService: "The Signature Gentleman Haircut",
    maintenanceSchedule: "Rapikan fade setiap 3 minggu sekali."
  },
  Square: {
    recommendedStyleName: "Modern Textured French Crop with Sharp Taper",
    reasoning: "Wajah Square memiliki rahang tegas yang sangat maskulin. Textured Crop di atas dengan taper fade samping melembutkan sudut dahi namun tetap menonjolkan kekuatan rahang Anda.",
    stylingTips: [
      "Tekan dan acak ringan bagian atas rambut dengan styling powder untuk hasil tekstur maksimal.",
      "Rapikan garis poni depan agar jatuh sejajar 1-2 cm di atas alis.",
      "Gunakan beard oil pada jenggot agar selaras dengan ketajaman garis rambut."
    ],
    recommendedProduct: "Volumizing Texture Dust & Matte Pomade",
    recommendedService: "The Executive Package (Cut, Shave & Scalp Spa)",
    maintenanceSchedule: "Kunjungi barber setiap 2.5 - 3 minggu."
  },
  Round: {
    recommendedStyleName: "High-Volume Pompadour with Mid Fade",
    reasoning: "Untuk wajah Round (bulat), gaya bertinggi vertikal seperti Pompadour atau Quiff menciptakan ilusi wajah lebih panjang dan ramping serta memberikan kesan tegas berkelas.",
    stylingTips: [
      "Keringkan rambut ke arah atas menggunakan round brush untuk mengangkat akar rambut.",
      "Aplikasikan pomade berdaya rekat tinggi mulai dari pangkal rambut ke ujung.",
      "Jaga sisi samping tetap pendek dan rapi agar siluet wajah tidak melebar."
    ],
    recommendedProduct: "Heavy Hold Water-Soluble Pomade",
    recommendedService: "The Signature Gentleman Haircut",
    maintenanceSchedule: "Potong rambut setiap 3 minggu."
  },
  Diamond: {
    recommendedStyleName: "Textured Scissor Quiff with Natural Taper",
    reasoning: "Wajah Diamond memiliki tulang pipi lebar dan dagu runcing. Scissor quiff bervolume natural memberikan keseimbangan sempurna pada dahi dan melembutkan transisi pipi.",
    stylingTips: [
      "Hindari memotong samping terlalu botak licin (skin fade tinggi). Pilih natural taper dengan gunting.",
      "Gunakan sea salt spray sebelum blow-dry untuk gelombang alami.",
      "Grooming jenggot tipis di dagu untuk menambah ketebalan rahang bawah."
    ],
    recommendedProduct: "Sea Salt Texture Spray & Medium Cream Paste",
    recommendedService: "The Signature Gentleman Haircut",
    maintenanceSchedule: "Perawatan setiap 3-4 minggu."
  },
  Heart: {
    recommendedStyleName: "Medium Length Slicked Back Undercut",
    reasoning: "Bentuk wajah Heart memiliki dahi lebar dan dagu lancip. Slicked back bervolume seimbang memberikan proporsi simetris yang menawan dan elegan.",
    stylingTips: [
      "Sisir rambut ke belakang dengan gigi sisir renggang.",
      "Kombinasikan dengan jenggot rapi untuk menyeimbangkan area dagu."
    ],
    recommendedProduct: "Classic Shine Pomade & Nourishing Beard Balm",
    recommendedService: "Royal Shave & Hot Towel Treatment",
    maintenanceSchedule: "Rapikan setiap 3 minggu."
  }
};
aiRouter.post("/", rateLimiter(20, 6e4), async (req, res) => {
  const { faceShape, hairTexture, lifestyle, desiredLength, beardPreference, notes } = req.body;
  const cleanFaceShape = sanitizeString(faceShape) || "Oval";
  const cleanHairTexture = sanitizeString(hairTexture) || "Lurus / Bergelombang";
  const cleanLifestyle = sanitizeString(lifestyle) || "Profesional Eksekutif";
  const cleanLength = sanitizeString(desiredLength) || "Sedang / Rapi";
  const cleanBeard = sanitizeString(beardPreference) || "Rapi & Terawat";
  const cleanNotes = notes ? sanitizeString(notes) : "Tidak ada";
  const client = getGenAIClient();
  if (!client) {
    const defaultResp = fallbackRecommendations[cleanFaceShape] || fallbackRecommendations["Oval"];
    return res.json({
      ...defaultResp,
      isAiPowered: false,
      source: "Curated Master Barber Heuristic Logic"
    });
  }
  try {
    const prompt = `Anda adalah Master Barber & Style Director berpengalaman 15 tahun di barbershop "Elegant Barbershop Solok".
Berikan rekomendasi potongan rambut pria dan perawatan spesifik paling tepat berdasarkan profil pelanggan berikut:
- Bentuk Wajah: ${cleanFaceShape}
- Tekstur Rambut: ${cleanHairTexture}
- Aktivitas / Gaya Hidup: ${cleanLifestyle}
- Preferensi Panjang: ${cleanLength}
- Preferensi Jenggot / Kumis: ${cleanBeard}
- Catatan Khusus: ${cleanNotes}

Balas HANYA dalam format JSON yang valid (tanpa markdown blok tambahan) dengan struktur berikut:
{
  "recommendedStyleName": "Nama gaya rambut (e.g. Modern Textured Taper Fade)",
  "reasoning": "Penjelasan mengapa gaya ini sangat pas dengan bentuk wajah dan karakter dalam 2-3 kalimat dalam bahasa Indonesia",
  "stylingTips": [
    "Tip styling langkah 1",
    "Tip styling langkah 2",
    "Tip styling langkah 3"
  ],
  "recommendedProduct": "Produk grooming yang tepat",
  "recommendedService": "Nama layanan yang direkomendasikan",
  "maintenanceSchedule": "Rekomendasi jadwal pangkas kembali"
}`;
    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({
        ...parsed,
        isAiPowered: true,
        source: "Gemini 3.7 Flash AI Model"
      });
    }
    throw new Error("Empty response from Gemini");
  } catch (err) {
    console.warn("AI Consultant fallback due to:", err);
    const defaultResp = fallbackRecommendations[cleanFaceShape] || fallbackRecommendations["Oval"];
    return res.json({
      ...defaultResp,
      isAiPowered: false,
      source: "Master Barber Knowledge Base (Fallback)"
    });
  }
});

// server/routes/blueprints.ts
var import_express7 = require("express");
var blueprintsRouter = (0, import_express7.Router)();
blueprintsRouter.get("/database/status", async (_req, res) => {
  const status = await checkServerSupabaseStatus();
  res.json(status);
});
blueprintsRouter.get("/database-schema", (_req, res) => {
  res.json(DATABASE_SCHEMA_BLUEPRINT);
});
blueprintsRouter.get("/sitemap", (_req, res) => {
  res.json(SITEMAP_WORKFLOW_BLUEPRINT);
});

// server/routes/auth.ts
var import_express8 = require("express");
var authRouter = (0, import_express8.Router)();
authRouter.post("/login", async (req, res) => {
  try {
    const username = sanitizeString(req.body?.username);
    const password = sanitizeString(req.body?.password);
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({
        error: `Database Supabase belum terkonfigurasi di server (${supabaseConfig.diagnose().join("; ")}).`
      });
    }
    const { data: user, error } = await supabase.from("admin_users").select("id, username, display_name, role, is_active").eq("username", username).eq("password_hash", password).eq("is_active", true).single();
    if (error) {
      console.warn("[Auth] Query error:", error.message);
      return res.status(401).json({ error: "Username atau password salah." });
    }
    if (!user) {
      return res.status(401).json({ error: "Username atau password salah." });
    }
    supabase.from("admin_users").update({ last_login: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", user.id).then(() => {
    }, () => {
    });
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error("[Auth Login Error]:", err?.message || err);
    return res.status(500).json({ error: "Terjadi kesalahan internal saat autentikasi." });
  }
});
authRouter.get("/verify", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ valid: false });
    }
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({ valid: false, error: "Database tidak tersedia." });
    }
    const { data: user, error } = await supabase.from("admin_users").select("id, username, display_name, role, is_active").eq("id", userId).eq("is_active", true).single();
    if (error || !user) {
      return res.status(401).json({ valid: false });
    }
    return res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error("[Auth Verify Error]:", err?.message || err);
    return res.status(500).json({ valid: false });
  }
});
authRouter.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Berhasil logout." });
});

// server/app.ts
function createApp() {
  const app2 = (0, import_express9.default)();
  app2.disable("x-powered-by");
  app2.use(securityHeadersMiddleware);
  app2.use(import_express9.default.json({ limit: "1mb" }));
  app2.use(import_express9.default.urlencoded({ extended: true, limit: "1mb" }));
  app2.get("/api/health", (_req, res) => {
    const settings = serverStore.getSettings();
    res.json({
      status: "ok",
      shop: settings.shopName,
      bookingOpen: settings.isBookingOpen,
      env: serverConfig.nodeEnv,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.use("/api/settings", settingsRouter);
  app2.use("/api/services", servicesRouter);
  app2.use("/api/barbers", barbersRouter);
  app2.use("/api/bookings", bookingsRouter);
  app2.use("/api/transactions", transactionsRouter);
  app2.use("/api/ai-consultant", aiRouter);
  app2.use("/api/auth", authRouter);
  app2.use("/api", blueprintsRouter);
  app2.use("/api", (_req, res) => {
    res.status(404).json({ error: "Endpoint tidak ditemukan." });
  });
  app2.use(
    "/api",
    (err, _req, res, _next) => {
      console.error("[API Error]:", err);
      res.status(500).json({
        error: "Terjadi kesalahan pada server.",
        message: serverConfig.isProduction ? "Internal server error" : err.message
      });
    }
  );
  return app2;
}

// server/apiEntry.ts
var app = createApp();
function handler(req, res) {
  return app(req, res);
}
