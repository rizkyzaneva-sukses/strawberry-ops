'use client'

import { useState } from 'react'

type Tab = 'panduan' | 'workflow' | 'studi-kasus' | 'faq'

/* ──────────────────────────────── SECTIONS ──────────────────────────────── */

const sections = [
  {
    id: 'login',
    icon: '🔐',
    title: 'Login Pertama Kali',
    content: `Buka aplikasi di browser, lalu masukkan:

• Username: admin
• Password: admin123

PENTING: Segera ubah password setelah login pertama kali melalui menu Pengaturan → Ubah Password.

Jika lupa password:
1. Klik "Lupa Password?" di halaman login
2. Masukkan username → Kirim Kode OTP
3. Kode OTP 6 digit dikirim via WhatsApp
4. Masukkan kode OTP + password baru
5. Klik "Reset Password"`,
  },
  {
    id: 'multi-kebun',
    icon: '🏡',
    title: 'Multi-Kebun & Switcher',
    content: `StrawberryOps mendukung beberapa kebun dalam satu akun.

Switcher Kebun (Header):
• Klik nama kebun di header/sidebar untuk ganti kebun
• Pilih "Semua Kebun" untuk melihat data gabungan
• Pilihan tersimpan otomatis (tidak perlu pilih ulang)

Kapan pakai mode "Semua Kebun"?
• Lihat total pendapatan/pengeluaran semua kebun
• Export laporan konsolidasi
• Perbandingan antar kebun

Kapan pakai mode kebun spesifik?
• Input data harian (gaji, panen, pengeluaran)
• Lihat anggaran vs realisasi per kebun
• Kelola blok per kebun

Blok per Kebun:
• Setiap kebun punya blok (bagian lahan)
• Blok dipakai untuk tracking area kerja di gaji dan panen
• Kelola di Pengaturan → Blok & Kebun`,
  },
  {
    id: 'role',
    icon: '👥',
    title: 'Sistem Role (Hak Akses)',
    content: `Ada 3 role dengan akses berbeda:

OWNER (Pemilik)
• Akses semua fitur termasuk Kelola User & Log Aktivitas
• Cocok untuk: pemilik kebun

MANAGER (Manajer)
• Akses semua fitur operasional + pengaturan bank & harga
• Tidak bisa kelola user atau lihat log aktivitas
• Cocok untuk: kepala kebun / manajer operasional

STAFF (Staf)
• Akses fitur operasional saja (input data)
• Tidak bisa akses pengaturan
• Cocok untuk: pekerja yang input data harian`,
    table: [
      ['Menu', 'OWNER', 'MANAGER', 'STAFF'],
      ['Dashboard', '✅', '✅', '✅'],
      ['Gaji Harian', '✅', '✅', '✅'],
      ['Periode Gaji', '✅', '✅', '✅'],
      ['Kasbon', '✅', '✅', '✅'],
      ['Pengeluaran', '✅', '✅', '✅'],
      ['Panen (Pendapatan)', '✅', '✅', '✅'],
      ['Anggaran', '✅', '✅', '✅'],
      ['Aset & Alat', '✅', '✅', '✅'],
      ['Karyawan', '✅', '✅', '✅'],
      ['Revisi', '✅', '✅', '✅'],
      ['Modal & Investor', '✅', '✅', '❌'],
      ['Rekening Bank', '✅', '✅', '❌'],
      ['Harga Komoditas', '✅', '✅', '❌'],
      ['Blok & Kebun', '✅', '✅', '❌'],
      ['Kelola User', '✅', '❌', '❌'],
      ['Log Aktivitas', '✅', '❌', '❌'],
      ['Export CSV', '✅', '✅', '✅'],
      ['Ubah Password', '✅', '✅', '✅'],
    ],
  },
  {
    id: 'dashboard',
    icon: '📊',
    title: 'Dashboard',
    content: `Halaman utama yang menampilkan ringkasan operasional.

Yang ditampilkan:
• 4 Kartu Ringkasan: Total Pendapatan, Total Pengeluaran, Margin (laba), Karyawan Aktif
• Grafik Tren: Perbandingan pendapatan vs pengeluaran per bulan
• Panen Terakhir: 5 data panen terbaru
• Pengeluaran Terakhir: 5 data pengeluaran terbaru

Filter periode:
• 7 Hari → Data 7 hari terakhir
• 30 Hari → Data 30 hari terakhir (default)
• 1 Tahun → Data dari 1 Januari tahun berjalan

Tips:
• Margin hijau = untung, margin merah = rugi
• Persentase BS (%) diwarnai merah jika > 20% (perlu perhatian)
• Switch ke "Semua Kebun" untuk lihat total gabungan`,
  },
  {
    id: 'karyawan',
    icon: '👷',
    title: 'Database Karyawan',
    content: `Kelola data pekerja kebun.

Menambah Karyawan Baru:
1. Klik tombol "+ Tambah Karyawan"
2. Isi form:
   • Nama Lengkap (wajib)
   • Telepon (opsional)
   • Alamat (opsional)
   • Tipe Upah (wajib): Harian / Per Jam / Borongan
   • Tarif Upah (wajib): dalam Rupiah
   • Minimum Jam Kerja: hanya untuk tipe Per Jam
   • Tanggal Mulai Kerja: default hari ini
3. Klik "Simpan"

Tipe Upah:
• HARIAN → Dibayar per hari, berapapun jam kerja (contoh: Rp 100.000/hari)
• PER_JAM → Dibayar per jam, ada minimum jam (contoh: Rp 15.000/jam, min 4 jam)
• BORONGAN → Dibayar per pekerjaan/selesai (contoh: Rp 200.000/borongan)

Tips:
• Data karyawan bisa dicari dengan kolom search
• Karyawan yang sudah tidak aktif bisa diedit untuk update status`,
  },
  {
    id: 'gaji',
    icon: '💰',
    title: 'Gaji Harian (Absensi)',
    content: `Catat absensi dan hitung upah karyawan harian.

Menambah Record Gaji:
1. Klik "+ Input Gaji"
2. Pilih Karyawan dari dropdown (menampilkan info tipe upah & tarif)
3. Isi Tanggal Kerja
4. Pilih Kebun (otomatis sesuai switcher)
5. Isi Area Kerja / Blok (opsional)
6. Isi Jam Masuk dan Jam Keluar (opsional)
7. Klik "Simpan"

Perhitungan Otomatis:
• HARIAN → Upah = tarif/hari (flat)
• PER_JAM → Upah = tarif × max(jam_kerja, minimum_jam)
• BORONGAN → Upah = tarif/borongan (flat)

Contoh Perhitungan:
• Karyawan Per Jam, tarif Rp 15.000/jam, minimum 4 jam
• Kerja 3 jam → upah = 15.000 × 4 = Rp 60.000 (pakai minimum)
• Kerja 6 jam → upah = 15.000 × 6 = Rp 90.000

Filter & Export:
• Filter by tanggal dan karyawan
• Export CSV untuk laporan
• Data masuk ke Periode Gaji untuk rekap mingguan`,
  },
  {
    id: 'periode-gaji',
    icon: '🗓️',
    title: 'Periode Gaji (Rekap Mingguan)',
    content: `Rekap gaji mingguan (Senin–Minggu) yang menggabungkan semua data gaji harian.

Membuat Periode Gaji:
1. Klik "+ Buat Periode"
2. Pilih tanggal mulai (sistem otomatis hitung akhir minggu)
3. Sistem otomatis mengambil semua data gaji harian dalam periode tersebut

Yang Ditampilkan:
• Rekap per karyawan: total hari kerja, total upah, potongan kasbon, upah bersih
• Grouping: Perempuan / Laki-laki (dengan subtotal)
• Breakdown per kebun untuk karyawan multi-kebun
• 4 kartu ringkasan: Total Gaji, Total Kasbon, Upah Bersih, Sudah Dibayar

Mencatat Pembayaran:
1. Buka detail periode
2. Klik "+ Catat Pembayaran"
3. Isi nominal, tanggal transfer, catatan
4. Bisa dicicil (bayar sebagian dulu)
• Centang "Gaji Bulanan" jika ini batch terakhir bulan ini`,
  },
  {
    id: 'kasbon',
    icon: '🤝',
    title: 'Kasbon & Piutang Pekerja',
    content: `Catat uang muka (kasbon) dan talangan untuk karyawan.

Jenis:
• KASBON → Uang muka yang akan dipotong dari gaji
• TALANGAN → Uang yang ditalangi untuk keperluan pekerja

Menambah Kasbon:
1. Klik "+ Input Kasbon"
2. Pilih Pekerja
3. Isi Tanggal, Nominal
4. Pilih Jenis: Kasbon atau Talangan
5. Jika Talangan: isi "Ditalangi Untuk" (siapa yang ditanggung)
6. Pilih Kebun
7. Klik "Simpan"

Status:
• OPEN → Belum dipotong dari gaji
• SETTLED → Sudah dipotong lunas

Pemotongan Otomatis:
• Saat membuat Periode Gaji, sistem otomatis menghitung kasbon yang belum dipotong
• Kasbon dipotong dari upah bersih karyawan
• Sisa piutang = Total kasbon − Sudah dipotong`,
  },
  {
    id: 'pengeluaran',
    icon: '📤',
    title: 'Pengeluaran',
    content: `Catat semua biaya operasional kebun.

Kategori Pengeluaran:
• Gaji → Gaji bulanan staf tetap
• Pupuk & Obat → Pupuk NPK, pestisida, fungisida
• Alat & Perlengkapan → Cangkul, pot, selang, gunting
• Transportasi → Bensin, ongkir, kurir
• Sewa → Sewa lahan, sewa alat berat
• Utilitas → Listrik, air, internet
• Lainnya → Biaya tak terduga

Menambah Pengeluaran:
1. Klik "+ Input Pengeluaran"
2. Isi:
   • Tanggal Transaksi (wajib)
   • Kategori (wajib)
   • Deskripsi (opsional)
   • Jumlah (Rp) (wajib)
   • Sumber Dana (opsional): pilih rekening bank
   • Rekening Penerima (opsional)
   • Bukti Transfer (opsional): upload gambar/PDF
   • Bukti Kwitansi (opsional): upload gambar/PDF
3. Klik "Simpan"

Tips:
• Selalu upload bukti transfer/kwitansi untuk audit trail
• Filter by tanggal & kategori untuk cari data spesifik
• Export CSV untuk laporan bulanan`,
  },
  {
    id: 'pendapatan',
    icon: '🍓',
    title: 'Pendapatan Panen',
    content: `Catat hasil panen stroberi dan hitung pendapatan.

Menambah Data Panen:
1. Klik "+ Input Panen"
2. Isi:
   • Tanggal Panen (wajib)
   • Kebun & Blok (opsional)
   • Harga Normal/kg (wajib, otomatis terisi dari harga terbaru)
   • Harga BS/kg (wajib, otomatis terisi dari harga terbaru)
   • Total Panen (kg) (wajib)
   • Berat BS (kg) (default: 0)
   • Catatan (opsional)
3. Klik "Simpan"

Perhitungan Otomatis:
• Normal (kg) = Total Panen − Berat BS
• Pendapatan Normal = Normal (kg) × Harga Normal/kg
• Pendapatan BS = Berat BS (kg) × Harga BS/kg
• Total Pendapatan = Pendapatan Normal + Pendapatan BS
• BS % = (Berat BS / Total Panen) × 100

Contoh:
• Total panen: 100 kg, Berat BS: 15 kg
• Harga Normal: Rp 35.000/kg, Harga BS: Rp 15.000/kg
• Normal = 85 kg → Pendapatan = Rp 2.975.000
• BS = 15 kg → Pendapatan BS = Rp 225.000
• Total = Rp 3.200.000, BS % = 15%

Peringatan: Jika BS% > 20%, akan ditandai merah → perlu evaluasi kualitas panen.`,
  },
  {
    id: 'anggaran',
    icon: '🎯',
    title: 'Anggaran vs Realisasi',
    content: `Bandingkan rencana anggaran dengan biaya aktual di lapangan.

Konsep:
• Anggaran = Rencana biaya sebelum musim tanam
• Realisasi = Biaya aktual yang terjadi
• Selisih = Anggaran − Realisasi (positif = hemat, negatif = boros)

Menambah Pos Anggaran:
1. Klik "+ Tambah Pos"
2. Isi:
   • Nama Pos (contoh: "Pupuk NPK 50kg")
   • Jumlah & Satuan (contoh: 10 karung)
   • Harga Anggaran/satuan (rencana)
   • Harga Faktual/satuan (aktual)
   • Status Pembayaran: Belum Bayar / DP / Kurang Bayar / Lunas
   • Catatan (opsional)
3. Klik "Simpan"

3 Kartu Ringkasan:
• Total Anggaran → Rencana biaya keseluruhan
• Total Realisasi → Biaya aktual
• Hemat/Boros → Selisih (hijau = hemat, merah = boros)

Tips:
• Isi anggaran SEBELUM musim tanam
• Update harga faktual saat transaksi terjadi
• Gunakan status pembayaran untuk tracking yang sudah/belum dibayar
• Export untuk laporan ke investor/pemilik modal`,
  },
  {
    id: 'aset',
    icon: '🚜',
    title: 'Aset & Alat',
    content: `Inventaris peralatan dan aset kebun.

Kategori Aset:
• MESIN → Pompa air, traktor mini, dll
• PERLENGKAPAN → Cangkul, gunting, pot, selang
• BANGUNAN → Gudang, pos jaga, green house
• LAINNYA → Kendaraan, elektronik

Menambah Aset:
1. Klik "+ Tambah Aset"
2. Isi:
   • Nama Aset (wajib)
   • Kategori (wajib)
   • Tanggal Beli
   • Kebun (atau centang "Aset Bersama")
   • Jumlah & Harga Satuan
   • Porsi Kepemilikan (0–1, untuk aset bersama)
   • Status Pembayaran
   • Penjual / Vendor
   • Catatan
3. Klik "Simpan"

Aset Bersama (Patungan):
• Centang "Aset Bersama" untuk aset yang dipakai beberapa kebun
• Porsi Kepemilikan: 0.5 = milik 50%, 0.33 = milik 33%
• Total biaya = Jumlah × Harga × Porsi

2 Kartu Ringkasan:
• Nilai Aset → Total nilai semua aset
• Jumlah Aset → Total item inventaris`,
  },
  {
    id: 'modal',
    icon: '🏦',
    title: 'Modal & Investor',
    content: `Catat modal yang masuk ke kebun — hanya tampil untuk kebun yang pakai pencatatan investor.

Jenis Dana:
• EQUITY (Penyertaan) → Modal investasi, tidak perlu dikembalikan
• LOAN (Pinjaman) → Modal pinjaman, harus dikembalikan

Mencatat Modal:
1. Klik "+ Tambah Modal"
2. Isi:
   • Kebun (hanya kebun dengan investor)
   • Tanggal & Keterangan
   • Jenis Dana: Equity atau Loan
   • Nominal (Rp)
   • Investor (opsional)
   • Sumber Dana & Rekening Tujuan
   • Catatan
3. Klik "Simpan"

Untuk Loan:
• "Sudah Dikembalikan" = jumlah yang sudah dilunasi
• Sisa Utang = Nominal − Sudah Dikembalikan

4 Kartu Ringkasan:
• Penyertaan → Total equity
• Kasbon → Total loan
• Sisa Utang → Outstanding loan
• Total → Semua modal masuk`,
  },
  {
    id: 'revisi',
    icon: '📝',
    title: 'Revisi & Usulan Fitur',
    content: `Kelola usulan fitur dan revisi untuk developer.

Menambah Revisi:
1. Klik "+ Tambah Revisi"
2. Isi judul, deskripsi, prioritas
3. Paste gambar (Ctrl+V) di area lampiran jika perlu screenshot
4. Klik "Simpan"

Status Revisi:
• ○ Open → belum dikerjakan
• ◐ Dikerjakan → sedang dalam proses
• ● Selesai → sudah selesai

Klik lingkaran status untuk toggle: Open → Dikerjakan → Selesai → Open

Prioritas:
• Rendah → bisa ditunda
• Sedang → biasa
• Tinggi → perlu segera
• Mendesak → harus sekarang`,
  },
  {
    id: 'pengaturan',
    icon: '⚙️',
    title: 'Pengaturan',
    content: `Kelola User (OWNER saja)
• Tambah user: Isi nama, username, password, pilih role
• Edit user: Klik "Edit" di tabel
• Tidak bisa hapus user (nonaktifkan via edit)

Rekening Bank (OWNER + MANAGER)
• Daftar rekening/sumber dana yang muncul di form
• Bisa toggle aktif/nonaktif
• Contoh: "Kas Utama" (Tunai), "BCA Operasional"

Harga Komoditas (OWNER + MANAGER)
• Harga stroberi per kg (normal & BS)
• Riwayat harga tersimpan (tidak bisa diedit, hanya tambah baru)
• Harga terbaru otomatis mengisi form Pendapatan Panen
• Default: Normal Rp 35.000/kg, BS Rp 15.000/kg

Blok & Kebun (OWNER + MANAGER)
• Kelola blok (bagian lahan) per kebun
• Blok muncul di dropdown Area Kerja di form gaji dan panen

Log Aktivitas (OWNER saja)
• Audit trail semua aktivitas: siapa, kapan, melakukan apa
• Filter by tanggal
• Berguna untuk tracking perubahan data`,
  },
  {
    id: 'export',
    icon: '📄',
    title: 'Export Laporan',
    content: `Tersedia di: Gaji, Pengeluaran, Pendapatan, Anggaran, Modal.

Cara Export:
1. Atur filter tanggal sesuai periode
2. Klik tombol "Export CSV"
3. File CSV otomatis terdownload

Format: CSV (bisa dibuka di Excel/Google Sheets)
Yang di-export: Sesuai filter yang aktif. Tanpa filter = semua data.`,
  },
  {
    id: 'password',
    icon: '🔑',
    title: 'Ubah Password',
    content: `Ubah Password:
1. Klik profil di pojok kanan atas
2. Pilih "Ubah Password"
3. Masukkan password saat ini, password baru, konfirmasi
4. Klik "Simpan Password"

Password baru minimal 6 karakter.

Lupa Password:
1. Buka halaman login
2. Klik "Lupa Password?"
3. Masukkan username → Kirim Kode OTP
4. Kode OTP dikirim via WhatsApp
5. Masukkan kode + password baru → Reset`,
  },
]

