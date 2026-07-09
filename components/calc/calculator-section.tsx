'use client'

import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function CalculatorSection({
  id,
  title,
  subtitle,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/20"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/40"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-semibold text-card-foreground">{title}</span>
          <span className="truncate text-sm text-muted-foreground">{subtitle}</span>
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-5 border-t border-border px-4 pb-5 pt-5">
          {children}
        </div>
      )}
    </section>
  )
}
