'use client'

import { useMemo, useState } from 'react'
import { useSettings } from '@/lib/settings-context'
import {
  americanToDecimal,
  americanToProbability,
  formatPercent,
  isValidAmericanOdds,
} from '@/lib/odds'
import {
  CalculateButton,
  EvRow,
  FieldGroup,
  InputField,
  OutputRow,
} from './fields'

const PINNACLE_WEIGHT = 0.6
const BALLPARK_WEIGHT = 0.4

export function MoneylineCalculator() {
  const { useBallParkPalModel } = useSettings()
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [ballpark, setBallpark] = useState('')
  const [realTeam1Odds, setRealTeam1Odds] = useState('')
  const [realTeam2Odds, setRealTeam2Odds] = useState('')

  const odds1 = Number.parseFloat(team1)
  const odds2 = Number.parseFloat(team2)
  const bp = Number.parseFloat(ballpark)
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
    ballpark:
      ballpark.trim() !== '' && (!Number.isFinite(bp) || bp <= 0 || bp >= 100)
        ? 'Enter a win % between 0 and 100'
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
    const bpValid = Number.isFinite(bp) && bp > 0 && bp < 100
    if (!oddsValid || !bpValid) return null

    const p1 = americanToProbability(odds1)
    const p2 = americanToProbability(odds2)
    const noVig = p1 / (p1 + p2)
    const weighted = PINNACLE_WEIGHT * noVig + BALLPARK_WEIGHT * (bp / 100)

    let team1EV: number | null = null
    let team2EV: number | null = null
    if (isValidAmericanOdds(realT1)) {
      team1EV = weighted * americanToDecimal(realT1) - 1
    }
    if (isValidAmericanOdds(realT2)) {
      team2EV = (1 - weighted) * americanToDecimal(realT2) - 1
    }

    return { team1EV, team2EV }
  }, [odds1, odds2, bp, realT1, realT2])

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
        {useBallParkPalModel && (
          <InputField
            label="BallPark Team 1 Win %"
            placeholder="52.5"
            value={ballpark}
            onChange={setBallpark}
            error={errors.ballpark}
          />
        )}
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

      {result && (result.team1EV !== null || result.team2EV !== null) ? (
        <FieldGroup title="Expected Value">
          {(() => {
            const values = [
              { val: result.team1EV, label: 'Team 1 EV (0 Bet)', isBet: false },
              { val: result.team1EV, label: 'Team 1 EV (100 Bet)', isBet: true },
              { val: result.team2EV, label: 'Team 2 EV (0 Bet)', isBet: false },
              { val: result.team2EV, label: 'Team 2 EV (100 Bet)', isBet: true },
            ]
            const maxEV = values.reduce((max, curr) => 
              curr.val !== null && (max === null || (max.val !== null && curr.val > max.val))
                ? curr 
                : max, 
              null as typeof values[0] | null
            )
            return values.map((item, idx) => {
              const isHighest = maxEV !== null && item.val === maxEV.val && item.label === maxEV.label
              
              let sign: 'pos' | 'neg' | 'none'
              if (item.isBet) {
                // 100 Bet rows: green if > 0, red if < 0
                sign = item.val === null || item.val === 0 
                  ? 'none' 
                  : item.val > 0 
                    ? 'pos' 
                    : 'neg'
              } else {
                // 0 Bet rows: green only if highest EV, otherwise white
                sign = isHighest ? 'pos' : 'none'
              }
              
              return (
                <EvRow
                  key={idx}
                  label={item.label}
                  value={item.val !== null ? formatPercent(item.val) : '—'}
                  sign={sign}
                  best={isHighest}
                />
              )
            })
          })()}
        </FieldGroup>
      ) : null}
    </>
  )
}

