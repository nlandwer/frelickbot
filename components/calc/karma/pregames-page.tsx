'use client'

import { useState } from 'react'
import { LineChart, TrendingUp } from 'lucide-react'
import { CalculatorSection } from '@/components/calc/calculator-section'
import {
  MoneylineCalculator,
  SpreadCalculator,
  TotalRunsCalculator,
} from '@/components/calc/calculators'

export function PregamesPage({ sport }: { sport: 'MLB' | 'WNBA' }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    primary: true,
    totals: false,
  })

  const toggle = (id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isWNBA = sport === 'WNBA'

  return (
    <>
      <div className="mb-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          {sport} · Pregames
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Estimate fair odds and expected value for pregame markets.
        </p>
      </div>

      <CalculatorSection
        id="primary"
        title={isWNBA ? 'Spread Calculator' : 'Moneyline Calculator'}
        subtitle="Two-way market EV"
        icon={TrendingUp}
        open={open.primary}
        onToggle={() => toggle('primary')}
      >
        {isWNBA ? <SpreadCalculator /> : <MoneylineCalculator />}
      </CalculatorSection>

      <CalculatorSection
        id="totals"
        title="Total Runs Calculator"
        subtitle="Over / under modeling"
        icon={LineChart}
        open={open.totals}
        onToggle={() => toggle('totals')}
      >
        <TotalRunsCalculator />
      </CalculatorSection>
    </>
  )
}
