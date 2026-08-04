# Migrasi Data "CASHFLOW The Red Harvest" ke StrawberryOps

Dokumen ini menjelaskan perubahan aplikasi, cara menjalankan migrasi, hal-hal
yang perlu Anda konfirmasi, dan prompt siap-pakai untuk memasangkan bukti
transaksi.

---

## 1. Cara menjalankan

Butuh Python 3 dengan `openpyxl` (`pip install openpyxl`) dan koneksi database
di `DATABASE_URL`.

```bash
npm install
```

```bash
npm run db:push
```

```bash
npm run db:seed
```

```bash
npm run db:extract
```

```bash
npm run db:import
```

`db:extract` membaca `C:\Users\rizky\Downloads\CASHFLOW The Red Harvest.xlsx`
dan menulis JSON ternormalisasi ke `prisma/import-data/`. Untuk file di lokasi
lain:

```bash
python scripts/extract_cashflow.py "D:/path/ke/CASHFLOW.xlsx"
```

`db:import` aman dijalankan berulang — seluruh data transaksional dari
spreadsheet dihapus dulu, master data (kebun, pekerjaan, kategori, rekening)
tidak disentuh.

---

## 2. Hasil migrasi dan pencocokan angka

| Yang diimpor | Jumlah | Nilai |
|---|---:|---|
| Dana masuk investor | 10 baris | Rp 301.255.600 |
| Pengeluaran arus kas | 49 transaksi | Rp 276.687.600 |
| Pengeluaran harian | 45 baris | — |
| Catatan panen | 54 baris | Rp 42.188.800 |
| Gaji harian | 732 baris | Rp 27.895.000 |
| Periode gaji mingguan | 6 periode | — |
| Pos anggaran capex | 5 pos | Rp 220.400.000 |
| Aset & alat | 2 aset | — |
| Karyawan | 15 orang | — |

Tiga angka dicocokkan langsung dengan sheet dan **cocok persis**:

- Total dana masuk **Rp 301.255.600** = Rp 266.255.600 modal + Rp 35.000.000 modal kasbon
- Total pengeluaran **Rp 276.687.600** = sel `G105` di sheet Arus Kas
- Pendapatan Kebun Baru **Rp 22.753.100** = sel `G107` "Total Pendapatan"

Pendapatan Kebun Lama Rp 19.435.700 ikut diimpor — di sheet angka ini memang
tidak masuk ke rekap arus kas.

---

## 3. Struktur baru

**Kebun sebagai entitas.** Semua transaksi punya `gardenId`. Header punya
switcher kebun; seluruh halaman dan dashboard mengikuti kebun aktif. Mode
"Semua Kebun" menampilkan gabungan.

- **Kebun Baru** — `hasInvestor = true`, menu Modal & Investor aktif
- **Kebun Lama** — `hasInvestor = false`, hanya operasional (biaya, panen, laba operasional)

**Gaji per shift.** Satu baris = satu orang + satu shift + satu pekerjaan +
satu kebun + satu blok. Shift: `NGABEDUG` (07–12), `NYORE` (12–15), `LEMBUR`,
`BORONGAN`. Tarif lembur kini per karyawan, bukan angka tetap.

**Biaya bersama.** Pengeluaran punya tabel alokasi per kebun. Untuk biaya satu
kebun isinya satu baris dengan nominal penuh, jadi semua laporan cukup membaca
satu tabel. Form input default satu kebun; toggle "biaya bersama" untuk
membagi porsi.

**Model baru:** `Garden`, `Block`, `JobType`, `Vendor`, `Investor`,
`CapitalInjection`, `Asset`, `BudgetItem`, `EmployeeAdvance`, `PayrollPeriod`,
`PayrollPayment`, `ExpenseAllocation`, `ExpenseItem`.

**Halaman baru:** Modal & Investor, Anggaran, Aset & Alat, Kasbon, Periode
Gaji, Pengaturan → Blok / Vendor / Jenis Pekerjaan.

