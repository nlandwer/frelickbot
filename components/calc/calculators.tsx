'use client'

import { useMemo, useState } from 'react'
import { useSettings } from '@/lib/settings-context'
import {
  americanToProbability,
  formatAmerican,
  formatPercent,
  isValidAmericanOdds,
  probabilityToAmerican,
} from '@/lib/odds'
import {
  CalculateButton,
  EvRow,
  FieldGroup,
  InputField,
  OutputRow,
} from './fields'

function americanProfit(odds: number, stake: number): number {
  if (odds > 0) return (stake * odds) / 100
  return (stake * 100) / Math.abs(odds)
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

function formatNumber(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function getMoneylineModelProbabilities({
  team1NoVigProb,
  team2NoVigProb,
  useBallParkPalModel,
}: {
  team1NoVigProb: number
  team2NoVigProb: number
  useBallParkPalModel: boolean
}) {
  if (useBallParkPalModel) {
    // BallPark model probabilities can be plugged in here later.
    return { team1ModelProb: team1NoVigProb, team2ModelProb: team2NoVigProb }
  }
  return { team1ModelProb: team1NoVigProb, team2ModelProb: team2NoVigProb }
}

export function MoneylineCalculator() {
  const { useBallParkPalModel } = useSettings()
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [realTeam1Odds, setRealTeam1Odds] = useState('')
  const [realTeam2Odds, setRealTeam2Odds] = useState('')

  const odds1 = Number.parseFloat(team1)
  const odds2 = Number.parseFloat(team2)
  const realT1 = Number.parseFloat(realTeam1Odds)
  const realT2 = Number.parseFloat(realTeam2Odds)

  const errors = {
    team1:
      team1.trim() !== '' && !isValidAmericanOdds(odds1)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
    team2:
      team2.trim() !== '' && !isValidAmericanOdds(odds2)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
    realTeam1Odds:
      realTeam1Odds.trim() !== '' && !isValidAmericanOdds(realT1)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
    realTeam2Odds:
      realTeam2Odds.trim() !== '' && !isValidAmericanOdds(realT2)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
  }

  const result = useMemo(() => {
    const oddsValid = isValidAmericanOdds(odds1) && isValidAmericanOdds(odds2)
    if (!oddsValid) return null

    const p1 = americanToProbability(odds1)
    const p2 = americanToProbability(odds2)

    const team1NoVigProb = p1 / (p1 + p2)
    const team2NoVigProb = p2 / (p1 + p2)
    const { team1ModelProb, team2ModelProb } = getMoneylineModelProbabilities({
      team1NoVigProb,
      team2NoVigProb,
      useBallParkPalModel,
    })

    let team1EV0: number | null = null
    let team1EV100: number | null = null
    let team2EV0: number | null = null
    let team2EV100: number | null = null

    const zeroWagerStake = 10
    const maxWagerStake = 100

    // EV(0) uses only the win branch because losing a 0 wager costs no karma.
    if (isValidAmericanOdds(realT1)) {
      const win0 = americanProfit(realT1, zeroWagerStake)
      const win100 = americanProfit(realT1, maxWagerStake)
      team1EV0 = roundToTwo(team1ModelProb * win0)
      team1EV100 = roundToTwo(
        team1ModelProb * win100 - (1 - team1ModelProb) * maxWagerStake
      )
    }

    if (isValidAmericanOdds(realT2)) {
      const win0 = americanProfit(realT2, zeroWagerStake)
      const win100 = americanProfit(realT2, maxWagerStake)
      team2EV0 = roundToTwo(team2ModelProb * win0)
      team2EV100 = roundToTwo(
        team2ModelProb * win100 - (1 - team2ModelProb) * maxWagerStake
      )
    }

    return {
      team1NoVigOdds: probabilityToAmerican(team1NoVigProb),
      team2NoVigOdds: probabilityToAmerican(team2NoVigProb),
      team1NoVigProb,
      team2NoVigProb,
      team1EV0,
      team1EV100,
      team2EV0,
      team2EV100,
    }
  }, [odds1, odds2, realT1, realT2, useBallParkPalModel])

  return (
    <>
      <FieldGroup title="Inputs">
        <InputField
          label="Team 1 Odds"
          placeholder="-110"
          value={team1}
          onChange={setTeam1}
          error={errors.team1}
        />
        <InputField
          label="Team 2 Odds"
          placeholder="+105"
          value={team2}
          onChange={setTeam2}
          error={errors.team2}
        />
        <InputField
          label="Real Team 1 Odds"
          placeholder="+120"
          value={realTeam1Odds}
          onChange={setRealTeam1Odds}
          error={errors.realTeam1Odds}
        />
        <InputField
          label="Real Team 2 Odds"
          placeholder="-110"
          value={realTeam2Odds}
          onChange={setRealTeam2Odds}
          error={errors.realTeam2Odds}
        />
      </FieldGroup>

      {result ? (
        <>
          <FieldGroup title="Outputs">
            <OutputRow
              label="Team 1 No-Vig Probability"
              value={formatPercent(result.team1NoVigProb)}
            />
            <OutputRow
              label="Team 2 No-Vig Probability"
              value={formatPercent(result.team2NoVigProb)}
            />
          </FieldGroup>

        <FieldGroup title="Expected Value">
          {(() => {
            const values = [
              { val: result.team1EV0, label: 'Team 1 Expected Value (0)' },
              { val: result.team1EV100, label: 'Team 1 Expected Value (100)' },
              { val: result.team2EV0, label: 'Team 2 Expected Value (0)' },
              { val: result.team2EV100, label: 'Team 2 Expected Value (100)' },
            ]

            const numericValues = values
              .map((item) => item.val)
              .filter((val): val is number => val !== null)
            const maxEV =
              numericValues.length > 0 ? Math.max(...numericValues) : null

            return values.map((item, idx) => {
              const isHighest = maxEV !== null && item.val !== null && item.val === maxEV
              const sign: 'pos' | 'neg' | 'none' =
                item.val === null ? 'none' : item.val > 0 ? 'pos' : item.val < 0 ? 'neg' : 'none'

              return (
                <EvRow
                  key={idx}
                  label={item.label}
                  value={item.val !== null ? formatNumber(item.val) : '—'}
                  sign={sign}
                  best={isHighest}
                />
              )
            })
          })()}
        </FieldGroup>
        </>
      ) : null}
    </>
  )
}

export function TotalRunsCalculator() {
  const [overOdds, setOverOdds] = useState('')
  const [underOdds, setUnderOdds] = useState('')

  const over = Number.parseFloat(overOdds)
  const under = Number.parseFloat(underOdds)

  const errors = {
    overOdds:
      overOdds.trim() !== '' && !isValidAmericanOdds(over)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
    underOdds:
      underOdds.trim() !== '' && !isValidAmericanOdds(under)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
  }

  const result = useMemo(() => {
    const valid = isValidAmericanOdds(over) && isValidAmericanOdds(under)
    if (!valid) return null

    // Step 1: Convert sportsbook odds to implied probabilities.
    const overProb = americanToProbability(over)
    const underProb = americanToProbability(under)

    // Step 2: Remove vig; these no-vig probabilities are the model probabilities.
    const overNoVigProb = overProb / (overProb + underProb)
    const underNoVigProb = underProb / (overProb + underProb)

    // Step 3/4: Wager 0 uses fixed +10 on win; wager 100 is even-money +/-100.
    const overEV0 = roundToTwo(overNoVigProb * 10)
    const underEV0 = roundToTwo(underNoVigProb * 10)
    const overEV100 = roundToTwo((2 * overNoVigProb - 1) * 100)
    const underEV100 = roundToTwo((2 * underNoVigProb - 1) * 100)

    return {
      overNoVigProb,
      underNoVigProb,
      overNoVigOdds: probabilityToAmerican(overNoVigProb),
      underNoVigOdds: probabilityToAmerican(underNoVigProb),
      overEV0,
      overEV100,
      underEV0,
      underEV100,
    }
  }, [over, under])

  return (
    <>
      <FieldGroup title="Inputs">
        <InputField
          label="Over Odds"
          placeholder="-115"
          value={overOdds}
          onChange={setOverOdds}
          error={errors.overOdds}
        />
        <InputField
          label="Under Odds"
          placeholder="+100"
          value={underOdds}
          onChange={setUnderOdds}
          error={errors.underOdds}
        />
      </FieldGroup>

      {result ? (
        <>
          <FieldGroup title="Outputs">
            <OutputRow
              label="Over No-Vig Probability"
              value={formatPercent(result.overNoVigProb)}
            />
            <OutputRow
              label="Under No-Vig Probability"
              value={formatPercent(result.underNoVigProb)}
            />
          </FieldGroup>

          <FieldGroup title="Expected Value">
            {(() => {
              const values = [
                { val: result.overEV0, label: 'Over Expected Value (0)' },
                { val: result.overEV100, label: 'Over Expected Value (100)' },
                { val: result.underEV0, label: 'Under Expected Value (0)' },
                { val: result.underEV100, label: 'Under Expected Value (100)' },
              ]

              const maxEV = Math.max(...values.map((item) => item.val))

              return values.map((item, idx) => {
                const isHighest = item.val === maxEV
                const sign: 'pos' | 'neg' | 'none' =
                  item.val > 0 ? 'pos' : item.val < 0 ? 'neg' : 'none'

                return (
                  <EvRow
                    key={idx}
                    label={item.label}
                    value={formatNumber(item.val)}
                    sign={sign}
                    best={isHighest}
                  />
                )
              })
            })()}
          </FieldGroup>
        </>
      ) : null}
    </>
  )
}

export function PlayerPropsCalculator() {
  return (
    <>
      <FieldGroup title="Inputs">
        <InputField label="BallPark Odds" placeholder="+130" />
        <InputField label="DraftKings Over Odds" placeholder="-110" />
        <InputField label="DraftKings Under Odds" placeholder="-110" />
        <InputField label="Estimated Real Placement" placeholder="1.5" />
      </FieldGroup>

      <FieldGroup title="Outputs">
        <OutputRow label="DraftKings No-Vig Probability" value="—" />
        <OutputRow label="Model Probability" value="—" />
        <OutputRow label="Fair Odds" value="—" />
        <OutputRow label="Karma Payout" value="—" />
        <OutputRow label="Expected Karma" value="—" highlight />
      </FieldGroup>

      <CalculateButton />
    </>
  )
}

export function ComingSoonCard({ sport }: { sport: string }) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">
          {sport} calculators coming soon.
        </p>
      </div>
    </div>
  )
}

export function ComingSoonSection() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">
          Coming soon.
        </p>
      </div>
    </div>
  )
}

export function TotalBasesCalculator() {
  return <ComingSoonSection />
}

export function RBICalculator() {
  return <ComingSoonSection />
}

export function StrikoutsCalculator() {
  return <ComingSoonSection />
}

export function DogOfTheDayCalculator() {
  return <ComingSoonSection />
}

export function PoolCalculator() {
  return <ComingSoonSection />
}
