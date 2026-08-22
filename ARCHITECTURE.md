# System Architecture Document

## Project: Elegant Barbershop Solok - Smart POS & Digital Booking System

---

## 1. High-Level Architecture Overview

Aplikasi dibangun dengan pola **Full-Stack Modular Architecture** yang menggabungkan antarmuka modern berbasis React 19 (Next.js App Router + Tailwind CSS) dengan REST API route handlers bawaan Next.js yang menangani API routes, rate limiting, sanitasi data, serta integrasi server-side Google GenAI (Gemini).

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
|                         NEXT.JS ROUTE HANDLERS                        |
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
│   ├── App.tsx                  # Root application controller (landing page)
│   └── index.css                # Tailwind CSS v4 entry point
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout: SEO metadata, font, JSON-LD
│   ├── page.tsx                 # Landing page entry (renders src/App.tsx)
│   └── api/                     # REST API route handlers (auth, barbers, bookings,
│                                #   services, transactions, settings, ai-consultant)
├── server/                      # Shared domain logic (state store, Supabase client)
├── lib/api.ts                   # Helper route handler (sanitasi, rate limit, JSON)
├── .env.example                 # Environment variables blueprint
├── ARCHITECTURE.md              # System Architecture Document
├── next.config.ts               # Next.js configuration
├── package.json                 # Project dependencies & scripts
├── PRD.md                       # Product Requirements Document
├── README.md                    # Project overview & Developer Setup
├── tsconfig.json                # TypeScript compiler configuration
└── vercel.json                  # Vercel security headers & cache configuration
```

---

## 3. Data Flow & State Management

### 3.1 Dual-Tier Resilience Pattern
Aplikasi menggunakan pola ketahanan ganda (*dual-tier persistence resilience*):
1. **Primary Layer (Server REST API)**: Klien melakukan `fetch()` ke endpoint `/api/*` (Next.js Route Handlers). Data tersinkronisasi di server state store.
2. **Fallback Layer (Client Local Storage)**: Jika server sedang *cold-start*, offline, atau diakses di lingkungan serverless murni, `services/*` secara otomatis membaca dan menulis ke `localStorage` melalui `storage.ts`. Pengguna tidak akan pernah menemui layar blank atau error fatal.

### 3.2 AI Consultant Interaction Flow
1. Pengguna mengisi form preferensi gaya rambut di `BookingSection.tsx`.
2. Request dikirim ke `POST /api/ai-consultant`.
3. Route `ai.ts` memanggil model `@google/genai` (`gemini-3.7-flash`) dengan prompt persona Master Barber terstruktur dan `responseMimeType: 'application/json'`.
4. Jika API key tidak ada atau kuota habis, router langsung mengembalikan *curated master barber heuristic fallback* berdasarkan bentuk wajah pengguna dalam hitungan milidetik.

---

## 4. Security Design & Policies

- **Server-Side API Key Protection**: Kunci `GEMINI_API_KEY` dikelola murni pada environment server (`process.env.GEMINI_API_KEY`) dan tidak pernah diinjeksi ke frontend bundle.
- **Input Sanitization**: Seluruh string input pengguna pada nama, telepon, catatan, dan nama layanan disanitasi dari karakter tag HTML (`<`, `>`) untuk menolak upaya XSS.
- **In-Memory Rate Limiting**: Endpoint publik seperti pembuatan reservasi dan konsultasi AI dilindungi dengan batas wajar (misal: 30 request/menit per IP) untuk mencegah DoS/bot spam.
- **Security Headers**: Middleware otomatis menambahkan `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, dan `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 5. Deployment Strategies

### 5.1 Docker / Cloud Run / VPS (Recommended for Full-Stack)
- **Build**: `npm run build` (Menghasilkan build produksi Next.js di `.next/`).
- **Start**: `npm start` (Menjalankan server pada port `3000`).

### 5.2 Vercel (Serverless / Static Deployment)
- Framework terdeteksi otomatis sebagai **Next.js** — tidak perlu konfigurasi tambahan. `vercel.json` hanya menyediakan security headers & cache-control untuk aset statis.
- Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, opsional `GEMINI_API_KEY`) dikonfigurasi melalui dashboard Vercel.
