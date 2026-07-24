'use client'

import { useState } from 'react'

type Tab = 'panduan' | 'workflow'

const sections = [
  {
    id: 'login',
    icon: '🔐',
    title: 'Login Pertama Kali',
    content: `Buka aplikasi di browser, lalu masukkan:

• Username: admin
• Password: admin123

PENTING: Segera ubah password setelah login pertama kali melalui menu profil di pojok kanan atas → "Ubah Password".`,
  },
  {
    id: 'role',
    icon: '👥',
    title: 'Sistem Role (Hak Akses)',
    content: `Ada 3 role dengan akses berbeda:

OWNER (Pemilik)
• Akses semua fitur
• Satu-satunya yang bisa kelola user dan lihat log aktivitas
• Cocok untuk: pemilik kebun

MANAGER (Manajer)
• Akses semua fitur operasional + pengaturan bank & harga komoditas
• Tidak bisa kelola user atau lihat log aktivitas
• Cocok untuk: kepala kebun / manajer operasional

STAFF (Staf)
• Akses fitur operasional saja (input data)
• Tidak bisa akses pengaturan sama sekali
• Cocok untuk: pekerja yang input data harian`,
    table: [
      ['Menu', 'OWNER', 'MANAGER', 'STAFF'],
      ['Dashboard', '✅', '✅', '✅'],
      ['Rekap Gaji', '✅', '✅', '✅'],
      ['Pengeluaran', '✅', '✅', '✅'],
      ['Pendapatan Panen', '✅', '✅', '✅'],
      ['Database Karyawan', '✅', '✅', '✅'],
      ['Revisi & Usulan', '✅', '✅', '✅'],
      ['Rekening Bank', '✅', '✅', '❌'],
      ['Harga Komoditas', '✅', '✅', '❌'],
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
• Persentase BS (%) diwarnai merah jika > 20% (perlu perhatian)`,
  },
  {
    id: 'karyawan',
    icon: '👥',
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
• BORONGAN → Dibayar per pekerjaan/selesai (contoh: Rp 200.000/borongan)`,
  },
  {
    id: 'gaji',
    icon: '💰',
    title: 'Rekap Gaji',
    content: `Catat absensi dan hitung upah karyawan.

Menambah Record Gaji:
1. Klik "+ Input Gaji"
2. Pilih Karyawan dari dropdown (menampilkan info tipe upah & tarif)
3. Isi Tanggal Kerja
4. Isi Area Kerja (opsional, misal: "Blok A")
5. Isi Jam Masuk dan Jam Keluar (opsional)
6. Klik "Simpan"

Perhitungan Otomatis:
• HARIAN → Upah = tarif/hari (flat)
• PER_JAM → Upah = tarif × max(jam_kerja, minimum_jam)
• BORONGAN → Upah = tarif/borongan (flat)

Contoh:
• Karyawan Per Jam, tarif Rp 15.000/jam, minimum 4 jam
• Hari ini kerja 3 jam → upah = 15.000 × 4 = Rp 60.000 (pakai minimum)
• Hari ini kerja 6 jam → upah = 15.000 × 6 = Rp 90.000`,
  },
  {
    id: 'pengeluaran',
    icon: '📤',
    title: 'Pengeluaran',
    content: `Catat semua biaya operasional kebun.

Kategori Pengeluaran:
• Gaji → Gaji bulanan staf tetap
• Pupuk & Obat → Pupuk NPK, pestisida
• Alat & Perlengkapan → Cangkul, pot, selang
• Transportasi → Bensin, ongkir
• Sewa → Sewa lahan, sewa alat
• Utilitas → Listrik, air
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

Tips: Selalu upload bukti transfer/kwitansi untuk pencatatan yang rapi.`,
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
   • Area Kerja (opsional, misal: "Blok A")
   • Harga Normal/kg (wajib, otomatis terisi dari harga terbaru)
   • Harga BS/kg (wajib, otomatis terisi dari harga terbaru)
   • Total Panen (kg) (wajib)
   • Berat BS (kg) (default: 0)
   • Catatan (opsional)
3. Klik "Simpan"

Perhitungan Otomatis:
• Normal (kg) = Total Panen - Berat BS
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

Peringatan: Jika BS% > 20%, akan ditandai merah.`,
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
• Role: OWNER / MANAGER / STAFF

Rekening Bank (OWNER + MANAGER)
• Daftar rekening/sumber dana yang muncul di form Pengeluaran
• Bisa toggle aktif/nonaktif tanpa menghapus
• Contoh: "Kas Utama" (Tunai), "BCA Operasional"

Harga Komoditas (OWNER + MANAGER)
• Harga stroberi per kg (normal & BS)
• Riwayat harga disimpan (tidak bisa diedit, hanya tambah baru)
• Harga terbaru otomatis mengisi form Pendapatan Panen
• Default: Normal Rp 35.000/kg, BS Rp 15.000/kg

Log Aktivitas (OWNER saja)
• Catatan semua aktivitas di sistem: siapa, kapan, melakukan apa
• Bisa filter berdasarkan tanggal
• Berguna untuk audit dan tracking perubahan data`,
  },
  {
    id: 'export',
    icon: '📄',
    title: 'Export Laporan',
    content: `Tersedia di 3 halaman: Rekap Gaji, Pengeluaran, Pendapatan Panen.

Cara Export:
1. Atur filter tanggal sesuai periode yang diinginkan
2. Klik tombol "Export CSV"
3. File CSV otomatis terdownload

Format file: CSV (bisa dibuka di Excel/Google Sheets)
Yang di-export: Sesuai filter tanggal yang aktif. Jika tidak ada filter, export semua data.`,
  },
  {
    id: 'password',
    icon: '🔑',
    title: 'Lupa Password & Ubah Password',
    content: `Lupa Password:
1. Buka halaman login
2. Klik "Lupa Password?"
3. Masukkan username, klik "Kirim Kode OTP"
4. Kode OTP 6 digit akan dikirim via WhatsApp
5. Masukkan kode OTP + password baru + konfirmasi
6. Klik "Reset Password"

Catatan: Fitur ini membutuhkan nomor HP yang terdaftar di sistem dan WhatsApp API (WAHA) yang aktif.

Ubah Password:
1. Klik profil di pojok kanan atas
2. Pilih "Ubah Password"
3. Masukkan password saat ini, password baru, konfirmasi
4. Klik "Simpan Password"

Password baru minimal 6 karakter.`,
  },
  {
    id: 'faq',
    icon: '❓',
    title: 'FAQ & Troubleshooting',
    content: `Saya tidak bisa akses menu Pengaturan?
→ Menu Pengaturan hanya untuk role OWNER dan MANAGER. Jika Anda STAFF, minta admin untuk mengubah role Anda.

Harga di form panen tidak otomatis?
→ Pastikan sudah ada harga komoditas di Pengaturan → Harga Komoditas. Sistem mengambil harga terbaru.

Saya salah input data, bagaimana?
→ Klik tombol "Edit" di baris data yang salah, lalu perbaiki dan simpan. Data tidak bisa dihapus permanen (soft delete).

Export CSV tidak muncul data?
→ Pastikan filter tanggal sudah benar. Jika kosong, coba reset filter terlebih dahulu.

Lupa password admin?
→ Jalankan ulang seed database (akan HAPUS SEMUA DATA):
  npx prisma db push --force-reset
  npx tsx prisma/seed.ts

Bagaimana cara backup data?
→ Copy file prisma/dev.db secara berkala. File ini berisi seluruh database.`,
  },
]

const workflowSteps = [
  {
    phase: '🌅 Pagi (Sebelum Kerja)',
    steps: [
      { label: 'Login ke sistem', desc: 'Masuk dengan username dan password' },
      { label: 'Cek Dashboard', desc: 'Lihat ringkasan data kemarin, cek margin dan BS%' },
      { label: 'Cek harga komoditas', desc: 'Pastikan harga normal dan BS sudah benar' },
    ],
  },
  {
    phase: '☀️ Siang (Saat Kerja)',
    steps: [
      { label: 'Input Gaji Karyawan', desc: 'Setelah kerja selesai, catat jam masuk & keluar, sistem hitung upah otomatis' },
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
    phase: '📅 Mingguan',
    steps: [
      { label: 'Review tren 7 hari', desc: 'Dashboard → filter 7 Hari, bandingkan pendapatan vs pengeluaran' },
      { label: 'Export laporan mingguan', desc: 'Export CSV dari Gaji, Pengeluaran, dan Pendapatan' },
      { label: 'Update harga jika perlu', desc: 'Pengaturan → Harga Komoditas → Tambah Harga Baru' },
    ],
  },
  {
    phase: '📆 Bulanan',
    steps: [
      { label: 'Review tren bulanan', desc: 'Dashboard → filter 1 Tahun, cek grafik bulanan' },
      { label: 'Export laporan bulanan', desc: 'Export semua CSV untuk arsip bulanan' },
      { label: 'Review log aktivitas', desc: '(OWNER) Cek siapa melakukan apa bulan ini' },
      { label: 'Backup database', desc: 'Copy file prisma/dev.db sebagai backup' },
    ],
  },
]

export default function PanduanPage() {
  const [tab, setTab] = useState<Tab>('panduan')
  const [openSection, setOpenSection] = useState<string | null>('login')
  const [openPhase, setOpenPhase] = useState<string | null>('🌅 Pagi (Sebelum Kerja)')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panduan & Workflow</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Cara menggunakan aplikasi dan alur kerja tim</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('panduan')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'panduan'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          📖 Panduan Penggunaan
        </button>
        <button
          onClick={() => setTab('workflow')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'workflow'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          🔄 Workflow Tim
        </button>
      </div>

      {/* Panduan Tab */}
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

      {/* Workflow Tab */}
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
    </div>
  )
}
