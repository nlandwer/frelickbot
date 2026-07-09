'use client'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  helperText?: string
}

export function ToggleSwitch({ checked, onChange, label, helperText }: ToggleSwitchProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 transition-colors duration-200 ${
            checked
              ? 'border-primary bg-primary/20'
              : 'border-border bg-background'
          }`}
          role="switch"
          aria-checked={checked}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-primary transition-transform duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => onChange(!checked)}>
          {label}
        </label>
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground pl-1">{helperText}</p>
      )}
    </div>
  )
}