---

## 4. Tanggal yang diperbaiki — **mohon dicek**

Sebagian tanggal di sheet ditulis sebagai teks `dd/mm/yyyy`, tapi sebagian
lain terlanjur dikonversi Excel memakai urutan `m/d/yyyy` sehingga hari dan
bulannya tertukar. Script mengembalikannya, dan koreksi ini terbukti benar:
baris "Pembelian Bibit (LUNAS)" terbaca 4 Juni tapi berkas buktinya bernama
`IMG-20260406`, yaitu 6 April.

| Sel | Terbaca sebagai | Diperbaiki jadi |
|---|---|---|
| Arus Kas!C21 | 2026-06-04 | **2026-04-06** |
| Arus Kas!C38 | 2026-06-04 | **2026-04-06** |
| Arus Kas!C39 | 2026-07-04 | **2026-04-07** |
| Arus Kas!C40 | 2026-08-04 | **2026-04-08** |
| Arus Kas!C50 | 2026-01-05 | **2026-05-01** |
| Arus Kas!C51 | 2026-02-05 | **2026-05-02** |
| Arus Kas!C53 | 2026-03-05 | **2026-05-03** |
| Arus Kas!C54 | 2026-07-05 | **2026-05-07** |
| Arus Kas!C55 | 2026-08-05 | **2026-05-08** |
| Arus Kas!C56 | 2026-12-05 | **2026-05-12** |
| Arus Kas!C77 | 2026-04-06 | **2026-06-04** |
| Arus Kas!C78 | 2026-07-06 | **2026-06-07** |
| Arus Kas!C79 | 2026-08-06 | **2026-06-08** |
| Arus Kas!C80 | 2026-09-06 | **2026-06-09** |
| Arus Kas!C81 | 2026-10-06 | **2026-06-10** |
| Arus Kas!C95 | 2026-03-07 | **2026-07-03** |
| Arus Kas!C96 | 2026-07-07 | 2026-07-07 (tidak berubah) |
| Arus Kas!C98 | 2026-09-07 | **2026-07-09** |

Peringatan lengkap ada di `prisma/import-data/warnings.json`.

---

## 5. Asumsi yang saya ambil

Ini keputusan yang saya buat sendiri karena datanya tidak menyebutkan. Silakan
koreksi kalau ada yang meleset.

1. **Talangan operasional tidak dihitung dua kali.** Delapan transfer
   "Operasional Kebun N" senilai Rp 12.042.000 yang catatannya menyebut
   penggantian gaji sudah terwakili oleh catatan gaji harian. Transfer ini
   diberi kategori `OPERASIONAL_HARIAN` dan dihitung di **arus kas** tapi tidak
   di **biaya operasional**. Transfer lain yang isinya obat/alat tetap dihitung
   penuh sebagai biaya.

2. **Upah harian pekerja perempuan.** Di sheet nominalnya hanya ditulis sekali
   sebagai total harian, sedangkan shift-nya beberapa. Script memecahnya per
   shift memakai tarif di master pekerja. Lima catatan tanggal 22/06 tidak
   cocok dengan tarif master (sheet Rp 75.000, tarif master Rp 45.000) —
   totalnya tetap utuh, tapi pembagian shiftnya perlu dicek.

3. **36 catatan upah berarea "SEMUA KEBUN"** yang tidak punya rincian di sheet
   dibagi rata 50/50 antara dua kebun.

4. **`Bu RW Dede`** ada di log kerja tapi tidak ada di master DATA PEKERJA.
   Ditambahkan dengan tarif standar pekerja perempuan (45.000 / 30.000).

5. **Entri kolektif Juni** ("Perempuan x 3 org") dipetakan ke karyawan
   **Pekerja Harian (Grup)** dengan jumlah orang tersimpan di kolom `headcount`.

