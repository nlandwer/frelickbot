'use client'

import { useState } from 'react'
import { LineChart, TrendingUp } from 'lucide-react'
import { CalculatorSection } from '@/components/calc/calculator-section'
import {
  MoneylineCalculator,
  TotalRunsCalculator,
} from '@/components/calc/calculators'

export default function PregamesPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    moneyline: true,
    totals: false,
  })

  const toggle = (id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <div className="mb-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          MLB · Pregames
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Estimate fair odds and expected value for pregame markets.
        </p>
      </div>

      <CalculatorSection
        id="moneyline"
        title="Moneyline Calculator"
        subtitle="Two-way market EV"
        icon={TrendingUp}
        open={open.moneyline}
        onToggle={() => toggle('moneyline')}
      >
        <MoneylineCalculator />
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
