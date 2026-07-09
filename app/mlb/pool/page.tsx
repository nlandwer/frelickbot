'use client'

import { useState, useMemo } from 'react'
import { generatePoolEntries, formatPoolEntry, Game, PoolEntry } from '@/lib/pool-utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

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
      <div className="mb-8 space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Game Inputs</h3>
        
        {games.map((game, idx) => (
          <div key={game.id} className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6">
            {/* Game Header */}
            <h4 className="mb-6 text-base font-semibold text-foreground">Game {idx + 1}</h4>
            
            {/* Team Headers */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="text-sm font-semibold text-emerald-400">Team A</div>
              <div className="text-sm font-semibold text-emerald-400">Team B</div>
            </div>

            {/* Separator */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-0.5 bg-border/40"></div>
              <div className="h-0.5 bg-border/40"></div>
            </div>

            {/* Team Name Row */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Name</label>
                <input
                  type="text"
                  value={game.teamAName}
                  onChange={(e) => handleGameNameChange(game.id, 'teamAName', e.target.value)}
                  placeholder="e.g., CIN"
                  className="w-full rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Name</label>
                <input
                  type="text"
                  value={game.teamBName}
                  onChange={(e) => handleGameNameChange(game.id, 'teamBName', e.target.value)}
                  placeholder="e.g., NYY"
                  className="w-full rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
            </div>

            {/* Odds Row */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Odds</label>
                <input
                  type="number"
                  value={game.teamAOdds}
                  onChange={(e) => handleGameChange(game.id, 'teamAOdds', e.target.value)}
                  placeholder="-110"
                  step="1"
                  className="w-full rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Odds</label>
                <input
                  type="number"
                  value={game.teamBOdds}
                  onChange={(e) => handleGameChange(game.id, 'teamBOdds', e.target.value)}
                  placeholder="-110"
                  step="1"
                  className="w-full rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
            </div>

            {/* Pick % Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Win %</label>
                <input
                  type="number"
                  value={game.teamAPercent}
                  onChange={(e) => handleGameChange(game.id, 'teamAPercent', e.target.value)}
                  placeholder="50"
                  step="1"
                  min="0"
                  max="100"
                  className="w-full rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Win %</label>
                <input
                  type="number"
                  value={game.teamBPercent}
                  onChange={(e) => handleGameChange(game.id, 'teamBPercent', e.target.value)}
                  placeholder="50"
                  step="1"
                  min="0"
                  max="100"
                  className="w-full rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Calculate Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleCalculate}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-emerald-400 px-8 py-3 font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105"
          >
            Calculate Results
          </button>
        </div>
      </div>

      {/* Results Section - Only shown after calculate */}
      {calculated && (
        <>
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
                  minWidth: 'fit-content'
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
                          minWidth: 'fit-content'
                        }}
                        onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      >
                        <div className="flex items-center justify-center text-muted-foreground">
                          {rank + 1}
                        </div>
                        <div className="flex items-center overflow-hidden">
                          <code className="text-sm text-muted-foreground truncate" title={formatPoolEntry(entry.picks)}>
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
        </>
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