/* ──────────────────────────────── WORKFLOW ──────────────────────────────── */

const workflowSteps = [
  {
    phase: '🌅 Pagi (Sebelum Kerja)',
    steps: [
      { label: 'Login ke sistem', desc: 'Masuk dengan username dan password' },
      { label: 'Cek Dashboard', desc: 'Lihat ringkasan data kemarin, cek margin dan BS%' },
      { label: 'Cek harga komoditas', desc: 'Pastikan harga normal dan BS sudah benar' },
      { label: 'Switch kebun', desc: 'Pilih kebun yang akan diinput hari ini' },
    ],
  },
  {
    phase: '☀️ Siang (Saat Kerja)',
    steps: [
      { label: 'Input Gaji Karyawan', desc: 'Catat jam masuk & keluar, sistem hitung upah otomatis' },
      { label: 'Input Kasbon (jika ada)', desc: 'Catat uang muka atau talangan untuk pekerja' },
      { label: 'Input Pengeluaran', desc: 'Jika ada belanja (pupuk, alat, dll), upload bukti transfer' },
      { label: 'Input Pendapatan Panen', desc: 'Setelah panen selesai, catat total kg dan berat BS' },
    ],
  },
  {
    phase: '🌙 Sore (Review)',
    steps: [
      { label: 'Cek Dashboard lagi', desc: 'Pastikan semua data hari ini sudah masuk' },
      { label: 'Cek BS%', desc: 'Jika BS% > 20%, perlu perhatian kualitas panen' },
      { label: 'Export jika perlu', desc: 'Download CSV untuk laporan harian' },
    ],
  },
  {
    phase: '📅 Mingguan (Senin)',
    steps: [
      { label: 'Buat Periode Gaji', desc: 'Rekap gaji minggu lalu (Senin–Minggu)' },
      { label: 'Review kasbon', desc: 'Cek kasbon yang belum dipotong, pastikan sudah terpotong di periode' },
      { label: 'Catat Pembayaran', desc: 'Bayar gaji karyawan, catat nominal & tanggal transfer' },
      { label: 'Review tren 7 hari', desc: 'Dashboard → filter 7 Hari, bandingkan pendapatan vs pengeluaran' },
      { label: 'Update harga jika perlu', desc: 'Pengaturan → Harga Komoditas → Tambah Harga Baru' },
    ],
  },
  {
    phase: '📆 Bulanan',
    steps: [
      { label: 'Review tren bulanan', desc: 'Dashboard → filter 1 Tahun, cek grafik bulanan' },
      { label: 'Cek Anggaran vs Realisasi', desc: 'Bandingkan rencana anggaran dengan biaya aktual' },
      { label: 'Inventaris aset', desc: 'Pastikan semua aset baru sudah tercatat di menu Aset' },
      { label: 'Export laporan bulanan', desc: 'Export semua CSV untuk arsip' },
      { label: 'Review log aktivitas', desc: '(OWNER) Cek siapa melakukan apa bulan ini' },
    ],
  },
]

