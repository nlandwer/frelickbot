// American odds and probability helpers for EV calculators.

/** Valid American odds are integers <= -100 or >= +100 (never 0 or -99..99). */
export function isValidAmericanOdds(value: number): boolean {
  return Number.isFinite(value) && (value >= 100 || value <= -100)
}

/** Parse an American-odds input string into a number (supports +105, 105, -110). */
export function parseAmericanOddsInput(value: string): number {
  const trimmed = value.trim()
  if (trimmed === '') return Number.NaN
  return Number.parseFloat(trimmed)
}

/** Add a leading + for unsigned positive odds on blur (e.g., 110 -> +110). */
export function normalizeAmericanOddsInput(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') return ''
  if (/^\d+$/.test(trimmed)) return `+${trimmed}`
  return trimmed
}

/** Convert American odds to implied probability (0..1). */
export function americanToProbability(odds: number): number {
  if (odds > 0) return 100 / (odds + 100)
  return -odds / (-odds + 100)
}

/** Convert American odds to decimal odds (total return per unit staked). */
export function americanToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1
  return 100 / -odds + 1
}

/** Convert a probability (0..1) to fair American odds. */
export function probabilityToAmerican(prob: number): number {
  if (prob <= 0 || prob >= 1) return Number.NaN
  if (prob >= 0.5) return -Math.round((prob / (1 - prob)) * 100)
  return Math.round(((1 - prob) / prob) * 100)
}

/** Format American odds with an explicit +/- sign. */
export function formatAmerican(odds: number): string {
  if (!Number.isFinite(odds)) return '—'
  return odds > 0 ? `+${odds}` : `${odds}`
}

/** Format a probability (0..1) as a percentage string. */
export function formatPercent(prob: number): string {
  if (!Number.isFinite(prob)) return '—'
  return `${(prob * 100).toFixed(1)}%`
}

/** Format a value (0..1 ratio) as a signed percentage, e.g. +4.2% / -1.8%. */
export function formatSignedPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '—'
  const pct = ratio * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

/** Format a dollar amount with a sign, e.g. +$4.20 / -$1.80. */
export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  const sign = amount >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(amount).toFixed(2)}`
}
