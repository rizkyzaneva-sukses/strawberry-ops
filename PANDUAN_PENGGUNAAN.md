# Panduan Penggunaan StrawberryOps

> Sistem Manajemen Operasional Kebun Stroberi

---

## Daftar Isi

1. [Aplikasi Ini Untuk Apa?](#1-aplikasi-ini-untuk-apa)
2. [Login Pertama Kali](#2-login-pertama-kali)
3. [Sistem Role (Hak Akses)](#3-sistem-role-hak-akses)
4. [Navigasi Aplikasi](#4-navigasi-aplikasi)
5. [Workflow Harian (Step-by-Step)](#5-workflow-harian-step-by-step)
6. [Panduan Per Fitur](#6-panduan-per-fitur)
7. [Export Laporan](#7-export-laporan)
8. [Lupa Password / Reset Password](#8-lupa-password--reset-password)
9. [Ubah Password](#9-ubah-password)
10. [Pengaturan](#10-pengaturan)
11. [FAQ & Troubleshooting](#11-faq--troubleshooting)

---

## 1. Aplikasi Ini Untuk Apa?

StrawberryOps digunakan untuk mengelola operasional harian kebun stroberi:

| Fitur | Fungsi |
|-------|--------|
| **Dashboard** | Melihat ringkasan pendapatan, pengeluaran, dan margin kebun |
| **Database Karyawan** | Mengelola data pekerja kebun (nama, tipe upah, tarif) |
| **Rekap Gaji** | Mencatat absensi dan menghitung upah karyawan otomatis |
| **Pengeluaran** | Mencatat semua biaya operasional (pupuk, alat, transport, dll) |
| **Pendapatan Panen** | Mencatat hasil panen (kg normal, BS) dan menghitung pendapatan |
| **Harga Komoditas** | Mengatur harga stroberi per kg (normal & BS) |
| **Rekening Bank** | Mengelola sumber dana untuk pencatatan pengeluaran |
| **Kelola User** | Menambah/mengatur akun pengguna sistem |
| **Log Aktivitas** | Melihat siapa melakukan apa dan kapan |

---

## 2. Login Pertama Kali

Buka aplikasi di browser, lalu masukkan:

| Field | Isi |
|-------|-----|
| **Username** | `admin` |
| **Password** | `admin123` |

> **Penting:** Segera ubah password setelah login pertama kali melalui menu profil di pojok kanan atas → "Ubah Password".

---

## 3. Sistem Role (Hak Akses)

Ada 3 role dengan akses berbeda:

### OWNER (Pemilik)
- Akses **semua fitur**
- Satu-satunya yang bisa kelola user dan lihat log aktivitas
- Cocok untuk: pemilik kebun

### MANAGER (Manajer)
- Akses semua fitur operasional + pengaturan bank & harga komoditas
- **Tidak bisa** kelola user atau lihat log aktivitas
- Cocok untuk: kepala kebun / manajer operasional

### STAFF (Staf)
- Akses fitur operasional saja (input data)
- **Tidak bisa** akses pengaturan sama sekali
- Cocok untuk: pekerja yang input data harian

### Tabel Akses Lengkap

| Menu | OWNER | MANAGER | STAFF |
|------|:-----:|:-------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ |
| Rekap Gaji | ✅ | ✅ | ✅ |
| Pengeluaran | ✅ | ✅ | ✅ |
| Pendapatan Panen | ✅ | ✅ | ✅ |
| Database Karyawan | ✅ | ✅ | ✅ |
| Rekening Bank | ✅ | ✅ | ❌ |
| Harga Komoditas | ✅ | ✅ | ❌ |
| Kelola User | ✅ | ❌ | ❌ |
| Log Aktivitas | ✅ | ❌ | ❌ |
| Export CSV | ✅ | ✅ | ✅ |
| Ubah Password | ✅ | ✅ | ✅ |

---

## 4. Navigasi Aplikasi

### Desktop (Laptop/PC)
- **Sidebar kiri:** Menu utama, diurutkan per grup
- **Header atas:** Profil user (klik untuk ubah password / logout)

### Mobile (HP)
- **Bottom navigation:** 5 ikon di bawah layar
- **Header atas:** Logo + profil user

---

## 5. Workflow Harian (Step-by-Step)

Berikut alur kerja harian yang direkomendasikan:

### Pagi Hari — Persiapan

```
┌─────────────────────────────────────────────────────┐
│  1. Login ke sistem                                  │
│  2. Cek Dashboard → lihat ringkasan kemarin          │
│  3. Pastikan harga komoditas sudah benar             │
│     (Pengaturan → Harga Komoditas)                   │
└─────────────────────────────────────────────────────┘
```

### Saat Kerja — Input Data

```
┌─────────────────────────────────────────────────────┐
│  4. Input Rekap Gaji karyawan yang masuk hari ini    │
│     → Karyawan, tanggal, jam masuk/keluar, area      │
│                                                      │
│  5. Input Pengeluaran jika ada belanja               │
│     → Kategori, jumlah, upload bukti transfer        │
│                                                      │
│  6. Input Pendapatan Panen setelah panen selesai     │
│     → Total kg, berat BS, harga otomatis             │
└─────────────────────────────────────────────────────┘
```

### Sore Hari — Review

```
┌─────────────────────────────────────────────────────┐
│  7. Cek Dashboard lagi → pastikan data hari ini masuk│
│  8. Export laporan jika diperlukan (tombol Export CSV)│
└─────────────────────────────────────────────────────┘
```

### Visual Workflow

```
                    ┌──────────┐
                    │  LOGIN   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │DASHBOARD │ ◄── Cek ringkasan
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌────▼────┐  ┌─────▼──────┐
    │   GAJI    │  │PENGELUARAN│  │  PENDAPATAN│
    │  Karyawan │  │ Operasional│  │   Panen    │
    │  input    │  │  input    │  │   input    │
    └─────┬─────┘  └────┬────┘  └─────┬──────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                    ┌────▼─────┐
                    │DASHBOARD │ ◄── Review hasil
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  EXPORT  │ ◄── Download CSV
                    └──────────┘
```

---

## 6. Panduan Per Fitur

### 6.1 Dashboard (`/`)

Halaman utama yang menampilkan ringkasan operasional.

**Yang ditampilkan:**
- **4 Kartu Ringkasan:** Total Pendapatan, Total Pengeluaran, Margin (laba), Karyawan Aktif
- **Grafik Tren:** Perbandingan pendapatan vs pengeluaran per bulan
- **Panen Terakhir:** 5 data panen terbaru
- **Pengeluaran Terakhir:** 5 data pengeluaran terbaru

**Filter periode:**
- **7 Hari** → Data 7 hari terakhir
- **30 Hari** → Data 30 hari terakhir (default)
- **1 Tahun** → Data dari 1 Januari tahun berjalan

**Tips:**
- Margin hijau = untung, margin merah = rugi
- Persentase BS (%) diwarnai merah jika > 20% (perlu perhatian)

---

### 6.2 Database Karyawan (`/karyawan`)

Kelola data pekerja kebun.

**Menambah Karyawan Baru:**
1. Klik tombol **"+ Tambah Karyawan"**
2. Isi form:
   - **Nama Lengkap** (wajib)
   - **Telepon** (opsional)
   - **Alamat** (opsional)
   - **Tipe Upah** (wajib): Harian / Per Jam / Borongan
   - **Tarif Upah** (wajib): dalam Rupiah
   - **Minimum Jam Kerja**: hanya untuk tipe Per Jam
   - **Tanggal Mulai Kerja**: default hari ini
3. Klik **"Simpan"**

**Tipe Upah Penjelasan:**

| Tipe | Penjelasan | Contoh |
|------|-----------|--------|
| **HARIAN** | Dibayar per hari, berapapun jam kerja | Rp 100.000/hari |
| **PER_JAM** | Dibayar per jam, ada minimum jam | Rp 15.000/jam, min 4 jam |
| **BORONGAN** | Dibayar per pekerjaan/selesai | Rp 200.000/borongan |

**Filter:** Cari nama, filter status (aktif/nonaktif), filter tipe upah.

**Edit/Hapus:** Klik tombol "Edit" atau "Hapus" di kolom Aksi.

> **Catatan:** Hapus = soft delete (data tidak hilang permanen, hanya disembunyikan).

---

### 6.3 Rekap Gaji (`/gaji`)

Catat absensi dan hitung upah karyawan.

**Menambah Record Gaji:**
1. Klik **"+ Input Gaji"**
2. Pilih **Karyawan** dari dropdown (menampilkan info tipe upah & tarif)
3. Isi **Tanggal Kerja**
4. Isi **Area Kerja** (opsional, misal: "Blok A")
5. Isi **Jam Masuk** dan **Jam Keluar** (opsional)
6. Klik **"Simpan"**

**Perhitungan Otomatis:**

| Tipe Karyawan | Rumus |
|---------------|-------|
| HARIAN | Upah = tarif/hari (flat) |
| PER_JAM | Upah = tarif × max(jam_kerja, minimum_jam) |
| BORONGAN | Upah = tarif/borongan (flat) |

**Contoh:**
- Karyawan Per Jam, tarif Rp 15.000/jam, minimum 4 jam
- Hari ini kerja 3 jam → upah = 15.000 × 4 = Rp 60.000 (pakai minimum)
- Hari ini kerja 6 jam → upah = 15.000 × 6 = Rp 90.000

**Preview:** Saat mengisi form, kotak "Preview Perhitungan" menampilkan perhitungan upah secara real-time.

---

### 6.4 Pengeluaran (`/pengeluaran`)

Catat semua biaya operasional kebun.

**Kategori Pengeluaran:**
| Kategori | Contoh |
|----------|--------|
| Gaji | Gaji bulanan staf tetap |
| Pupuk & Obat | Pupuk NPK, pestisida |
| Alat & Perlengkapan | Cangkul, pot, selang |
| Transportasi | Bensin, ongkir |
| Sewa | Sewa lahan, sewa alat |
| Utilitas | Listrik, air |
| Lainnya | Biaya tak terduga |

**Menambah Pengeluaran:**
1. Klik **"+ Input Pengeluaran"**
2. Isi:
   - **Tanggal Transaksi** (wajib)
   - **Kategori** (wajib)
   - **Deskripsi** (opsional)
   - **Jumlah (Rp)** (wajib)
   - **Sumber Dana** (opsional): pilih rekening bank
   - **Rekening Penerima** (opsional)
   - **Bukti Transfer** (opsional): upload gambar/PDF
   - **Bukti Kwitansi** (opsional): upload gambar/PDF
3. Klik **"Simpan"**

**Tips:**
- Selalu upload bukti transfer/kwitansi untuk pencatatan yang rapi
- Filter berdasarkan kategori untuk melihat pengeluaran per jenis

---

### 6.5 Pendapatan Panen (`/pendapatan`)

Catat hasil panen stroberi dan hitung pendapatan.

**Menambah Data Panen:**
1. Klik **"+ Input Panen"**
2. Isi:
   - **Tanggal Panen** (wajib)
   - **Area Kerja** (opsional, misal: "Blok A")
   - **Harga Normal/kg** (wajib, otomatis terisi dari harga terbaru)
   - **Harga BS/kg** (wajib, otomatis terisi dari harga terbaru)
   - **Total Panen (kg)** (wajib)
   - **Berat BS (kg)** (default: 0)
   - **Catatan** (opsional)
3. Klik **"Simpan"**

**Perhitungan Otomatis:**

```
Normal (kg)    = Total Panen - Berat BS
Pendapatan N   = Normal (kg) × Harga Normal/kg
Pendapatan BS  = Berat BS (kg) × Harga BS/kg
Total          = Pendapatan N + Pendapatan BS
BS %           = (Berat BS / Total Panen) × 100
```

**Contoh:**
- Total panen: 100 kg
- Berat BS: 15 kg
- Harga Normal: Rp 35.000/kg
- Harga BS: Rp 15.000/kg

```
Normal     = 100 - 15 = 85 kg
Pendapatan = 85 × 35.000 = Rp 2.975.000
Pendapatan BS = 15 × 15.000 = Rp 225.000
Total      = Rp 3.200.000
BS %       = 15%
```

**Peringatan:** Jika BS% > 20%, akan ditandai merah. Periksa kualitas panen di area tersebut.

---

## 7. Export Laporan

Tersedia di 3 halaman: **Rekap Gaji**, **Pengeluaran**, **Pendapatan Panen**.

**Cara Export:**
1. Atur filter tanggal sesuai periode yang diinginkan
2. Klik tombol **"Export CSV"**
3. File CSV ototmatis terdownload

**Format file:** CSV (bisa dibuka di Excel/Google Sheets)

**Yang di-export:** Sesuai filter tanggal yang aktif. Jika tidak ada filter, export semua data.

---

## 8. Lupa Password / Reset Password

Jika lupa password:

1. Buka halaman login
2. Klik **"Lupa Password?"**
3. Masukkan **username**, klik **"Kirim Kode OTP"**
4. Kode OTP 6 digit akan dikirim via **WhatsApp**
5. Masukkan kode OTP + password baru + konfirmasi
6. Klik **"Reset Password"**

> **Catatan:** Fitur ini membutuhkan nomor HP yang terdaftar di sistem dan WhatsApp API (WAHA) yang aktif. Hubungi admin jika nomor HP belum terdaftar.

---

## 9. Ubah Password

Ubah password dari dalam aplikasi:

1. Klik **profil** di pojok kanan atas
2. Pilih **"Ubah Password"**
3. Masukkan password saat ini, password baru, konfirmasi
4. Klik **"Simpan Password"**

> Password baru minimal 6 karakter.

---

## 10. Pengaturan

### 10.1 Kelola User (OWNER saja)

- **Tambah user:** Isi nama, username, password, pilih role
- **Edit user:** Klik "Edit" di tabel → ubah data, kosongkan password jika tidak ingin ganti
- **Role:** OWNER / MANAGER / STAFF (lihat [Sistem Role](#3-sistem-role-hak-akses))

### 10.2 Rekening Bank (OWNER + MANAGER)

- Daftar rekening/sumber dana yang muncul di form Pengeluaran
- Bisa **toggle aktif/nonaktif** tanpa menghapus
- Contoh: "Kas Utama" (Tunai), "BCA Operasional", "Mandiri"

### 10.3 Harga Komoditas (OWNER + MANAGER)

- Harga stroberi per kg (normal & BS)
- **Riwayat harga** disimpan (tidak bisa diedit, hanya tambah baru)
- Harga terbaru otomatis mengisi form Pendapatan Panen
- Default: Normal Rp 35.000/kg, BS Rp 15.000/kg

### 10.4 Log Aktivitas (OWNER saja)

- Catatan semua aktivitas di sistem: siapa, kapan, melakukan apa
- Bisa filter berdasarkan tanggal
- Berguna untuk audit dan tracking perubahan data

---

## 11. FAQ & Troubleshooting

### Q: Saya tidak bisa akses menu Pengaturan?
**A:** Menu Pengaturan hanya untuk role OWNER dan MANAGER. Jika Anda STAFF, minta admin untuk mengubah role Anda.

### Q: Harga di form panen tidak otomatis?
**A:** Pastikan sudah ada harga komoditas di Pengaturan → Harga Komoditas. Sistem mengambil harga terbaru.

### Q: Saya salah input data, bagaimana?
**A:** Klik tombol "Edit" di baris data yang salah, lalu perbaiki dan simpan. Data tidak bisa dihapus permanen (soft delete).

### Q: Export CSV tidak muncul data?
**A:** Pastikan filter tanggal sudah benar. Jika kosong, coba reset filter terlebih dahulu.

### Q: Lupa password admin?
**A:** Jalankan ulang seed database:
```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```
> **Peringatan:** Ini akan menghapus SEMUA data dan mengembalikan ke data awal.

### Q: Aplikasi tidak bisa diakses?
**A:** Pastikan:
1. Server berjalan (`npm run dev`)
2. Database ada (`prisma/dev.db`)
3. Sudah di-seed (`npx tsx prisma/seed.ts`)

### Q: Bagaimana cara backup data?
**A:** Copy file `prisma/dev.db` secara berkala. File ini berisi seluruh database.

---

## Ringkasan Shortcut

| Shortcut Desktop | Fungsi |
|-----------------|--------|
| Klik avatar → Ubah Password | Ganti password |
| Klik avatar → Logout | Keluar dari sistem |
| Filter tanggal + Export CSV | Download laporan |
| Tombol Edit di tabel | Edit data |
| Tombol Hapus di tabel | Hapus data (soft delete) |

---

*Terakhir diperbarui: 24 Juli 2026*
