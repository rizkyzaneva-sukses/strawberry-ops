# 🍓 StrawberryOps — Sistem Manajemen Kebun Stroberi

Dashboard real-time untuk mengelola gaji karyawan, pengeluaran operasional, pendapatan panen, dan inventaris kebun strawberry.

## Quick Start

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm atau yarn

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Buat database & push schema
npx prisma db push

# 4. Seed data awal (admin + kategori + sample data)
npx tsx prisma/seed.ts

# 5. Jalankan development server
npm run dev
```

Buka browser: **http://localhost:3000**

### Login Default
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

## Fitur

### MVP (v1)
- **Dashboard** — Ringkasan keuangan real-time, tren pendapatan vs pengeluaran
- **Rekap Gaji** — Input kehadiran karyawan, auto-kalkulasi durasi & upah
- **Pengeluaran** — Input pengeluaran operasional + upload bukti transaksi
- **Pendapatan Panen** — Input hasil panen, auto-kalkulasi BS%, pendapatan
- **Database Karyawan** — CRUD karyawan dengan tipe upah (Harian/Per Jam/Borongan)
- **Manajemen User** — Role: Owner, Manager, Staff
- **Filter & Sort** — Multi-variabel, auto-chart, akumulasi

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Frontend:** React 19, Tailwind CSS v4
- **Charts:** Recharts
- **ORM:** Prisma + SQLite
- **Auth:** iron-session (cookie-based, 7 hari)
- **UI:** Dark theme (green-navy agricultural)

## Struktur Project

```
src/
├── app/
│   ├── (dashboard)/          # Dashboard layout group
│   │   ├── page.tsx          # Dashboard utama
│   │   ├── gaji/page.tsx     # Rekap gaji
│   │   ├── pengeluaran/      # Pengeluaran
│   │   ├── pendapatan/       # Pendapatan panen
│   │   ├── karyawan/         # Database karyawan
│   │   └── pengaturan/       # Settings (users, bank, harga)
│   ├── api/                  # API Routes
│   │   ├── auth/             # Login, logout, me
│   │   ├── employees/        # CRUD karyawan
│   │   ├── payroll-records/  # CRUD gaji
│   │   ├── expenses/         # CRUD pengeluaran
│   │   ├── harvest-revenues/ # CRUD panen
│   │   ├── dashboard/        # Aggregated stats
│   │   ├── bank-accounts/    # CRUD rekening
│   │   └── commodity-prices/ # Harga komoditas
│   ├── login/page.tsx        # Halaman login
│   └── globals.css           # Tailwind + custom styles
├── components/
│   ├── charts/               # TrendChart
│   ├── layout/               # Sidebar, BottomNav, Header, DashboardLayout
│   └── ui/                   # DataTable, Modal, StatCard, dll.
└── lib/
    ├── api-utils.ts          # Auth helpers, JSON response
    ├── prisma.ts             # Prisma client singleton
    ├── session.ts            # iron-session config
    └── utils.ts              # formatIDR, calculateWage, dll.
```

## Konfigurasi

### Environment Variables (`.env`)
```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-key-min-32-characters-long!"
```

### Currency
- Format: IDR integer, `Rp 1.500.000`
- Timezone: Asia/Jakarta (WIB)

### Soft Delete
Data tidak dihapus permanen. Semua tabel menggunakan `deleted_at` field.

## Deploy ke VPS

```bash
# Build untuk production
npm run build

# Jalankan
npm start

# Atau gunakan PM2
pm2 start npm --name "strawberry-ops" -- start
```

Untuk deploy dengan EasyPanel, push ke GitHub lalu connect ke EasyPanel.

## License

Private — Untuk penggunaan internal kebun strawberry.
