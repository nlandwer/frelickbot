'use client'

import { useState, useMemo } from 'react'
import { generatePoolEntries, formatPoolEntry, Game, PoolEntry } from '@/lib/pool-utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Mock game data for now
const MOCK_GAMES: Game[] = [
  {
    id: 'game1',
    team1Name: 'CIN',
    team2Name: 'MIL',
    team1Odds: -110,
    team2Odds: -110,
    ballparkWinPercent: 52.5,
    realTeam1Odds: -110,
    realTeam2Odds: -110,
  },
  {
    id: 'game2',
    team1Name: 'NYY',
    team2Name: 'BOS',
    team1Odds: -120,
    team2Odds: +100,
    ballparkWinPercent: 55.0,
    realTeam1Odds: -120,
    realTeam2Odds: +100,
  },
  {
    id: 'game3',
    team1Name: 'LAD',
    team2Name: 'SD',
    team1Odds: -110,
    team2Odds: -110,
    ballparkWinPercent: 50.5,
    realTeam1Odds: -110,
    realTeam2Odds: -110,
  },
  {
    id: 'game4',
    team1Name: 'HOU',
    team2Name: 'TEX',
    team1Odds: -115,
    team2Odds: -105,
    ballparkWinPercent: 54.0,
    realTeam1Odds: -115,
    realTeam2Odds: -105,
  },
]

type SortColumn = 'entry' | 'winPercent' | 'win3_4' | 'expectedWinners' | 'expectedPayout' | 'poolEV' | 'gameEV' | 'totalEV'
type SortDirection = 'asc' | 'desc'

export default function PoolOptimizerPage() {
  const [sortColumn, setSortColumn] = useState<SortColumn>('totalEV')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  // Generate all pool entries
  const allEntries = useMemo(() => generatePoolEntries(MOCK_GAMES), [])

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
        case 'winPercent':
          aVal = a.winProbability
          bVal = b.winProbability
          break
        case 'win3_4':
          aVal = a.winAt3
          bVal = b.winAt3
          break
        case 'expectedWinners':
          aVal = a.expectedWinners
          bVal = b.expectedWinners
          break
        case 'expectedPayout':
          aVal = a.expectedPayout
          bVal = b.expectedPayout
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
    const totalCombinations = allEntries.length
    const highestTotalEV = Math.max(...allEntries.map((e) => e.totalEV))
    const avgTotalEV = allEntries.reduce((sum, e) => sum + e.totalEV, 0) / allEntries.length
    const highestGameEV = Math.max(...allEntries.map((e) => e.gameEV))
    const highestPoolEV = Math.max(...allEntries.map((e) => e.poolEV))
    const bestExpectedPayout = Math.max(...allEntries.map((e) => e.expectedPayout))

    return {
      totalCombinations,
      highestTotalEV,
      avgTotalEV,
      highestGameEV,
      highestPoolEV,
      bestExpectedPayout,
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

  const highestTotalEVId = sortedEntries.find((e) => e.totalEV === stats.highestTotalEV)?.id

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          MLB · Pool Optimizer
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Generate and analyze all possible pool entries for maximum EV.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total Combinations" value={stats.totalCombinations.toLocaleString()} />
        <StatCard label="Highest Total EV" value={`${stats.highestTotalEV > 0 ? '+' : ''}${(stats.highestTotalEV * 100).toFixed(1)}%`} />
        <StatCard label="Average Total EV" value={`${stats.avgTotalEV > 0 ? '+' : ''}${(stats.avgTotalEV * 100).toFixed(1)}%`} />
        <StatCard label="Highest Game EV" value={`${stats.highestGameEV > 0 ? '+' : ''}${(stats.highestGameEV * 100).toFixed(1)}%`} />
        <StatCard label="Highest Pool EV" value={`${stats.highestPoolEV > 0 ? '+' : ''}${(stats.highestPoolEV * 100).toFixed(1)}%`} />
        <StatCard label="Best Expected Payout" value={`$${stats.bestExpectedPayout.toFixed(2)}`} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/30 border-b border-border/40">
              <tr>
                <th
                  className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('entry')}
                >
                  <div className="flex items-center gap-2">
                    Entry
                    {sortColumn === 'entry' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('winPercent')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Win %
                    {sortColumn === 'winPercent' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('win3_4')}
                >
                  <div className="flex items-center justify-end gap-2">
                    3/4 Win %
                    {sortColumn === 'win3_4' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('expectedWinners')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Expected Winners
                    {sortColumn === 'expectedWinners' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('expectedPayout')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Expected Payout
                    {sortColumn === 'expectedPayout' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('poolEV')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Pool EV
                    {sortColumn === 'poolEV' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('gameEV')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Game EV
                    {sortColumn === 'gameEV' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('totalEV')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Total EV
                    {sortColumn === 'totalEV' && (sortDirection === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry, visibleIndex) => {
                const rank = sortedEntries.indexOf(entry) + 1
                const isExpanded = expandedEntryId === entry.id
                const isHighestEV = entry.id === highestTotalEVId

                return (
                  <tbody key={entry.id}>
                    <tr
                      className={`border-b border-border/40 transition-colors cursor-pointer hover:bg-muted/20 ${
                        isHighestEV ? 'bg-amber-500/10 border-l-4 border-l-amber-400' : ''
                      }`}
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    >
                      <td className="px-4 py-3">
                        <code className="text-sm text-muted-foreground">{formatPoolEntry(entry.picks)}</code>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {(entry.winProbability * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {(entry.winAt3 * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {entry.expectedWinners.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ${entry.expectedPayout.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${entry.poolEV > 0 ? 'text-emerald-400' : entry.poolEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {entry.poolEV > 0 ? '+' : ''}
                        {(entry.poolEV * 100).toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${entry.gameEV > 0 ? 'text-emerald-400' : entry.gameEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {entry.gameEV > 0 ? '+' : ''}
                        {(entry.gameEV * 100).toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${entry.totalEV > 0 ? 'text-emerald-400' : entry.totalEV < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {entry.totalEV > 0 ? '+' : ''}
                        {(entry.totalEV * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className="border-b border-border/40 bg-muted/10">
                        <td colSpan={8} className="px-4 py-4">
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
                        </td>
                      </tr>
                    )}
                  </tbody>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/40 bg-muted/5 text-sm text-muted-foreground">
          Showing {sortedEntries.length} of {allEntries.length} entries
        </div>
      </div>
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

