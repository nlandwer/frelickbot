'use client'

import { useMemo, useRef, useState } from 'react'
import { generatePoolEntries, formatPoolEntry, Game, PoolEntry } from '@/lib/pool-utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  isValidAmericanOdds,
  normalizeAmericanOddsInput,
  parseAmericanOddsInput,
} from '@/lib/odds'

export const dynamic = 'force-dynamic'

type SortColumn = 'entry' | 'win4_4' | 'win3_4' | 'poolEV' | 'gameEV' | 'totalEV'
type SortDirection = 'asc' | 'desc'

const EMPTY_GAME: Game = {
  id: '',
  teamAName: '',
  teamBName: '',
  teamAOdds: -110,
  teamBOdds: -110,
  teamAPercent: 50,
  teamBPercent: 50,
}

function formatOddsForInput(value: number): string {
  if (!Number.isFinite(value)) return ''
  return value > 0 ? `+${Math.trunc(value)}` : `${Math.trunc(value)}`
}

function focusNextField(current: HTMLInputElement) {
  const fields = Array.from(document.querySelectorAll<HTMLInputElement>('input')).filter(
    (el) => !el.disabled && !el.readOnly
  )
  const currentIndex = fields.indexOf(current)
  if (currentIndex < 0) return
  const next = fields[currentIndex + 1]
  if (next) {
    next.focus()
    next.select()
  }
}

