# System Architecture Document

## Project: Elegant Barbershop Solok - Smart POS & Digital Booking System

---

## 1. High-Level Architecture Overview

Aplikasi dibangun dengan pola **Full-Stack Modular Architecture** yang menggabungkan antarmuka modern berbasis React 19 (Vite + Tailwind CSS) dan backend server Node.js Express yang menangani API routes, rate limiting, sanitasi data, serta integrasi server-side Google GenAI (Gemini 3.7 Flash).

```
+-----------------------------------------------------------------------+
|                            CLIENT BROWSER                             |
|                                                                       |
|  +------------------------+  +------------------+  +---------------+  |
|  | Public Landing & Price |  | AI Consultant UI |  | Admin POS Tab |  |
|  +------------------------+  +------------------+  +---------------+  |
|               |                        |                   |          |
|               +------------------------+-------------------+          |
|                                        |                              |
|                              [ Service Facade / API ]                 |
|                                        |                              |
+----------------------------------------|------------------------------+
                                         | HTTP / REST (Fetch API)
                                         v
+-----------------------------------------------------------------------+
|                         NODE.JS EXPRESS SERVER                        |
|                                                                       |
|  [ Security Headers ] -> [ Rate Limiter ] -> [ Input Sanitizer ]      |
|                                                                       |
|  +------------------+  +------------------+  +---------------------+  |
|  | /api/settings    |  | /api/services    |  | /api/barbers        |  |
|  +------------------+  +------------------+  +---------------------+  |
|  +------------------+  +------------------+  +---------------------+  |
|  | /api/bookings    |  | /api/transactions|  | /api/ai-consultant  |  |
|  +------------------+  +------------------+  +---------------------+  |
|                                                        |              |
|                                                        v              |
|                                              [ Google GenAI SDK ]     |
|                                             (Gemini 3.7 Flash Model)  |
+-----------------------------------------------------------------------+
```

---

## 2. Directory Structure & Module Breakdown

```
elegant-barbershop/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI Workflow
├── server/                      # Modular Backend API Layer
│   ├── middleware/
│   │   └── security.ts          # Security headers, rate limiting, & input sanitization
│   ├── routes/
│   │   ├── ai.ts                # Gemini 3.7 Flash AI Consultant endpoint
│   │   ├── barbers.ts           # Barbers management API
│   │   ├── blueprints.ts        # Database schema & sitemap endpoints
│   │   ├── bookings.ts          # Reservation & tracking API
│   │   ├── services.ts          # Pricing & catalog management API
│   │   ├── settings.ts          # Master switch & system configuration API
│   │   └── transactions.ts      # POS checkout & revenue history API
│   └── state.ts                 # Central in-memory state store with CRUD logic
├── src/                         # Frontend React SPA
│   ├── assets/                  # High-definition images & brand visual assets
│   ├── components/              # Modular UI Components
│   │   ├── admin/               # Admin Portal & POS Sub-components
│   │   │   ├── modals/          # Dialog modals (TransactionModal, ServiceFormModal, etc.)
│   │   │   ├── tabs/            # Admin view tabs (TransactionsTab, MasterSwitchTab, etc.)
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── AdminNavbar.tsx
│   │   ├── BarbersSection.tsx   # Team showcase
│   │   ├── BookingSection.tsx   # AI Consultant & Reservation form
│   │   ├── BookingTicketModal.tsx # Booking ticket viewer
│   │   ├── Footer.tsx           # Footer, map embed & developer credits
│   │   ├── HeroSection.tsx      # Main brand banner & call to actions
│   │   ├── LocationSection.tsx  # Map, live hours, address
│   │   ├── Navbar.tsx           # Top responsive navigation
│   │   ├── ReviewsSection.tsx   # Customer testimonials
│   │   └── ServicesSection.tsx  # Interactive price list & category filter
│   ├── data/
│   │   └── initialData.ts       # Base data seeds, mock presets, blueprints
│   ├── hooks/
│   │   └── useBarbershopData.ts # Custom React hook for centralized reactive data
│   ├── services/                # Modular Frontend Service Layer
│   │   ├── aiService.ts
│   │   ├── barbersService.ts
│   │   ├── blueprintService.ts
│   │   ├── bookingsService.ts
│   │   ├── servicesService.ts
│   │   ├── settingsService.ts
│   │   ├── storage.ts           # LocalStorage fallback engine
│   │   ├── transactionsService.ts
│   │   └── api.ts               # Unified API Facade
│   ├── types.ts                 # TypeScript interfaces & domain models
│   ├── utils/
│   │   └── formatters.ts        # Currency (IDR), phone, date format utilities
│   ├── App.tsx                  # Root application controller
│   ├── index.css                # Tailwind CSS v4 entry point
│   └── main.tsx                 # React DOM mount point
├── .env.example                 # Environment variables blueprint
├── ARCHITECTURE.md              # System Architecture Document
├── package.json                 # Project dependencies & scripts
├── PRD.md                       # Product Requirements Document
├── README.md                    # Project overview & Developer Setup
├── server.ts                    # Backend entry point (Express + Vite Middleware)
├── tsconfig.json                # TypeScript compiler configuration
├── vercel.json                  # Vercel deployment configuration
└── vite.config.ts               # Vite build pipeline configuration
```

