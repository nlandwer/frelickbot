import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function InputField({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  error?: string
}) {
  const editable = typeof onChange === 'function'
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        readOnly={!editable}
        value={editable ? value : undefined}
        onChange={editable ? (e) => onChange(e.target.value) : undefined}
        aria-invalid={error ? true : undefined}
        className={`h-11 w-full rounded-xl border bg-input/40 px-3.5 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:ring-2 ${
          error
            ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
            : 'border-border focus:border-primary focus:ring-primary/30'
        }`}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function OutputRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? 'text-base font-semibold text-primary tabular-nums'
            : 'text-base font-semibold text-foreground tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  )
}

export function EvRow({
  label,
  value,
  sign,
  best,
}: {
  label: string
  value: string
  sign: 'pos' | 'neg' | 'none'
  best?: boolean
}) {
  const valueColor =
    sign === 'pos'
      ? 'text-emerald-400'
      : sign === 'neg'
        ? 'text-red-400'
        : 'text-foreground'
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1.5 text-base font-semibold tabular-nums ${valueColor}`}>
        {best ? <Check className="size-4 text-emerald-400" aria-label="Best value" /> : null}
        {value}
      </span>
    </div>
  )
}

export function CopyResultsButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText())
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          setCopied(false)
        }
      }}
      className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 text-base font-semibold text-foreground transition-all hover:bg-secondary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
      {copied ? 'Copied!' : 'Copy Results'}
    </button>
  )
}

export function CalculateButton() {
  return (
    <button
      type="button"
      className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      Calculate
    </button>
  )
}

export function FieldGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </p>
      {children}
    </div>
  )
}