export default function PoolOptimizerPage() {
  const [games, setGames] = useState<Game[]>([
    { ...EMPTY_GAME, id: '1' },
    { ...EMPTY_GAME, id: '2' },
    { ...EMPTY_GAME, id: '3' },
    { ...EMPTY_GAME, id: '4' },
  ])
  const [calculated, setCalculated] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('totalEV')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)

  // Generate entries only after calculate is pressed
  const allEntries = useMemo(() => {
    if (!calculated) return []
    return generatePoolEntries(games)
  }, [games, calculated])

  // Sort entries
  const sortedEntries = useMemo(() => {
    const sorted = [...allEntries].sort((a, b) => {
      let aVal = 0
      let bVal = 0

      switch (sortColumn) {
        case 'entry':
          return sortDirection === 'asc'
            ? formatPoolEntry(a.picks).localeCompare(formatPoolEntry(b.picks))
            : formatPoolEntry(b.picks).localeCompare(formatPoolEntry(a.picks))
        case 'win4_4':
          aVal = a.winProbability
          bVal = b.winProbability
          break
        case 'win3_4':
          aVal = a.winAt3
          bVal = b.winAt3
          break
        case 'poolEV':
          aVal = a.poolEV
          bVal = b.poolEV
          break
        case 'gameEV':
          aVal = a.gameEV
          bVal = b.gameEV
          break
        case 'totalEV':
          aVal = a.totalEV
          bVal = b.totalEV
          break
      }

      const result = bVal - aVal
      return sortDirection === 'desc' ? result : -result
    })

    return sorted
  }, [sortColumn, sortDirection, allEntries])

  // Calculate statistics
  const stats = useMemo(() => {
    if (allEntries.length === 0) {
      return {
        totalCombinations: 0,
        highestTotalEV: 0,
        avgTotalEV: 0,
        highestGameEV: 0,
        highestPoolEV: 0,
      }
    }

    const totalCombinations = allEntries.length
    const highestTotalEV = Math.max(...allEntries.map((e) => e.totalEV))
    const avgTotalEV = allEntries.reduce((sum, e) => sum + e.totalEV, 0) / allEntries.length
    const highestGameEV = Math.max(...allEntries.map((e) => e.gameEV))
    const highestPoolEV = Math.max(...allEntries.map((e) => e.poolEV))

    return {
      totalCombinations,
      highestTotalEV,
      avgTotalEV,
      highestGameEV,
      highestPoolEV,
    }
  }, [allEntries])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleGameChange = (gameId: string, field: string, value: string | number) => {
    setGames(games.map(g => {
      if (g.id === gameId) {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
        return { ...g, [field]: numValue }
      }
      return g
    }))
  }

  const handleGameNameChange = (gameId: string, field: string, value: string) => {
    setGames(games.map(g => {
      if (g.id === gameId) {
        return { ...g, [field]: value }
      }
      return g
    }))
  }

  const handleCalculate = () => {
    setCalculated(true)
    setExpandedEntryId(null)
    requestAnimationFrame(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  const highestTotalEVId = sortedEntries.length > 0 
    ? sortedEntries.find((e) => e.totalEV === stats.highestTotalEV)?.id 
    : null

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          MLB · Pool Optimizer
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Generate and analyze all possible pool entries.
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-8 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Game Inputs</h3>
        
        {games.map((game, idx) => (
          <div key={game.id} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
            {/* Game Header */}
            <h4 className="mb-3 text-sm font-semibold text-foreground">Game {idx + 1}</h4>
            
            {/* Header Row with Team Labels */}
            <div className="mb-3 grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <div></div>
              <div className="text-xs font-semibold text-emerald-400 text-center">Away Team</div>
              <div className="text-xs font-semibold text-emerald-400 text-center">Home Team</div>
            </div>

            {/* Team Name Row */}
            <div className="mb-2 grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">Team Name</label>
              <input
                type="text"
                value={game.teamAName}
                onChange={(e) => handleGameNameChange(game.id, 'teamAName', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  focusNextField(e.currentTarget)
                }}
                placeholder="e.g., CIN"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
              <input
                type="text"
                value={game.teamBName}
                onChange={(e) => handleGameNameChange(game.id, 'teamBName', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  focusNextField(e.currentTarget)
                }}
                placeholder="e.g., NYY"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
            </div>

            {/* Odds Row */}
            <div className="mb-2 grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">Odds</label>
              <input
                type="text"
                inputMode="text"
                defaultValue={formatOddsForInput(game.teamAOdds)}
                onChange={(e) => {
                  const parsed = parseAmericanOddsInput(e.target.value)
                  if (Number.isFinite(parsed) && isValidAmericanOdds(parsed)) {
                    handleGameChange(game.id, 'teamAOdds', parsed)
                  }
                }}
                onBlur={(e) => {
                  const normalized = normalizeAmericanOddsInput(e.target.value)
                  e.currentTarget.value = normalized
                  const parsed = parseAmericanOddsInput(normalized)
                  if (Number.isFinite(parsed) && isValidAmericanOdds(parsed)) {
                    handleGameChange(game.id, 'teamAOdds', parsed)
                  } else {
                    e.currentTarget.value = formatOddsForInput(game.teamAOdds)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  focusNextField(e.currentTarget)
                }}
                placeholder="-110"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
              <input
                type="text"
                inputMode="text"
                defaultValue={formatOddsForInput(game.teamBOdds)}
                onChange={(e) => {
                  const parsed = parseAmericanOddsInput(e.target.value)
                  if (Number.isFinite(parsed) && isValidAmericanOdds(parsed)) {
                    handleGameChange(game.id, 'teamBOdds', parsed)
                  }
                }}
                onBlur={(e) => {
                  const normalized = normalizeAmericanOddsInput(e.target.value)
                  e.currentTarget.value = normalized
                  const parsed = parseAmericanOddsInput(normalized)
                  if (Number.isFinite(parsed) && isValidAmericanOdds(parsed)) {
                    handleGameChange(game.id, 'teamBOdds', parsed)
                  } else {
                    e.currentTarget.value = formatOddsForInput(game.teamBOdds)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  focusNextField(e.currentTarget)
                }}
                placeholder="-110"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
            </div>

            {/* Pick % Row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">Pick %</label>
              <input
                type="text"
                inputMode="decimal"
                value={game.teamAPercent}
                onChange={(e) => handleGameChange(game.id, 'teamAPercent', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  focusNextField(e.currentTarget)
                }}
                placeholder="50"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
              <input
                type="text"
                inputMode="decimal"
                value={game.teamBPercent}
                onChange={(e) => handleGameChange(game.id, 'teamBPercent', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  focusNextField(e.currentTarget)
                }}
                placeholder="50"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
            </div>
          </div>
        ))}

        {/* Calculate Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleCalculate}
            className="min-h-12 w-full rounded-lg bg-gradient-to-r from-purple-500 to-emerald-400 px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 sm:w-auto"
          >
            Calculate Results
          </button>
        </div>
      </div>

      {/* Results Section - Only shown after calculate */}
      {calculated && (
        <div ref={resultsRef}>
          {/* Statistics Cards */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Combinations" value={stats.totalCombinations.toLocaleString()} />
            <StatCard label="Highest Total EV" value={`${stats.highestTotalEV > 0 ? '+' : ''}${(stats.highestTotalEV * 100).toFixed(1)}%`} />
            <StatCard label="Average Total EV" value={`${stats.avgTotalEV > 0 ? '+' : ''}${(stats.avgTotalEV * 100).toFixed(1)}%`} />
            <StatCard label="Highest Game EV" value={`${stats.highestGameEV > 0 ? '+' : ''}${(stats.highestGameEV * 100).toFixed(1)}%`} />
            <StatCard label="Highest Pool EV" value={`${stats.highestPoolEV > 0 ? '+' : ''}${(stats.highestPoolEV * 100).toFixed(1)}%`} />
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-muted/30 border-b border-border/40 overflow-x-auto">
              <div 
                className="grid gap-0 px-4 py-3 text-sm font-semibold text-foreground"
                style={{
                  gridTemplateColumns: '70px 220px 110px 110px 110px 110px 110px',
                  minWidth: '840px'
                }}
              >
                <div className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 py-1" onClick={() => handleSort('entry')}>
                  Rank
                </div>
                <div className="flex items-center cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 py-1 overflow-hidden" onClick={() => handleSort('entry')}>
                  <div className="flex items-center gap-2">
                    Entry
                    {sortColumn === 'entry' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </div>
                <div className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 py-1" onClick={() => handleSort('win4_4')}>
                  <div className="flex items-center justify-center gap-2">
                    4/4 Win %
                    {sortColumn === 'win4_4' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </div>
                <div className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 py-1" onClick={() => handleSort('win3_4')}>
                  <div className="flex items-center justify-center gap-2">
                    3/4 Win %
                    {sortColumn === 'win3_4' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </div>
                <div className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 py-1" onClick={() => handleSort('poolEV')}>
                  <div className="flex items-center justify-center gap-2">
                    Pool EV
                    {sortColumn === 'poolEV' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </div>
                <div className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 py-1" onClick={() => handleSort('gameEV')}>
                  <div className="flex items-center justify-center gap-2">
                    Game EV
                    {sortColumn === 'gameEV' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </div>
                <div className="flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors rounded px-1 py-1" onClick={() => handleSort('totalEV')}>
                  <div className="flex items-center justify-center gap-2">
                    Total EV
                    {sortColumn === 'totalEV' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-x-auto flex-1">
              <div className="divide-y divide-border/40">
                {sortedEntries.map((entry, rank) => {
                  const isExpanded = expandedEntryId === entry.id
                  const isHighestEV = entry.id === highestTotalEVId

                  return (
                    <div key={entry.id}>
                      <div
                        className={`grid gap-0 px-4 py-3 text-sm transition-colors cursor-pointer hover:bg-muted/20 ${
                          isHighestEV ? 'bg-amber-500/10 border-l-4 border-l-amber-400' : ''
                        }`}
                        style={{
                          gridTemplateColumns: '70px 220px 110px 110px 110px 110px 110px',
                          minWidth: '840px'
                        }}
                        onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      >
                        <div className="flex items-center justify-center text-muted-foreground">
                          {rank + 1}
                        </div>
                        <div className="flex items-center overflow-hidden">
                          <code className="max-w-[210px] truncate whitespace-nowrap text-sm text-muted-foreground" title={formatPoolEntry(entry.picks)}>
                            {formatPoolEntry(entry.picks)}
                          </code>
                        </div>
                        <div className="flex items-center justify-center text-muted-foreground">
                          {(entry.winProbability * 100).toFixed(1)}%
                        </div>
                        <div className="flex items-center justify-center text-muted-foreground">
                          {(entry.winAt3 * 100).toFixed(1)}%
                        </div>
                        <div className={`flex items-center justify-center font-medium ${entry.poolEV > 0 ? 'text-emerald-400' : entry.poolEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {entry.poolEV > 0 ? '+' : ''}
                          {(entry.poolEV * 100).toFixed(1)}%
                        </div>
                        <div className={`flex items-center justify-center font-medium ${entry.gameEV > 0 ? 'text-emerald-400' : entry.gameEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {entry.gameEV > 0 ? '+' : ''}
                          {(entry.gameEV * 100).toFixed(1)}%
                        </div>
                        <div className={`flex items-center justify-center font-semibold ${entry.totalEV > 0 ? 'text-emerald-400' : entry.totalEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {entry.totalEV > 0 ? '+' : ''}
                          {(entry.totalEV * 100).toFixed(1)}%
                        </div>
                      </div>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <div className="bg-muted/10 border-t border-border/40 px-4 py-4">
                          <div className="space-y-4">
                            {entry.picks.map((pick, idx) => (
                              <div key={idx} className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">
                                  Game {idx + 1}
                                </p>
                                <div className="ml-4 space-y-0.5 text-sm text-muted-foreground">
                                  <p>
                                    Pick: <span className="text-foreground font-medium">{pick.teamName}</span>
                                  </p>
                                  <p>
                                    Wager: <span className="text-foreground font-medium">${pick.wager}</span>
                                  </p>
                                </div>
                              </div>
                            ))}

                            <div className="border-t border-border/40 pt-4 mt-4 space-y-1 text-sm">
                              <p>
                                Game EV:{' '}
                                <span className={`font-medium ${entry.gameEV > 0 ? 'text-emerald-400' : entry.gameEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  {entry.gameEV > 0 ? '+' : ''}
                                  {(entry.gameEV * 100).toFixed(1)}%
                                </span>
                              </p>
                              <p>
                                Pool EV:{' '}
                                <span className={`font-medium ${entry.poolEV > 0 ? 'text-emerald-400' : entry.poolEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  {entry.poolEV > 0 ? '+' : ''}
                                  {(entry.poolEV * 100).toFixed(1)}%
                                </span>
                              </p>
                              <p>
                                Total EV:{' '}
                                <span className={`font-medium ${entry.totalEV > 0 ? 'text-emerald-400' : entry.totalEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  {entry.totalEV > 0 ? '+' : ''}
                                  {(entry.totalEV * 100).toFixed(1)}%
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border/40 bg-muted/5 text-sm text-muted-foreground">
              Showing {sortedEntries.length} of {allEntries.length} entries
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