export function TotalRunsCalculator() {
  const { useBallParkPalModel } = useSettings()
  const [pinnacleOverOdds, setPinnacleOverOdds] = useState('')
  const [pinnacleUnderOdds, setPinnacleUnderOdds] = useState('')
  const [ballparkLowerOdds, setBallparkLowerOdds] = useState('')
  const [ballparkHigherOdds, setBallparkHigherOdds] = useState('')

  const pOver = Number.parseFloat(pinnacleOverOdds)
  const pUnder = Number.parseFloat(pinnacleUnderOdds)
  const bLower = Number.parseFloat(ballparkLowerOdds)
  const bHigher = Number.parseFloat(ballparkHigherOdds)

  const errors = {
    pinnacleOverOdds:
      pinnacleOverOdds.trim() !== '' && !isValidAmericanOdds(pOver)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
    pinnacleUnderOdds:
      pinnacleUnderOdds.trim() !== '' && !isValidAmericanOdds(pUnder)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
    ballparkLowerOdds:
      ballparkLowerOdds.trim() !== '' && !isValidAmericanOdds(bLower)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
    ballparkHigherOdds:
      ballparkHigherOdds.trim() !== '' && !isValidAmericanOdds(bHigher)
        ? 'Enter valid odds (≥ +100 or ≤ -100)'
        : undefined,
  }

  const result = useMemo(() => {
    const pValid = isValidAmericanOdds(pOver) && isValidAmericanOdds(pUnder)
    const bValid = isValidAmericanOdds(bLower) && isValidAmericanOdds(bHigher)
    if (!pValid || !bValid) return null

    // Step 1: Convert Pinnacle odds to probabilities
    const pOverProb = americanToProbability(pOver)
    const pUnderProb = americanToProbability(pUnder)

    // Step 2: Remove vig from Pinnacle
    const pinnacleNoVig = pOverProb / (pOverProb + pUnderProb)

    // Step 3: Convert BallPark odds to probabilities
    const bLowerProb = americanToProbability(bLower)
    const bHigherProb = americanToProbability(bHigher)

    // Step 4: Blend probabilities (75% BallPark, 25% Pinnacle no-vig)
    const ballparkNoVig = bHigherProb / (bLowerProb + bHigherProb)
    const weighted = 0.75 * ballparkNoVig + 0.25 * pinnacleNoVig

    return { overProb: weighted, underProb: 1 - weighted }
  }, [pOver, pUnder, bLower, bHigher])

  return (
    <>
      <FieldGroup title="Inputs">
        <InputField
          label="Pinnacle Over Odds"
          placeholder="-115"
          value={pinnacleOverOdds}
          onChange={setPinnacleOverOdds}
          error={errors.pinnacleOverOdds}
        />
        <InputField
          label="Pinnacle Under Odds"
          placeholder="+100"
          value={pinnacleUnderOdds}
          onChange={setPinnacleUnderOdds}
          error={errors.pinnacleUnderOdds}
        />
        {useBallParkPalModel && (
          <>
            <InputField
              label="BallPark Lower Total Odds"
              placeholder="-120"
              value={ballparkLowerOdds}
              onChange={setBallparkLowerOdds}
              error={errors.ballparkLowerOdds}
            />
            <InputField
              label="BallPark Higher Total Odds"
              placeholder="+110"
              value={ballparkHigherOdds}
              onChange={setBallparkHigherOdds}
              error={errors.ballparkHigherOdds}
            />
          </>
        )}
      </FieldGroup>

      {result ? (
        <FieldGroup title="Expected Value">
          {(() => {
            const values = [
              { val: result.overProb, label: 'Over EV (0 Bet)', isBet: false },
              { val: result.overProb, label: 'Over EV (100 Bet)', isBet: true },
              { val: result.underProb, label: 'Under EV (0 Bet)', isBet: false },
              { val: result.underProb, label: 'Under EV (100 Bet)', isBet: true },
            ]
            const maxEV = values.reduce((max, curr) => 
              curr.val !== null && (max === null || (max.val !== null && curr.val > max.val))
                ? curr 
                : max, 
              null as typeof values[0] | null
            )
            return values.map((item, idx) => {
              const isHighest = maxEV !== null && item.val === maxEV.val && item.label === maxEV.label
              
              let sign: 'pos' | 'neg' | 'none'
              if (item.isBet) {
                // 100 Bet rows: green if > 0.5, red if < 0.5
                sign = item.val === null
                  ? 'none'
                  : item.val > 0.5
                    ? 'pos'
                    : item.val < 0.5
                      ? 'neg'
                      : 'none'
              } else {
                // 0 Bet rows: green only if highest EV, otherwise white
                sign = isHighest ? 'pos' : 'none'
              }
              
              return (
                <EvRow
                  key={idx}
                  label={item.label}
                  value={item.val !== null ? formatPercent(item.val) : '—'}
                  sign={sign}
                  best={isHighest}
                />
              )
            })
          })()}
        </FieldGroup>
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