/* ──────────────────────────── STUDI KASUS ──────────────────────────── */

const caseStudies = [
  {
    id: 'kasus-1',
    icon: '📋',
    title: 'Kasus 1: Karyawan Baru Masuk',
    scenario: 'Pak Budi mulai kerja hari ini sebagai pekerja harian dengan upah Rp 100.000/hari.',
    steps: [
      { step: 'Tambah Karyawan', desc: 'Menu Karyawan → + Tambah Karyawan → Isi nama "Pak Budi", tipe "Harian", tarif "100000" → Simpan' },
      { step: 'Input Gaji Hari Ini', desc: 'Menu Gaji → + Input Gaji → Pilih "Pak Budi" → Isi tanggal → Simpan. Sistem otomatis hitung Rp 100.000' },
      { step: 'Cek Dashboard', desc: 'Dashboard → pastikan "Karyawan Aktif" bertambah dan gaji hari ini tercatat' },
    ],
  },
  {
    id: 'kasus-2',
    icon: '🍓',
    title: 'Kasus 2: Panen dengan BS Tinggi',
    scenario: 'Hari ini panen 80 kg tapi 25 kg di antaranya BS (rusak). BS% = 31% → warning!',
    steps: [
      { step: 'Input Panen', desc: 'Menu Panen → + Input Panen → Total 80 kg, BS 25 kg → Simpan' },
      { step: 'Cek BS%', desc: 'Sistem menampilkan BS% = 31.25% dengan warna MERAH (batas normal 20%)' },
      { step: 'Evaluasi', desc: 'Perlu investigasi: cuaca hujan? hama? kematangan buah? Catatan di form panen' },
      { step: 'Tindak Lanjut', desc: 'Jika perlu, tambah revisi di menu Revisi → "Evaluasi BS% tinggi di Blok A"' },
    ],
  },
  {
    id: 'kasus-3',
    icon: '💰',
    title: 'Kasus 3: Karyawan Ambil Kasbon',
    scenario: 'Pak Budi minta kasbon Rp 500.000 untuk keperluan keluarga.',
    steps: [
      { step: 'Catat Kasbon', desc: 'Menu Kasbon → + Input Kasbon → Pilih "Pak Budi" → Nominal 500000 → Jenis "Kasbon" → Simpan' },
      { step: 'Buat Periode Gaji', desc: 'Saat akhir minggu, buat Periode Gaji. Sistem otomatis mendeteksi kasbon Rp 500.000' },
      { step: 'Cek Pemotongan', desc: 'Di rekap periode: Total Gaji Rp 700.000 − Kasbon Rp 500.000 = Upah Bersih Rp 200.000' },
      { step: 'Bayar', desc: 'Catat pembayaran Rp 200.000. Status kasbon otomatis jadi SETTLED' },
    ],
  },
  {
    id: 'kasus-4',
    icon: '📤',
    title: 'Kasus 4: Belanja Pupuk Besar',
    scenario: 'Beli pupuk NPK 20 karung seharga Rp 3.000.000 dari rekening BCA.',
    steps: [
      { step: 'Input Pengeluaran', desc: 'Menu Pengeluaran → + Input → Kategori "Pupuk & Obat" → Deskripsi "NPK 20 karung" → Jumlah 3000000' },
      { step: 'Pilih Sumber Dana', desc: 'Sumber Dana → pilih "BCA Operasional"' },
      { step: 'Upload Bukti', desc: 'Upload foto faktur/bukti transfer di kolom Bukti Kwitansi' },
      { step: 'Cek Anggaran', desc: 'Menu Anggaran → cek pos "Pupuk NPK" → bandingkan anggaran vs realisasi' },
    ],
  },
  {
    id: 'kasus-5',
    icon: '🗓️',
    title: 'Kasus 5: Tutup Periode Gaji Mingguan',
    scenario: 'Minggu ini 8 karyawan kerja, 2 di antaranya punya kasbon. Saatnya tutup periode.',
    steps: [
      { step: 'Buat Periode', desc: 'Menu Periode Gaji → + Buat Periode → pilih Senin minggu ini → Sistem auto-pull data gaji' },
      { step: 'Review Rekap', desc: 'Cek total per karyawan: gaji, potongan kasbon, upah bersih. Group by gender.' },
      { step: 'Catat Pembayaran', desc: 'Klik + Catat Pembayaran → Isi nominal sesuai upah bersih → Tanggal transfer' },
      { step: 'Bayar Cicilan', desc: 'Jika belum lunas semua, bisa bayar sebagian. Sisa masuk periode berikutnya' },
      { step: 'Export', desc: 'Export CSV untuk arsip pembayaran gaji minggu ini' },
    ],
  },
  {
    id: 'kasus-6',
    icon: '🏦',
    title: 'Kasus 6: Investor Tanam Modal',
    scenario: 'Pak Ahmad invest Rp 10.000.000 untuk Kebun A (equity/penyertaan).',
    steps: [
      { step: 'Catat Modal', desc: 'Menu Modal & Investor → + Tambah → Kebun "Kebun A" → Jenis "Equity" → Nominal 10000000' },
      { step: 'Isi Investor', desc: 'Pilih investor "Pak Ahmad" → Sumber Dana → Rekening Tujuan → Simpan' },
      { step: 'Monitoring', desc: 'Kartu "Penyertaan" bertambah. Di mode "Semua Kebun" bisa lihat total modal semua kebun' },
      { step: 'Laporan', desc: 'Export CSV dari menu Modal untuk laporan ke investor' },
    ],
  },
  {
    id: 'kasus-7',
    icon: '🚜',
    title: 'Kasus 7: Beli Aset Patungan',
    scenario: 'Beli pompa air Rp 5.000.000 yang dipakai 2 kebun. Kebun A tanggung 60%, Kebun B tanggung 40%.',
    steps: [
      { step: 'Tambah Aset', desc: 'Menu Aset → + Tambah → Nama "Pompa Air Honda" → Kategori "Mesin"' },
      { step: 'Set Bersama', desc: 'Centang "Aset Bersama" → Jumlah 1 → Harga 5000000' },
      { step: 'Set Porsi', desc: 'Input dari Kebun A: Porsi 0.6 → Biaya = 5.000.000 × 0.6 = Rp 3.000.000' },
      { step: 'Input Kebun B', desc: 'Tambah lagi untuk Kebun B: Porsi 0.4 → Biaya = Rp 2.000.000' },
    ],
  },
  {
    id: 'kasus-8',
    icon: '🎯',
    title: 'Kasus 8: Evaluasi Anggaran Bulanan',
    scenario: 'Awal bulan sudah buat anggaran Rp 15.000.000. Sekarang akhir bulan, saatnya evaluasi.',
    steps: [
      { step: 'Buka Anggaran', desc: 'Menu Anggaran → lihat 3 kartu: Total Anggaran, Total Realisasi, Hemat/Boros' },
      { step: 'Update Faktual', desc: 'Klik Edit di setiap pos → update "Harga Faktual" dengan harga beli sebenarnya' },
      { step: 'Cek Selisih', desc: 'Pos yang hemat ditandai hijau, yang boros ditandai merah' },
      { step: 'Analisa', desc: 'Pos mana yang paling boros? Apakah perlu adjust anggaran bulan depan?' },
      { step: 'Export', desc: 'Export CSV untuk laporan ke pemilik modal / investor' },
    ],
  },
]

