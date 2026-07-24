'use client'

interface ExportButtonProps {
  type: 'payroll' | 'expenses' | 'harvest'
  startDate?: string
  endDate?: string
}

export default function ExportButton({ type, startDate, endDate }: ExportButtonProps) {
  async function handleExport() {
    const params = new URLSearchParams({ type })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    const res = await fetch(`/api/reports/export?${params}`)
    if (!res.ok) return

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `export-${type}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport} className="btn btn-secondary">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export CSV
    </button>
  )
}