6. **Semua karyawan diimpor berstatus ACTIVE.** Bu Neng dan Bu RW Dede
   tercatat bayaran Rp 0 di periode terakhir — kalau sudah tidak bekerja,
   ubah statusnya di halaman Karyawan.

7. **Vendor `Tatang Hermawan` ditandai bermasalah**, dan 9 transaksi yang
   catatannya menyebut nota kosong, pekerja fiktif, atau karung downgrade
   diberi tanda ⚠️. Bisa disaring di halaman Pengeluaran.

8. **Harga komoditas berjalan** di-seed Rp 22.000 (normal) dan Rp 4.000 (BS),
   mengikuti harga terakhir di sheet.

9. **Bukti transaksi** diimpor sebagai nama berkas di kolom `proofRef`, belum
   sebagai file. Lihat bagian 7.

---

## 6. Yang masih perlu Anda isi

- **Nama blok tiap kebun** — struktur sudah aktif penuh, tapi daftarnya masih
  kosong. Isi di Pengaturan → Kebun & Blok.
- **User dan role** selain `admin` — Pengaturan → Manajemen Users.
- **Nama bandar/pembeli** kalau ingin dilacak per pembeli (belum ada modelnya;
  di sheet judulnya generik tanpa nama).
- **Verifikasi tanggal** di tabel bagian 4.

---

## 7. Prompt untuk AI agent — memasangkan bukti transaksi

Jalankan ini di AI agent Anda setelah folder berkas bukti siap. Ganti dulu
bagian `<...>`.

````text
Kamu bertugas memasangkan berkas bukti transaksi ke database StrawberryOps.

KONTEKS
- Database PostgreSQL, skema Prisma ada di prisma/schema.prisma
- Folder berkas bukti: <ISI PATH FOLDER, misal D:/bukti-transaksi>
- Tabel yang perlu diisi:
  - expenses.transfer_proof_path  (bukti transfer)
  - expenses.receipt_proof_path   (bukti nota/kwitansi)
  - capital_injections.proof_path (bukti dana masuk investor)
- Setiap baris sudah punya kolom proof_ref berisi NAMA BERKAS dari
  spreadsheet, contoh: "IMG-20260319-WA0009.jpg". Sebagian berisi nama
  folder atau deskripsi, contoh: "Pembelian Lahan", "Folder gajian 2x tf".

TUGAS
1. Baca semua baris expenses dan capital_injections yang proof_ref IS NOT NULL
   dan proof path-nya masih NULL.
2. Untuk tiap baris, cari berkas yang cocok di folder bukti:
   a. Cocok persis dengan nama berkas di proof_ref.
   b. Kalau tidak ada, cocokkan berdasarkan tanggal yang tertanam di nama
      berkas (pola IMG-YYYYMMDD-*, Screenshot_YYYYMMDD-*) dengan
      transaction_date / entry_date, toleransi ±1 hari.
   c. Kalau proof_ref berisi nama folder, ambil seluruh berkas di folder itu.
3. Salin berkas yang cocok ke public/uploads/ dengan nama unik, lalu isi
   kolom path dengan "/uploads/<nama-berkas>".
4. Bila satu baris punya lebih dari satu berkas, taruh berkas transfer di
   transfer_proof_path dan berkas nota/kwitansi di receipt_proof_path.

ATURAN
- JANGAN menebak. Kalau tidak yakin berkas mana yang benar, lewati dan catat.
- JANGAN menimpa path yang sudah terisi.
- JANGAN mengubah kolom lain selain path bukti.
- Jalankan dalam transaksi, dan tampilkan dulu rencana perubahan untuk saya
  setujui sebelum menulis ke database.

HASIL
Laporkan dalam tiga daftar:
1. Berhasil dipasangkan (id, tanggal, deskripsi, nama berkas)
2. Tidak ketemu berkasnya (id, tanggal, deskripsi, proof_ref)
3. Ambigu / lebih dari satu kandidat (id, deskripsi, daftar kandidat)
````
