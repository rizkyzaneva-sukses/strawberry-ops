'use client'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export default function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
        {label}
        {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--color-accent)] mt-1">{error}</p>}
    </div>
  )
}
