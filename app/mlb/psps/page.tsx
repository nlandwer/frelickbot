'use client'

import { useState } from 'react'
import { Target } from 'lucide-react'
import { CalculatorSection } from '@/components/calc/calculator-section'
import {
  TotalBasesCalculator,
  RBICalculator,
  StrikoutsCalculator,
} from '@/components/calc/calculators'

export default function PSPsPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    totalBases: false,
    rbi: false,
    strikeouts: false,
  })

  const toggle = (id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <div className="mb-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          MLB · PSPs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Estimate fair odds and expected value for player props.
        </p>
      </div>

      <CalculatorSection
        id="totalBases"
        title="Total Bases Calculator"
        subtitle="Prop modeling"
        icon={Target}
        open={open.totalBases}
        onToggle={() => toggle('totalBases')}
      >
        <TotalBasesCalculator />
      </CalculatorSection>

      <CalculatorSection
        id="rbi"
        title="RBI Calculator"
        subtitle="Prop modeling"
        icon={Target}
        open={open.rbi}
        onToggle={() => toggle('rbi')}
      >
        <RBICalculator />
      </CalculatorSection>

      <CalculatorSection
        id="strikeouts"
        title="Strikeouts Calculator"
        subtitle="Prop modeling"
        icon={Target}
        open={open.strikeouts}
        onToggle={() => toggle('strikeouts')}
      >
        <StrikoutsCalculator />
      </CalculatorSection>
    </>
  )
}
