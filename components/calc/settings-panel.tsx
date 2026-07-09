'use client'

import { Settings } from 'lucide-react'
import { useState } from 'react'

function ToggleRow({ label, description }: { label: string; description: string }) {
  const [on, setOn] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? 'bg-primary' : 'bg-input'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-foreground transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export function SettingsPanel() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/20">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Settings className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-card-foreground">Settings</span>
          <span className="text-sm text-muted-foreground">Preferences and display</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-5">
        <ToggleRow label="Remove Vig Automatically" description="Strip bookmaker margin on load" />
        <ToggleRow label="Round Fair Odds" description="Display odds to the nearest whole number" />
        <ToggleRow label="Show Expected Value %" description="Display EV as a percentage" />
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-sm font-medium text-muted-foreground">Default Bankroll Unit</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="$100"
            readOnly
            className="h-11 w-full rounded-xl border border-border bg-input/40 px-3.5 text-base text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
    </section>
  )
}