/* ──────────────────────────── FAQ ──────────────────────────── */

const faqCategories = [
  {
    category: '🔐 Login & Akun',
    items: [
      {
        q: 'Saya tidak bisa login, apa yang salah?',
        a: 'Pastikan username dan password benar. Password case-sensitive (huruf besar/kecil beda). Jika lupa, klik "Lupa Password?" di halaman login untuk reset via WhatsApp.',
      },
      {
        q: 'Bagaimana cara ganti password?',
        a: 'Klik profil di pojok kanan atas → Ubah Password → Masukkan password lama + baru + konfirmasi → Simpan. Password baru minimal 6 karakter.',
      },
      {
        q: 'Saya tidak bisa akses menu Pengaturan?',
        a: 'Menu Pengaturan hanya untuk OWNER dan MANAGER. STAFF hanya bisa akses fitur operasional. Minta admin untuk mengubah role Anda.',
      },
      {
        q: 'Lupa password admin (OWNER)?',
        a: 'Gunakan fitur "Lupa Password?" di halaman login. Kode OTP dikirim via WhatsApp ke nomor yang terdaftar. Jika nomor tidak aktif, hubungi developer.',
      },
    ],
  },
  {
    category: '💰 Gaji & Kasbon',
    items: [
      {
        q: 'Berapa upah karyawan yang kerja 3 jam (tipe Per Jam, min 4 jam)?',
        a: 'Tetap dihitung 4 jam (minimum). Contoh: tarif Rp 15.000/jam × 4 jam = Rp 60.000. Sistem otomatis pakai minimum jika jam kerja < minimum.',
      },
      {
        q: 'Kasbon belum terpotong di periode gaji?',
        a: 'Pastikan kasbon dibuat SEBELUM periode gaji dibuat. Sistem mengambil kasbon yang statusnya OPEN pada saat periode dibuat. Jika kasbon dibuat setelah periode, edit periode atau buat periode baru.',
      },
      {
        q: 'Bisa bayar gaji secara cicil?',
        a: 'Bisa. Di detail Periode Gaji, klik "+ Catat Pembayaran" berulang kali. Setiap pembayaran tercatat terpisah. Sistem menjumlahkan semua pembayaran.',
      },
      {
        q: 'Periode gaji salah tanggal, bisa diedit?',
        a: 'Periode yang sudah dibuat tidak bisa diedit tanggalnya. Buat periode baru dengan tanggal yang benar.',
      },
    ],
  },
  {
    category: '🍓 Panen & Pendapatan',
    items: [
      {
        q: 'Harga di form panen tidak otomatis?',
        a: 'Pastikan sudah ada harga komoditas di Pengaturan → Harga Komoditas. Sistem mengambil harga terbaru (yang paling baru ditambahkan).',
      },
      {
        q: 'BS% merah di atas 20%, apa artinya?',
        a: 'BS (Buah Susut/Rusak) di atas 20% artinya kualitas panen perlu diperiksa. Kemungkinan: cuaca hujan, hama, terlambat panen, atau penanganan pasca panen kurang baik.',
      },
      {
        q: 'Apa bedanya Harga Normal dan Harga BS?',
        a: 'Normal = stroberi kualitas bagus (dijual harga penuh). BS (Buah Susut) = stroberi kurang sempurna (bentuk, warna, ukuran) → dijual lebih murah. Biasanya BS 40-50% dari harga normal.',
      },
      {
        q: 'Salah input data panen, bagaimana?',
        a: 'Klik tombol "Edit" di baris data yang salah, lalu perbaiki dan simpan. Data tidak dihapus, hanya diupdate.',
      },
    ],
  },
  {
    category: '📤 Pengeluaran & Anggaran',
    items: [
      {
        q: 'Sumber dana tidak muncul di form?',
        a: 'Pastikan rekening bank sudah ditambahkan di Pengaturan → Rekening Bank dan statusnya AKTIF. Rekening nonaktif tidak muncul di dropdown.',
      },
      {
        q: 'Bedanya Anggaran dan Pengeluaran?',
        a: 'Anggaran = RENCANA biaya sebelum kejadian (boleh estimasi). Pengeluaran = TRANSAKSI nyata yang sudah terjadi (ada bukti). Anggaran untuk perencanaan, Pengeluaran untuk pencatatan.',
      },
      {
        q: 'Hemat/Boros di Anggaran?',
        a: 'Hijau (Hemat) = realisasi lebih murah dari anggaran. Merah (Boros) = realisasi lebih mahal. Selisih = Anggaran − Realisasi.',
      },
      {
        q: 'Bisa upload bukti transfer dari HP?',
        a: 'Bisa. Klik kolom upload → pilih foto dari galeri HP atau ambil foto baru. Format: JPG, PNG, PDF.',
      },
    ],
  },
  {
    category: '🏡 Multi-Kebun',
    items: [
      {
        q: 'Bagaimana cara switch ke kebun lain?',
        a: 'Klik nama kebun di header (atas) atau di sidebar → pilih kebun dari dropdown. Pilihan tersimpan otomatis.',
      },
      {
        q: 'Kapan pakai mode "Semua Kebun"?',
        a: 'Untuk lihat total gabungan semua kebun: total pendapatan, total pengeluaran, export laporan konsolidasi. Data input tetap per kebun.',
      },
      {
        q: 'Menu Modal & Investor tidak muncul?',
        a: 'Menu ini hanya muncul untuk kebun yang ditandai "punya investor" (hasInvestor). Hubungi admin untuk mengaktifkan fitur ini di kebun tertentu.',
      },
    ],
  },
  {
    category: '📄 Export & Laporan',
    items: [
      {
        q: 'Export CSV tidak muncul data?',
        a: 'Pastikan filter tanggal benar. Jika kosong, coba reset filter terlebih dahulu. Export mengikuti filter yang aktif.',
      },
      {
        q: 'Buka CSV di mana?',
        a: 'CSV bisa dibuka di Microsoft Excel, Google Sheets, LibreOffice Calc, atau WPS Office. Cukup double-click file CSV.',
      },
      {
        q: 'Bisa export laporan PDF?',
        a: 'Saat ini hanya tersedia format CSV. Untuk PDF: buka CSV di Excel → File → Save As → PDF.',
      },
    ],
  },
  {
    category: '⚙️ Teknis',
    items: [
      {
        q: 'Aplikasi bisa dipakai di HP?',
        a: 'Bisa! Desain responsif. Di HP: navigasi pakai bottom nav (bawah), sidebar jadi drawer (geser dari kiri).',
      },
      {
        q: 'Data tersimpan di mana?',
        a: 'Data tersimpan di server database (PostgreSQL). Tidak tersimpan di HP/browser. Aman jika HP rusak.',
      },
      {
        q: 'Bagaimana cara backup data?',
        a: 'Export CSV secara berkala dari masing-masing menu (Gaji, Pengeluaran, Panen, dll). Untuk backup database penuh, hubungi admin server.',
      },
      {
        q: 'Aplikasi lambat / error?',
        a: 'Coba: 1) Refresh halaman (F5), 2) Clear cache browser, 3) Cek koneksi internet. Jika masih error, laporkan di menu Revisi.',
      },
      {
        q: 'Bisa pakai offline?',
        a: 'Tidak. Aplikasi butuh koneksi internet untuk akses server. Pastikan sinyal stabil saat input data.',
      },
    ],
  },
]

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function PanduanPage() {
  const [tab, setTab] = useState<Tab>('panduan')
  const [openSection, setOpenSection] = useState<string | null>('login')
  const [openPhase, setOpenPhase] = useState<string | null>('🌅 Pagi (Sebelum Kerja)')
  const [openCase, setOpenCase] = useState<string | null>('kasus-1')
  const [openFaqCat, setOpenFaqCat] = useState<string | null>('🔐 Login & Akun')
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panduan & Workflow</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Cara menggunakan aplikasi, studi kasus, dan FAQ tim</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          ['panduan', '📖 Panduan'],
          ['workflow', '🔄 Workflow'],
          ['studi-kasus', '📋 Studi Kasus'],
          ['faq', '❓ FAQ'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════ Panduan Tab ═══════════ */}
      {tab === 'panduan' && (
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--color-surface-light)] transition-colors"
              >
                <span className="text-xl">{section.icon}</span>
                <span className="flex-1 font-semibold text-sm">{section.title}</span>
                <span className="text-[var(--color-text-muted)] text-xs transition-transform" style={{ transform: openSection === section.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                  ▼
                </span>
              </button>

              {openSection === section.id && (
                <div className="px-5 pb-5 border-t border-[var(--color-border)]">
                  <div className="mt-4 text-sm text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>

                  {section.table && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="text-sm">
                        <thead>
                          <tr>
                            {section.table[0].map((header, i) => (
                              <th key={i} className="text-left">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.slice(1).map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className={j === 0 ? 'font-medium' : 'text-center'}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ Workflow Tab ═══════════ */}
      {tab === 'workflow' && (
        <div className="space-y-3">
          {workflowSteps.map((phase) => (
            <div key={phase.phase} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenPhase(openPhase === phase.phase ? null : phase.phase)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--color-surface-light)] transition-colors"
              >
                <span className="flex-1 font-semibold text-sm">{phase.phase}</span>
                <span className="text-[var(--color-text-muted)] text-xs transition-transform" style={{ transform: openPhase === phase.phase ? 'rotate(180deg)' : 'rotate(0)' }}>
                  ▼
                </span>
              </button>

              {openPhase === phase.phase && (
                <div className="px-5 pb-5 border-t border-[var(--color-border)]">
                  <div className="mt-4 space-y-3">
                    {phase.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{step.label}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Checklist Harian */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4">✅ Checklist Harian (Bisa Di-copy)</h3>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              {[
                'Login ke sistem',
                'Cek Dashboard (ringkasan kemarin)',
                'Input gaji karyawan yang masuk hari ini',
                'Input kasbon (jika ada)',
                'Input pengeluaran (jika ada belanja)',
                'Upload bukti transfer/kwitansi',
                'Input data panen (jika ada panen)',
                'Cek Dashboard → review data hari ini',
                'Pastikan semua data sudah masuk',
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded accent-[var(--color-primary)]" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ Studi Kasus Tab ═══════════ */}
      {tab === 'studi-kasus' && (
        <div className="space-y-3">
          <div className="card bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20">
            <p className="text-sm text-[var(--color-text-muted)]">
              💡 <strong>Studi kasus</strong> adalah contoh nyata penggunaan aplikasi dalam skenario operasional sehari-hari. Ikuti langkah-langkahnya untuk belajar cara menggunakan setiap fitur.
            </p>
          </div>

          {caseStudies.map((cs) => (
            <div key={cs.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenCase(openCase === cs.id ? null : cs.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--color-surface-light)] transition-colors"
              >
                <span className="text-xl">{cs.icon}</span>
                <span className="flex-1 font-semibold text-sm">{cs.title}</span>
                <span className="text-[var(--color-text-muted)] text-xs transition-transform" style={{ transform: openCase === cs.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                  ▼
                </span>
              </button>

              {openCase === cs.id && (
                <div className="px-5 pb-5 border-t border-[var(--color-border)]">
                  <div className="mt-4 mb-4 p-3 rounded-lg bg-[var(--color-surface-light)] text-sm">
                    <p className="font-medium text-[var(--color-text)] mb-1">📌 Skenario:</p>
                    <p className="text-[var(--color-text-muted)]">{cs.scenario}</p>
                  </div>

                  <div className="space-y-3">
                    {cs.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{step.step}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ FAQ Tab ═══════════ */}
      {tab === 'faq' && (
        <div className="space-y-3">
          {faqCategories.map((cat) => (
            <div key={cat.category} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenFaqCat(openFaqCat === cat.category ? null : cat.category)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--color-surface-light)] transition-colors"
              >
                <span className="flex-1 font-semibold text-sm">{cat.category}</span>
                <span className="text-[var(--color-text-muted)] text-xs transition-transform" style={{ transform: openFaqCat === cat.category ? 'rotate(180deg)' : 'rotate(0)' }}>
                  ▼
                </span>
              </button>

              {openFaqCat === cat.category && (
                <div className="border-t border-[var(--color-border)]">
                  {cat.items.map((faq, i) => (
                    <div key={i} className={i > 0 ? 'border-t border-[var(--color-border)]/50' : ''}>
                      <button
                        onClick={() => setOpenFaq(openFaq === `${cat.category}-${i}` ? null : `${cat.category}-${i}`)}
                        className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-[var(--color-surface-light)] transition-colors"
                      >
                        <span className="text-[var(--color-primary)] font-bold text-sm shrink-0 mt-0.5">Q:</span>
                        <span className="flex-1 text-sm font-medium">{faq.q}</span>
                        <span className="text-[var(--color-text-muted)] text-xs transition-transform shrink-0" style={{ transform: openFaq === `${cat.category}-${i}` ? 'rotate(180deg)' : 'rotate(0)' }}>
                          ▼
                        </span>
                      </button>
                      {openFaq === `${cat.category}-${i}` && (
                        <div className="px-5 pb-4 pl-12">
                          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