---

## 3. Data Flow & State Management

### 3.1 Dual-Tier Resilience Pattern
Aplikasi menggunakan pola ketahanan ganda (*dual-tier persistence resilience*):
1. **Primary Layer (Server REST API)**: Klien melakukan `fetch()` ke endpoint Express `/api/*`. Data tersinkronisasi di server state store.
2. **Fallback Layer (Client Local Storage)**: Jika server sedang *cold-start*, offline, atau diakses di lingkungan serverless murni, `services/*` secara otomatis membaca dan menulis ke `localStorage` melalui `storage.ts`. Pengguna tidak akan pernah menemui layar blank atau error fatal.

### 3.2 AI Consultant Interaction Flow
1. Pengguna mengisi form preferensi gaya rambut di `BookingSection.tsx`.
2. Request dikirim ke `POST /api/ai-consultant`.
3. Route `ai.ts` memanggil model `@google/genai` (`gemini-3.7-flash`) dengan prompt persona Master Barber terstruktur dan `responseMimeType: 'application/json'`.
4. Jika API key tidak ada atau kuota habis, router langsung mengembalikan *curated master barber heuristic fallback* berdasarkan bentuk wajah pengguna dalam hitungan milidetik.

---

## 4. Security Design & Policies

- **Server-Side API Key Protection**: Kunci `GEMINI_API_KEY` dikelola murni pada environment server (`process.env.GEMINI_API_KEY`) dan tidak pernah diinjeksi ke frontend bundle (`import.meta.env`).
- **Input Sanitization**: Seluruh string input pengguna pada nama, telepon, catatan, dan nama layanan disanitasi dari karakter tag HTML (`<`, `>`) untuk menolak upaya XSS.
- **In-Memory Rate Limiting**: Endpoint publik seperti pembuatan reservasi dan konsultasi AI dilindungi dengan batas wajar (misal: 30 request/menit per IP) untuk mencegah DoS/bot spam.
- **Security Headers**: Middleware otomatis menambahkan `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, dan `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 5. Deployment Strategies

### 5.1 Docker / Cloud Run / VPS (Recommended for Full-Stack)
- **Build**: `npm run build` (Menghasilkan frontend statis di `dist/` dan server terbundle di `dist/server.cjs` via `esbuild`).
- **Start**: `node dist/server.cjs` (Menjalankan server pada port `3000`).

### 5.2 Vercel / Netlify (Serverless / Static Deployments)
- Konfigurasi `vercel.json` disediakan dengan route rewrites ke `index.html` (SPA fallback) dan caching header untuk aset statis.
