'use client'

import { Suspense } from 'react'
import { OddsContent } from '@/components/calc/odds-content'

export default function SettingsOddsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading settings...</div>}>
      <OddsContent />
    </Suspense>
  )
}
