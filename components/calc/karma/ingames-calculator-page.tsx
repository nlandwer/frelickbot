'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { EvRow, InputField } from '@/components/calc/fields'
import {
  americanToProbability,
  formatPercent,
  isValidAmericanOdds,
  parseAmericanOddsInput,
} from '@/lib/odds'

type BetType = 'team' | 'totals' | 'yesNo'

const BET_TYPE_OPTIONS: { value: BetType; label: string }[] = [
  { value: 'team', label: 'Team 1 / Team 2' },
  { value: 'totals', label: 'Over / Under' },
  { value: 'yesNo', label: 'Yes / No' },
]

const BET_TYPE_SIDE_LABELS: Record<BetType, { side1: string; side2: string }> = {
  team: { side1: 'Team 1', side2: 'Team 2' },
  totals: { side1: 'Over', side2: 'Under' },
  yesNo: { side1: 'Yes', side2: 'No' },
}

type CalcResult = {
  side1NoVigProb: number
  side2NoVigProb: number
  side1EV0: number
  side1EVMax: number
  side2EV0: number
  side2EVMax: number
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

function formatSignedNumber(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function americanProfit(odds: number, stake: number): number {
  if (odds > 0) return (stake * odds) / 100
  return (stake * 100) / Math.abs(odds)
}

function calculateMarket({
  side1SportsbookOdds,
  side2SportsbookOdds,
  maxBet,
  side1RealOdds,
  side2RealOdds,
  useRealOdds,
}: {
  side1SportsbookOdds: number
  side2SportsbookOdds: number
  maxBet: number
  side1RealOdds?: number
  side2RealOdds?: number
  useRealOdds: boolean
}): CalcResult {
  const side1Implied = americanToProbability(side1SportsbookOdds)
  const side2Implied = americanToProbability(side2SportsbookOdds)

  const side1NoVigProb = side1Implied / (side1Implied + side2Implied)
  const side2NoVigProb = side2Implied / (side1Implied + side2Implied)

  if (!useRealOdds) {
    // Same as Total Runs equations: even payout on 100 wager, fixed +10 on 0 wager.
    return {
      side1NoVigProb,
      side2NoVigProb,
      side1EV0: roundToTwo(side1NoVigProb * 10),
      side1EVMax: roundToTwo((2 * side1NoVigProb - 1) * maxBet),
      side2EV0: roundToTwo(side2NoVigProb * 10),
      side2EVMax: roundToTwo((2 * side2NoVigProb - 1) * maxBet),
    }
  }

  const side1Win0 = Number.isFinite(side1RealOdds) ? americanProfit(side1RealOdds, 10) : 0
  const side2Win0 = Number.isFinite(side2RealOdds) ? americanProfit(side2RealOdds, 10) : 0
  const side1WinMax = Number.isFinite(side1RealOdds) ? americanProfit(side1RealOdds, maxBet) : 0
  const side2WinMax = Number.isFinite(side2RealOdds) ? americanProfit(side2RealOdds, maxBet) : 0

  return {
    side1NoVigProb,
    side2NoVigProb,
    side1EV0: side1NoVigProb * side1Win0,
    side1EVMax: side1NoVigProb * side1WinMax - (1 - side1NoVigProb) * maxBet,
    side2EV0: side2NoVigProb * side2Win0,
    side2EVMax: side2NoVigProb * side2WinMax - (1 - side2NoVigProb) * maxBet,
  }
}

export function IngamesCalculatorPage({
  sport,
  includeRealOdds,
}: {
  sport: 'MLB' | 'WNBA'
  includeRealOdds: boolean
}) {
  const [showRealOdds, setShowRealOdds] = useState(false)
  const [betType, setBetType] = useState<BetType>('team')
  const [sportsbookSide1Odds, setSportsbookSide1Odds] = useState('')
  const [sportsbookSide2Odds, setSportsbookSide2Odds] = useState('')
  const [realSide1Odds, setRealSide1Odds] = useState('')
  const [realSide2Odds, setRealSide2Odds] = useState('')
  const [maxBetAmount, setMaxBetAmount] = useState('50')

  const sides = useMemo(() => BET_TYPE_SIDE_LABELS[betType], [betType])

  const parsedSide1SportsbookOdds = parseAmericanOddsInput(sportsbookSide1Odds)
  const parsedSide2SportsbookOdds = parseAmericanOddsInput(sportsbookSide2Odds)
  const parsedSide1RealOdds = parseAmericanOddsInput(realSide1Odds)
  const parsedSide2RealOdds = parseAmericanOddsInput(realSide2Odds)
  const parsedMaxBet = Number.parseFloat(maxBetAmount)

  const sportsbookOddsValid =
    isValidAmericanOdds(parsedSide1SportsbookOdds) &&
    isValidAmericanOdds(parsedSide2SportsbookOdds)
  const realOddsValid =
    isValidAmericanOdds(parsedSide1RealOdds) && isValidAmericanOdds(parsedSide2RealOdds)
  const maxBetValid = Number.isFinite(parsedMaxBet) && parsedMaxBet > 0

  const useRealOdds = includeRealOdds && showRealOdds

  const canCalculate = useRealOdds
    ? sportsbookOddsValid && realOddsValid && maxBetValid
    : sportsbookOddsValid && maxBetValid

  const result = useMemo(() => {
    if (!canCalculate) return null

    return calculateMarket({
      side1SportsbookOdds: parsedSide1SportsbookOdds,
      side2SportsbookOdds: parsedSide2SportsbookOdds,
      maxBet: parsedMaxBet,
      side1RealOdds: parsedSide1RealOdds,
      side2RealOdds: parsedSide2RealOdds,
      useRealOdds,
    })
  }, [
    canCalculate,
    parsedSide1SportsbookOdds,
    parsedSide2SportsbookOdds,
    parsedSide1RealOdds,
    parsedSide2RealOdds,
    parsedMaxBet,
    useRealOdds,
  ])

  const errors = {
    sportsbookSide1Odds:
      sportsbookSide1Odds.trim() !== '' && !isValidAmericanOdds(parsedSide1SportsbookOdds)
        ? 'Enter valid odds (>= +100 or <= -100)'
        : undefined,
    sportsbookSide2Odds:
      sportsbookSide2Odds.trim() !== '' && !isValidAmericanOdds(parsedSide2SportsbookOdds)
        ? 'Enter valid odds (>= +100 or <= -100)'
        : undefined,
    realSide1Odds:
      realSide1Odds.trim() !== '' && !isValidAmericanOdds(parsedSide1RealOdds)
        ? 'Enter valid odds (>= +100 or <= -100)'
        : undefined,
    realSide2Odds:
      realSide2Odds.trim() !== '' && !isValidAmericanOdds(parsedSide2RealOdds)
        ? 'Enter valid odds (>= +100 or <= -100)'
        : undefined,
  }

  const hasAnyInput =
    sportsbookSide1Odds.trim() !== '' ||
    sportsbookSide2Odds.trim() !== '' ||
    realSide1Odds.trim() !== '' ||
    realSide2Odds.trim() !== ''

  const showValidationMessage = hasAnyInput && !canCalculate

  const bestRows = useMemo(() => {
    if (!result) return new Set<string>()
    const rows = [
      { key: 'side1-ev0', value: result.side1EV0 },
      { key: 'side1-evmax', value: result.side1EVMax },
      { key: 'side2-ev0', value: result.side2EV0 },
      { key: 'side2-evmax', value: result.side2EVMax },
    ]
    const maxValue = Math.max(...rows.map((row) => row.value))
    return new Set(rows.filter((row) => row.value === maxValue).map((row) => row.key))
  }, [result])

  const handleClear = () => {
    setShowRealOdds(false)
    setBetType('team')
    setSportsbookSide1Odds('')
    setSportsbookSide2Odds('')
    setRealSide1Odds('')
    setRealSide2Odds('')
    setMaxBetAmount('50')
  }

  return (
    <>
      <div className="mb-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          {sport} · Ingames
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Use the shared no-vig EV model for ingame markets.
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg shadow-black/20">
        <div className="border-b border-border px-3 py-4 sm:px-4 sm:py-5">
          <h3 className="text-base font-semibold text-card-foreground sm:text-lg">
            {sport} Ingame Calculator
          </h3>
        </div>

        <div className="flex flex-col gap-5 px-3 pb-4 pt-4 sm:px-4 sm:pb-5 sm:pt-5">
          {includeRealOdds ? (
            <label className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3.5 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={showRealOdds}
                onChange={(e) => setShowRealOdds(e.target.checked)}
                className="size-4 rounded border-border bg-input/40 text-primary accent-primary"
              />
              <span className="font-medium">Show Real Odds</span>
            </label>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Bet Type</label>
            <select
              value={betType}
              onChange={(e) => setBetType(e.target.value as BetType)}
              className="h-11 w-full rounded-xl border border-border bg-input/40 px-3.5 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              {BET_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <FieldDivider />

          <div className="flex flex-col gap-3">
            <InputField
              label="Sportsbook Side 1 Odds"
              placeholder={`${sides.side1} American Odds`}
              value={sportsbookSide1Odds}
              onChange={setSportsbookSide1Odds}
              error={errors.sportsbookSide1Odds}
              inputMode="text"
              autoFormatAmericanOdds
            />
            <InputField
              label="Sportsbook Side 2 Odds"
              placeholder={`${sides.side2} American Odds`}
              value={sportsbookSide2Odds}
              onChange={setSportsbookSide2Odds}
              error={errors.sportsbookSide2Odds}
              inputMode="text"
              autoFormatAmericanOdds
            />

            {useRealOdds ? (
              <>
                <InputField
                  label="Real Side 1 Odds"
                  placeholder={`${sides.side1} Real Odds`}
                  value={realSide1Odds}
                  onChange={setRealSide1Odds}
                  error={errors.realSide1Odds}
                  inputMode="text"
                  autoFormatAmericanOdds
                />
                <InputField
                  label="Real Side 2 Odds"
                  placeholder={`${sides.side2} Real Odds`}
                  value={realSide2Odds}
                  onChange={setRealSide2Odds}
                  error={errors.realSide2Odds}
                  inputMode="text"
                  autoFormatAmericanOdds
                />
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Max Bet Amount</label>
            <select
              value={maxBetAmount}
              onChange={(e) => setMaxBetAmount(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-input/40 px-3.5 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-secondary/60 text-base font-semibold text-foreground transition-all hover:bg-secondary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Clear
            </button>
          </div>

          {showValidationMessage ? (
            <p className="rounded-xl border border-border/60 bg-secondary/20 px-3.5 py-3 text-sm text-muted-foreground">
              Enter all required odds.
            </p>
          ) : null}

          {result ? (
            <>
              <FieldDivider />

              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  No-Vig Probability
                </p>
                <EvRow
                  label={`${sides.side1} No-Vig Probability`}
                  value={formatPercent(result.side1NoVigProb)}
                  sign="none"
                />
                <EvRow
                  label={`${sides.side2} No-Vig Probability`}
                  value={formatPercent(result.side2NoVigProb)}
                  sign="none"
                />
              </div>

              <FieldDivider />

              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Expected Value
                </p>
                <EvRow
                  label={`${sides.side1} Expected Value (0)`}
                  value={formatSignedNumber(result.side1EV0)}
                  sign={result.side1EV0 > 0 ? 'pos' : result.side1EV0 < 0 ? 'neg' : 'none'}
                  best={bestRows.has('side1-ev0')}
                />
                <EvRow
                  label={`${sides.side1} Expected Value (${maxBetAmount})`}
                  value={formatSignedNumber(result.side1EVMax)}
                  sign={result.side1EVMax > 0 ? 'pos' : result.side1EVMax < 0 ? 'neg' : 'none'}
                  best={bestRows.has('side1-evmax')}
                />
                <EvRow
                  label={`${sides.side2} Expected Value (0)`}
                  value={formatSignedNumber(result.side2EV0)}
                  sign={result.side2EV0 > 0 ? 'pos' : result.side2EV0 < 0 ? 'neg' : 'none'}
                  best={bestRows.has('side2-ev0')}
                />
                <EvRow
                  label={`${sides.side2} Expected Value (${maxBetAmount})`}
                  value={formatSignedNumber(result.side2EVMax)}
                  sign={result.side2EVMax > 0 ? 'pos' : result.side2EVMax < 0 ? 'neg' : 'none'}
                  best={bestRows.has('side2-evmax')}
                />
              </div>
            </>
          ) : null}

          <Link
            href="/"
            className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-secondary/60 text-base font-semibold text-foreground transition-all hover:bg-secondary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </>
  )
}

function FieldDivider() {
  return <div className="h-px w-full bg-border/60" />
}
