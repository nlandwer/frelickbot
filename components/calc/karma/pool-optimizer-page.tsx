'use client'

import { useMemo, useRef, useState } from 'react'
import { generatePoolEntries, formatPoolEntry, Game } from '@/lib/pool-utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  isValidAmericanOdds,
  normalizeAmericanOddsInput,
  parseAmericanOddsInput,
} from '@/lib/odds'
import { getTodayPool, PoolNotFoundError } from '@/services/realApi'

type SortColumn = 'entry' | 'win4_4' | 'win3_4' | 'poolEV' | 'gameEV' | 'totalEV'
type SortDirection = 'asc' | 'desc'
type EquationSet = 'moneyline' | 'evenPayout'

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

function formatLockTime(value: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function formatWholePercent(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(Math.round(value))
}

export function PoolOptimizerPage({
  sport,
  equationSet,
}: {
  sport: 'MLB' | 'WNBA'
  equationSet: EquationSet
}) {
  const [games, setGames] = useState<Game[]>([])
  const [isLoadingPool, setIsLoadingPool] = useState(false)
  const [loadPoolError, setLoadPoolError] = useState('')
  const [poolLoadSuccess, setPoolLoadSuccess] = useState('')
  const [calculated, setCalculated] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('totalEV')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const gameListRef = useRef<HTMLDivElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)

  const allEntries = useMemo(() => {
    if (!calculated) return []
    return generatePoolEntries(games, { equationSet })
  }, [games, calculated, equationSet])

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

  const handleGameChange = (
    gameId: string,
    field: 'teamAOdds' | 'teamBOdds' | 'teamAPercent' | 'teamBPercent',
    value: string | number
  ) => {
    setGames((previous) => previous.map((g) => {
      if (g.id === gameId) {
        const numValue =
          typeof value === 'string'
            ? value.trim() === ''
              ? Number.NaN
              : parseFloat(value)
            : value
        return { ...g, [field]: numValue }
      }
      return g
    }))
    setCalculated(true)
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

  const handleFetchPool = async () => {
    setIsLoadingPool(true)
    setLoadPoolError('')
    setPoolLoadSuccess('')

    try {
      const result = await getTodayPool(sport)

      const nextGames = result.map((game) => {
        const autoAwayOdds = Number.isFinite(game.realTeamAOdds ?? game.teamAOdds)
          ? Number(game.realTeamAOdds ?? game.teamAOdds)
          : Number.NaN
        const autoHomeOdds = Number.isFinite(game.realTeamBOdds ?? game.teamBOdds)
          ? Number(game.realTeamBOdds ?? game.teamBOdds)
          : Number.NaN

        return {
          ...game,
          teamAOdds: autoAwayOdds,
          teamBOdds: autoHomeOdds,
          realTeamAOdds: autoAwayOdds,
          realTeamBOdds: autoHomeOdds,
        }
      })

      setGames(nextGames)
      setCalculated(nextGames.length > 0)
      setExpandedEntryId(null)
      setPoolLoadSuccess(`Loaded today's ${sport} Pool (${nextGames.length} games)`)

      requestAnimationFrame(() => {
        if (gameListRef.current) {
          gameListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    } catch (error) {
      if (error instanceof PoolNotFoundError) {
        setLoadPoolError('No pool available today.')
      } else {
        setLoadPoolError('Unable to fetch pool data.')
      }
      setGames([])
      setCalculated(false)
    } finally {
      setIsLoadingPool(false)
    }
  }

  const highestTotalEVId = sortedEntries.length > 0
    ? sortedEntries.find((e) => e.totalEV === stats.highestTotalEV)?.id
    : null

  const oddsLabel = equationSet === 'evenPayout' ? 'Sportsbook Odds' : 'Real Odds'

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          {sport} · Pool Optimizer
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Generate and analyze all possible pool entries.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground">Load Real Pool</h3>
        <div className="mt-3">
          <button
            type="button"
            onClick={handleFetchPool}
            disabled={isLoadingPool}
            className="min-h-12 w-full rounded-lg bg-gradient-to-r from-purple-500 to-emerald-400 px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 sm:w-auto"
          >
            {isLoadingPool ? 'Loading...' : "Fetch Today's Pool"}
          </button>
        </div>
        {poolLoadSuccess ? (
          <p className="mt-2 text-xs text-emerald-400">{poolLoadSuccess}</p>
        ) : null}
        {loadPoolError ? <p className="mt-2 text-xs text-red-400">{loadPoolError}</p> : null}
      </div>

      <div ref={gameListRef} className="mb-8 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Game Inputs</h3>

        {games.map((game, idx) => (
          <div key={game.id} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">Game {idx + 1}</h4>
              <p className="text-xs text-muted-foreground">
                Poll ID: {game.pollId ?? game.id} {game.gameId ? `· Match ID: ${game.gameId}` : ''}
              </p>
            </div>

            <div className="mb-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <p>
                {oddsLabel}: {Number.isFinite(game.realTeamAOdds) ? formatOddsForInput(Number(game.realTeamAOdds)) : '—'} /{' '}
                {Number.isFinite(game.realTeamBOdds) ? formatOddsForInput(Number(game.realTeamBOdds)) : '—'}
              </p>
              <p>
                Pick %: {Number.isFinite(game.teamAPercent) ? `${formatWholePercent(game.teamAPercent)}%` : '—'} /{' '}
                {Number.isFinite(game.teamBPercent) ? `${formatWholePercent(game.teamBPercent)}%` : '—'}
              </p>
              <p>
                Lock Time: {formatLockTime(game.lockTime ?? '')}
              </p>
            </div>

            <div className="mb-3 grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <div></div>
              <div className="text-xs font-semibold text-emerald-400 text-center">Away Team</div>
              <div className="text-xs font-semibold text-emerald-400 text-center">Home Team</div>
            </div>

            <div className="mb-2 grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">Team Name</label>
              <input
                type="text"
                value={game.teamAName}
                readOnly
                placeholder="e.g., CIN"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
              <input
                type="text"
                value={game.teamBName}
                readOnly
                placeholder="e.g., NYY"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
            </div>

            <div className="mb-2 grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">Odds</label>
              <input
                key={`${game.id}-team-a-odds-${formatOddsForInput(game.teamAOdds)}`}
                type="text"
                inputMode="text"
                defaultValue={formatOddsForInput(game.teamAOdds)}
                onChange={(e) => {
                  if (e.target.value.trim() === '') {
                    handleGameChange(game.id, 'teamAOdds', Number.NaN)
                    return
                  }
                  const parsed = parseAmericanOddsInput(e.target.value)
                  if (Number.isFinite(parsed) && isValidAmericanOdds(parsed)) {
                    handleGameChange(game.id, 'teamAOdds', parsed)
                  }
                }}
                onBlur={(e) => {
                  const normalized = normalizeAmericanOddsInput(e.target.value)
                  if (normalized === '') {
                    e.currentTarget.value = ''
                    handleGameChange(game.id, 'teamAOdds', Number.NaN)
                    return
                  }
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
                placeholder="Away sportsbook odds"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
              <input
                key={`${game.id}-team-b-odds-${formatOddsForInput(game.teamBOdds)}`}
                type="text"
                inputMode="text"
                defaultValue={formatOddsForInput(game.teamBOdds)}
                onChange={(e) => {
                  if (e.target.value.trim() === '') {
                    handleGameChange(game.id, 'teamBOdds', Number.NaN)
                    return
                  }
                  const parsed = parseAmericanOddsInput(e.target.value)
                  if (Number.isFinite(parsed) && isValidAmericanOdds(parsed)) {
                    handleGameChange(game.id, 'teamBOdds', parsed)
                  }
                }}
                onBlur={(e) => {
                  const normalized = normalizeAmericanOddsInput(e.target.value)
                  if (normalized === '') {
                    e.currentTarget.value = ''
                    handleGameChange(game.id, 'teamBOdds', Number.NaN)
                    return
                  }
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
                placeholder="Home sportsbook odds"
                className="rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
              />
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: '120px 1fr 1fr' }}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">Pick %</label>
              <div className="flex items-center rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground">
                {Number.isFinite(game.teamAPercent) ? `${formatWholePercent(game.teamAPercent)}%` : '—'}
              </div>
              <div className="flex items-center rounded border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-foreground">
                {Number.isFinite(game.teamBPercent) ? `${formatWholePercent(game.teamBPercent)}%` : '—'}
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center pt-4">
          <button
            onClick={handleCalculate}
            className="min-h-12 w-full rounded-lg bg-gradient-to-r from-purple-500 to-emerald-400 px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 sm:w-auto"
          >
            Refresh Results
          </button>
        </div>
      </div>

      {calculated && (
        <div ref={resultsRef}>
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Combinations" value={stats.totalCombinations.toLocaleString()} />
            <StatCard label="Highest Total EV" value={`${stats.highestTotalEV > 0 ? '+' : ''}${(stats.highestTotalEV * 100).toFixed(1)}%`} />
            <StatCard label="Average Total EV" value={`${stats.avgTotalEV > 0 ? '+' : ''}${(stats.avgTotalEV * 100).toFixed(1)}%`} />
            <StatCard label="Highest Game EV" value={`${stats.highestGameEV > 0 ? '+' : ''}${(stats.highestGameEV * 100).toFixed(1)}%`} />
            <StatCard label="Highest Pool EV" value={`${stats.highestPoolEV > 0 ? '+' : ''}${(stats.highestPoolEV * 100).toFixed(1)}%`} />
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="sticky top-0 z-10 bg-muted/30 border-b border-border/40 overflow-x-auto">
              <div
                className="grid gap-0 px-4 py-3 text-sm font-semibold text-foreground"
                style={{
                  gridTemplateColumns: '70px 220px 110px 110px 110px 110px 110px',
                  minWidth: '840px',
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
                          minWidth: '840px',
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
