export interface MenuItem {
  label: string
  icon: string
  href: string
  /** Hanya tampil untuk kebun yang memakai pencatatan modal investor. */
  investorOnly?: boolean
}

export interface MenuGroup {
  title: string
  items: MenuItem[]
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Ringkasan',
    items: [{ label: 'Dashboard', icon: '📊', href: '/' }],
  },
  {
    title: 'Operasional',
    items: [
      { label: 'Gaji Harian', icon: '💰', href: '/gaji' },
      { label: 'Periode Gaji', icon: '🗓️', href: '/periode-gaji' },
      { label: 'Kasbon', icon: '🤝', href: '/kasbon' },
      { label: 'Pengeluaran', icon: '📤', href: '/pengeluaran' },
      { label: 'Panen', icon: '🍓', href: '/pendapatan' },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { label: 'Modal & Investor', icon: '🏦', href: '/modal', investorOnly: true },
      { label: 'Anggaran', icon: '🎯', href: '/anggaran' },
      { label: 'Aset & Alat', icon: '🚜', href: '/aset' },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      { label: 'Panduan', icon: '📖', href: '/panduan' },
      { label: 'Karyawan', icon: '👥', href: '/karyawan' },
      { label: 'Revisi', icon: '📝', href: '/revisi' },
      { label: 'Pengaturan', icon: '⚙️', href: '/pengaturan' },
    ],
  },
]

/** Menu ringkas untuk navigasi bawah di layar kecil. */
export const BOTTOM_NAV: MenuItem[] = [
  { label: 'Dashboard', icon: '📊', href: '/' },
  { label: 'Gaji', icon: '💰', href: '/gaji' },
  { label: 'Keluar', icon: '📤', href: '/pengeluaran' },
  { label: 'Panen', icon: '🍓', href: '/pendapatan' },
  { label: 'Periode', icon: '🗓️', href: '/periode-gaji' },
]

export function visibleGroups(showInvestorMenus: boolean): MenuGroup[] {
  return MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.investorOnly || showInvestorMenus),
  })).filter((group) => group.items.length > 0)
}

export function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
