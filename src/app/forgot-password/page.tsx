'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim kode OTP')
        return
      }

      setSuccess(data.message)
      setStep(2)
    } catch {
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mereset password')
        return
      }

      setSuccess(data.message)
      setStep(1)
      setUsername('')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍓</div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">StrawberryOps</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Reset Password</p>
        </div>

        <div className="card">
          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                  {success}
                </div>
              )}

              <p className="text-sm text-[var(--color-text-muted)]">
                Masukkan username Anda. Kode OTP akan dikirim ke nomor WhatsApp yang terdaftar.
              </p>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                  {success}
                </div>
              )}

              <p className="text-sm text-[var(--color-text-muted)]">
                Masukkan kode OTP yang dikirim ke WhatsApp Anda dan password baru.
              </p>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                  Kode OTP
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="6 digit kode OTP"
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Memproses...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setError('')
                  setSuccess('')
                }}
                className="btn w-full"
              >
                Kembali
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            Kembali ke halaman login
          </Link>
        </p>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-2">
          © 2024 StrawberryOps
        </p>
      </div>
    </div>
  )
}
