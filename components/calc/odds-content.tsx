'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/lib/settings-context'
import { ToggleSwitch } from '@/components/calc/toggle-switch'

export function OddsContent() {
  const [isMounted, setIsMounted] = useState(false)
  const settings = useSettings()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="text-muted-foreground">Loading settings...</div>
  }

  const helperText = settings.useBallParkPalModel
    ? 'Uses BallParkPal probabilities blended with Pinnacle No-Vig.'
    : 'Uses the standard model without BallParkPal.'

  return (
    <div className="max-w-2xl">
      {/* Moneyline Model Section */}
      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Moneyline Model
        </h3>

        <div className="space-y-4">
          <ToggleSwitch
            checked={settings.useBallParkPalModel}
            onChange={settings.setUseBallParkPalModel}
            label="Use BallParkPal Model"
            helperText={helperText}
          />
        </div>
      </div>

      {/* Additional Settings Placeholder */}
      <div className="mt-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6">
        <p className="text-sm text-muted-foreground">
          More settings coming soon...
        </p>
      </div>
    </div>
  )
}
