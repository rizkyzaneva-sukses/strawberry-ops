# Workflow Operasional StrawberryOps

> Panduan alur kerja harian, mingguan, dan bulanan untuk tim kebun stroberi

---

## Daftar Isi

1. [Alur Kerja Harian](#1-alur-kerja-harian)
2. [Alur Kerja Mingguan](#2-alur-kerja-mingguan)
3. [Alur Kerja Bulanan](#3-alur-kerja-bulanan)
4. [Alur Per Role](#4-alur-per-role)
5. [Alur Input Data](#5-alur-input-data)
6. [Alur Laporan & Export](#6-alur-laporan--export)
7. [Alur Lupa Password](#7-alur-lupa-password)
8. [Checklist Harian](#8-checklist-harian)

---

## 1. Alur Kerja Harian

### Pagi (Sebelum Kerja)

```
┌─────────────────────────────────────────────────────────────┐
│                     LOGIN KE SISTEM                          │
│                     ┌───────────┐                            │
│                     │  /login   │                            │
│                     └─────┬─────┘                            │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │  DASHBOARD  │                           │
│                    │  Cek data   │                           │
│                    │  kemarin    │                           │
│                    └──────┬──────┘                           │
│                           │                                  │
│              ┌────────────┼────────────┐                    │
│              │            │            │                    │
│       ┌──────▼──────┐ ┌──▼───┐ ┌─────▼──────┐             │
│       │ Cek harga   │ │ Cek  │ │ Cek stok   │             │
│       │ komoditas   │ │ gaji │ │ pengeluaran│             │
│       └─────────────┘ └──────┘ └────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Siang (Saat Kerja)

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT DATA HARIAN                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. KERJA SELESAI → Input Rekap Gaji                  │    │
│  │    - Pilih karyawan                                   │    │
│  │    - Isi jam masuk & keluar                           │    │
│  │    - Sistem hitung upah otomatis                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 2. ADA BELANJA → Input Pengeluaran                   │    │
│  │    - Pilih kategori (Pupuk, Alat, dll)               │    │
│  │    - Isi jumlah                                       │    │
│  │    - Upload bukti transfer/kwitansi                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 3. PANEN SELESAI → Input Pendapatan Panen            │    │
│  │    - Isi total kg & berat BS                          │    │
│  │    - Harga otomatis dari pengaturan                   │    │
│  │    - Sistem hitung pendapatan otomatis                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Sore (Review)

```
┌─────────────────────────────────────────────────────────────┐
│                     REVIEW HARIAN                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Buka Dashboard                                     │    │
│  │ 2. Pastikan data hari ini sudah masuk                 │    │
│  │ 3. Cek apakah ada BS% > 20% (perlu perhatian)        │    │
│  │ 4. Cek margin (apakah hari ini untung/rugi?)         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Alur Kerja Mingguan

```
┌─────────────────────────────────────────────────────────────┐
│                    REVIEW MINGGUAN                           │
│                                                              │
│  Senin (atau awal minggu):                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Buka Dashboard → Filter "7 Hari"                   │    │
│  │ 2. Bandingkan pendapatan vs pengeluaran minggu lalu   │    │
│  │ 3. Cek tren BS% (apakah naik/turun?)                  │    │
│  │ 4. Review pengeluaran terbesar minggu ini             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Jika ada perubahan harga:                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Pengaturan → Harga Komoditas → Tambah Harga Baru      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Export laporan mingguan:                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Rekap Gaji → set filter tanggal → Export CSV       │    │
│  │ 2. Pengeluaran → set filter tanggal → Export CSV      │    │
│  │ 3. Pendapatan → set filter tanggal → Export CSV       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Alur Kerja Bulanan

```
┌─────────────────────────────────────────────────────────────┐
│                    REVIEW BULANAN                            │
│                                                              │
│  Awal bulan (tgl 1):                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Dashboard → Filter "1 Tahun" → cek tren bulanan    │    │
│  │ 2. Export semua laporan bulan lalu (CSV)              │    │
│  │ 3. Review total gaji bulan lalu                       │    │
│  │ 4. Review total pengeluaran bulan lalu                │    │
│  │ 5. Review total pendapatan panen bulan lalu           │    │
│  │ 6. Hitung margin bersih                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Jika ada karyawan baru:                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Karyawan → Tambah Karyawan → isi data lengkap         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Jika ada perubahan harga komoditas:                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Pengaturan → Harga Komoditas → Tambah Harga Baru      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Review log aktivitas (OWNER):                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Pengaturan → Log Aktivitas → filter bulan lalu        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Alur Per Role

### OWNER (Pemilik Kebun)

```
┌─────────────────────────────────────────────────────────────┐
│                       ALUR OWNER                             │
│                                                              │
│  Setup Awal:                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Login (admin/admin123)                             │    │
│  │ 2. Ganti password admin                               │    │
│  │ 3. Tambah user MANAGER (jika ada)                     │    │
│  │ 4. Tambah user STAFF (jika ada)                       │    │
│  │ 5. Tambah rekening bank                               │    │
│  │ 6. Update harga komoditas jika berbeda                │    │
│  │ 7. Tambah data karyawan                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Rutin:                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ - Cek Dashboard (ringkasan keuangan)                  │    │
│  │ - Review log aktivitas (audit trail)                  │    │
│  │ - Export laporan bulanan                              │    │
│  │ - Kelola user jika ada perubahan                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### MANAGER (Kepala Kebun)

```
┌─────────────────────────────────────────────────────────────┐
│                      ALUR MANAGER                            │
│                                                              │
│  Harian:                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Cek Dashboard                                      │    │
│  │ 2. Input gaji karyawan                                │    │
│  │ 3. Input pengeluaran (jika ada)                       │    │
│  │ 4. Input data panen                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Mingguan:                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ - Review pengeluaran minggu ini                       │    │
│  │ - Export laporan mingguan                             │    │
│  │ - Update harga komoditas jika ada perubahan           │    │
│  │ - Tambah/edit rekening bank jika perlu                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### STAFF (Pekerja)

```
┌─────────────────────────────────────────────────────────────┐
│                       ALUR STAFF                             │
│                                                              │
│  Harian:                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Login                                              │    │
│  │ 2. Input gaji karyawan (termasuk diri sendiri)        │    │
│  │ 3. Input pengeluaran (jika ada belanja)               │    │
│  │ 4. Input data panen                                   │    │
│  │ 5. Cek Dashboard untuk review                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Yang TIDAK BISA dilakukan:                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ - Akses menu Pengaturan                               │    │
│  │ - Kelola user lain                                    │    │
│  │ - Lihat log aktivitas                                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Alur Input Data

### Input Karyawan Baru

```
Karyawan → Tambah Karyawan
  │
  ├── Nama Lengkap (WAJIB)
  ├── Telepon (opsional, format: 08xxx)
  ├── Alamat (opsional)
  ├── Tipe Upah (WAJIB):
  │   ├── Harian → Tarif per hari
  │   ├── Per Jam → Tarif per jam + minimum jam
  │   └── Borongan → Tarif per borongan
  ├── Tarif Upah dalam Rupiah (WAJIB)
  ├── Minimum Jam (hanya Per Jam)
  └── Tanggal Mulai (default: hari ini)
```

### Input Gaji

```
Rekap Gaji → Input Gaji
  │
  ├── Pilih Karyawan (WAJIB) → tampilkan info tipe & tarif
  ├── Tanggal Kerja (WAJIB)
  ├── Area Kerja (opsional, misal: "Blok A")
  ├── Jam Masuk (opsional, format: HH:MM)
  ├── Jam Keluar (opsional, format: HH:MM)
  └── Catatan (opsional)

  Perhitungan otomatis:
  ├── HARIAN: upah = tarif (flat)
  ├── PER_JAM: upah = tarif × max(jam, minimum_jam)
  └── BORONGAN: upah = tarif (flat)
```

### Input Pengeluaran

```
Pengeluaran → Input Pengeluaran
  │
  ├── Tanggal Transaksi (WAJIB)
  ├── Kategori (WAJIB):
  │   ├── Gaji
  │   ├── Pupuk & Obat
  │   ├── Alat & Perlengkapan
  │   ├── Transportasi
  │   ├── Sewa
  │   ├── Utilitas
  │   └── Lainnya
  ├── Deskripsi (opsional)
  ├── Jumlah Rupiah (WAJIB)
  ├── Sumber Dana (opsional → pilih rekening bank)
  ├── Rekening Penerima (opsional)
  ├── Bukti Transfer (opsional → upload file)
  └── Bukti Kwitansi (opsional → upload file)
```

### Input Pendapatan Panen

```
Pendapatan Panen → Input Panen
  │
  ├── Tanggal Panen (WAJIB)
  ├── Area Kerja (opsional, misal: "Blok A")
  ├── Harga Normal/kg (WAJIB, otomatis dari pengaturan)
  ├── Harga BS/kg (WAJIB, otomatis dari pengaturan)
  ├── Total Panen kg (WAJIB)
  ├── Berat BS kg (default: 0)
  └── Catatan (opsional)

  Perhitungan otomatis:
  ├── Normal kg = Total - BS
  ├── Pendapatan Normal = Normal kg × Harga Normal
  ├── Pendapatan BS = BS kg × Harga BS
  ├── Total Pendapatan = Normal + BS
  └── BS % = (BS / Total) × 100 → warnai merah jika > 20%
```

---

## 6. Alur Laporan & Export

```
┌─────────────────────────────────────────────────────────────┐
│                     ALUR EXPORT LAPORAN                      │
│                                                              │
│  1. Buka halaman yang ingin di-export:                       │
│     - Rekap Gaji → untuk laporan gaji                        │
│     - Pengeluaran → untuk laporan pengeluaran                │
│     - Pendapatan Panen → untuk laporan panen                 │
│                                                              │
│  2. Set filter tanggal (Dari - Sampai)                       │
│                                                              │
│  3. Klik tombol "Export CSV"                                 │
│                                                              │
│  4. File CSV otomatis terdownload                            │
│                                                              │
│  5. Buka di Excel / Google Sheets untuk analisis             │
│                                                              │
│  Catatan:                                                    │
│  - Export mengikuti filter tanggal yang aktif                │
│  - Jika tidak ada filter, export semua data                  │
│  - Format CSV dengan BOM untuk kompatibilitas Excel          │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Alur Lupa Password

```
┌─────────────────────────────────────────────────────────────┐
│                    ALUR LUPA PASSWORD                        │
│                                                              │
│  ┌─────────┐     ┌──────────┐     ┌──────────────┐         │
│  │  Login  │────▶│  Klik    │────▶│ Masukkan     │         │
│  │  Page   │     │  "Lupa   │     │ Username     │         │
│  └─────────┘     │ Password"│     └──────┬───────┘         │
│                  └──────────┘            │                  │
│                                         ▼                  │
│                                  ┌──────────────┐          │
│                                  │ Klik "Kirim  │          │
│                                  │ Kode OTP"    │          │
│                                  └──────┬───────┘          │
│                                         │                  │
│                                         ▼                  │
│                              ┌────────────────────┐        │
│                              │ OTP dikirim via    │        │
│                              │ WhatsApp (6 digit) │        │
│                              └──────────┬─────────┘        │
│                                         │                  │
│                                         ▼                  │
│                              ┌────────────────────┐        │
│                              │ Masukkan:          │        │
│                              │ - Kode OTP         │        │
│                              │ - Password Baru    │        │
│                              │ - Konfirmasi       │        │
│                              └──────────┬─────────┘        │
│                                         │                  │
│                                         ▼                  │
│                              ┌────────────────────┐        │
│                              │ Klik "Reset        │        │
│                              │ Password"          │        │
│                              └──────────┬─────────┘        │
│                                         │                  │
│                                         ▼                  │
│                              ┌────────────────────┐        │
│                              │ Password berhasil  │        │
│                              │ direset. Login     │        │
│                              │ dengan password    │        │
│                              │ baru.              │        │
│                              └────────────────────┘        │
│                                                              │
│  Syarat:                                                     │
│  - User harus punya nomor HP terdaftar                       │
│  - WAHA API harus aktif                                      │
│  - OTP berlaku 10 menit                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Checklist Harian

Print checklist ini untuk tim:

```
┌─────────────────────────────────────────────────────────────┐
│                 CHECKLIST HARIAN KEBUN STROBERI              │
│                 Tanggal: _______________                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PAGI:                                                       │
│  [ ] Login ke sistem                                         │
│  [ ] Cek Dashboard (ringkasan kemarin)                       │
│  [ ] Pastikan harga komoditas benar                          │
│                                                              │
│  SIANG/SORE:                                                 │
│  [ ] Input gaji karyawan yang masuk hari ini                 │
│      Nama: _________________ Upah: Rp ___________            │
│                                                              │
│  [ ] Input pengeluaran (jika ada)                            │
│      Kategori: _____________ Jumlah: Rp ___________          │
│      Bukti transfer: [ ] Sudah upload                        │
│                                                              │
│  [ ] Input data panen (jika ada)                             │
│      Total: _______ kg | BS: _______ kg | BS%: _______      │
│      Pendapatan: Rp ________________                         │
│                                                              │
│  SORE:                                                       │
│  [ ] Cek Dashboard → review data hari ini                    │
│  [ ] Pastikan semua data sudah masuk                         │
│                                                              │
│  Catatan:                                                    │
│  ___________________________________________________________│
│  ___________________________________________________________│
│  ___________________________________________________________│
│                                                              │
│  Input oleh: _________________                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Konfigurasi Teknis (Untuk Admin)

### Environment Variables (.env)

| Variable | Fungsi | Contoh |
|----------|--------|--------|
| `DATABASE_URL` | Lokasi database SQLite | `file:./dev.db` |
| `SESSION_SECRET` | Secret untuk enkripsi session (min 32 char) | `strawberry-ops-super-secret-...` |
| `WAHA_API_URL` | URL WhatsApp API (WAHA) | `http://localhost:3000` |

### Menjalankan Aplikasi

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Seed data awal (hanya pertama kali)
npx tsx prisma/seed.ts

# Jalankan aplikasi
npm run dev
```

### Backup Database

```bash
# Copy file database secara berkala
copy prisma\dev.db prisma\dev.db.backup.2026-07-24
```

### Reset Database (HATI-HATI!)

```bash
# Ini akan HAPUS SEMUA DATA dan kembali ke data awal
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

---

*Terakhir diperbarui: 24 Juli 2026*
