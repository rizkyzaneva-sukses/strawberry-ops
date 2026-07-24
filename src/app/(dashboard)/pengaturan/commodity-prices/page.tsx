'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import StatCard from '@/components/ui/StatCard'
import { formatIDR, formatDate } from '@/lib/utils'

interface CommodityPrice {
  id: number
  effectiveDate: string
  normalPricePerKg: number
  bsPricePerKg: number
  user: { id: number; fullName: string }
  createdAt: string
}

export default function CommodityPricesPage() {
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [latest, setLatest] = useState<CommodityPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formDate, setFormDate] = useState('')
  const [formNormalPrice, setFormNormalPrice] = useState('')
  const [formBsPrice, setFormBsPrice] = useState('')

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/commodity-prices')
    const data = await res.json()
    setPrices(data.prices || [])
    setLatest(data.latest || null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPrices() }, [fetchPrices])

  function openForm() {
    setFormDate(new Date().toISOString().split('T')[0])
    setFormNormalPrice(latest ? String(latest.normalPricePerKg) : '')
    setFormBsPrice(latest ? String(latest.bsPricePerKg) : '')
    setShowForm(true)
  }

  async function handleSave() {
    if (!formNormalPrice || !formBsPrice) return
    setSaving(true)
    const res = await fetch('/api/commodity-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        effectiveDate: formDate,
        normalPricePerKg: formNormalPrice,
        bsPricePerKg: formBsPrice,
      }),
    })
    if (res.ok) { setShowForm(false); fetchPrices() }
    setSaving(false)
  }

  const columns: Column<CommodityPrice>[] = [
    { key: 'effectiveDate', label: 'Tanggal Berlaku', sortable: true, render: (r) => formatDate(r.effectiveDate) },
    { key: 'normalPricePerKg', label: 'Harga Normal/kg', align: 'right', render: (r) => formatIDR(r.normalPricePerKg) },
    { key: 'bsPricePerKg', label: 'Harga BS/kg', align: 'right', render: (r) => formatIDR(r.bsPricePerKg) },
    { key: 'user', label: 'Diubah Oleh', render: (r) => r.user.fullName },
    { key: 'createdAt', label: 'Tanggal Input', render: (r) => formatDate(r.createdAt) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Harga Komoditas</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Kelola harga beli stroberi per kg</p>
        </div>
        <button onClick={openForm} className="btn btn-primary">+ Update Harga</button>
      </div>

      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Harga Normal/kg (terbaru)" value={latest.normalPricePerKg} icon="✅" color="#22C55E" />
          <StatCard label="Harga BS/kg (terbaru)" value={latest.bsPricePerKg} icon="⚠️" color="#EF4444" />
        </div>
      )}

      <DataTable columns={columns} data={prices} loading={loading} emptyMessage="Belum ada data harga komoditas" />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Update Harga Komoditas">
        <div className="space-y-4">
          <FormField label="Tanggal Berlaku">
            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </FormField>
          <FormField label="Harga Normal/kg (Rp)" required>
            <input type="number" value={formNormalPrice} onChange={(e) => setFormNormalPrice(e.target.value)} placeholder="0" min="0" />
          </FormField>
          <FormField label="Harga BS/kg (Rp)" required>
            <input type="number" value={formBsPrice} onChange={(e) => setFormBsPrice(e.target.value)} placeholder="0" min="0" />
          </FormField>

          {formNormalPrice && formBsPrice && (
            <div className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)]">Preview:</p>
              <p className="text-sm mt-1">Normal: <span className="font-bold">{formatIDR(parseInt(formNormalPrice) || 0)}/kg</span></p>
              <p className="text-sm">BS: <span className="font-bold">{formatIDR(parseInt(formBsPrice) || 0)}/kg</span></p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving || !formNormalPrice || !formBsPrice} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
