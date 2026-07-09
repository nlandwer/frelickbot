'use client'

import { useState, useMemo } from 'react'
import { generatePoolEntries, formatPoolEntry, Game, PoolEntry } from '@/lib/pool-utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

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

type SortBy = 'totalEV' | 'gameEV' | 'poolEV' | 'winProb'
type FilterView = 'all' | 'top10' | 'top25' | 'top50'

export default function PoolOptimizerPage() {
  const [sortBy, setSortBy] = useState<SortBy>('totalEV')
  const [filterView, setFilterView] = useState<FilterView>('top10')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  // Generate all pool entries
  const allEntries = useMemo(() => generatePoolEntries(MOCK_GAMES), [])

  // Sort entries
  const sortedEntries = useMemo(() => {
    const sorted = [...allEntries].sort((a, b) => {
      let aVal = 0
      let bVal = 0

      switch (sortBy) {
        case 'totalEV':
          aVal = a.totalEV
          bVal = b.totalEV
          break
        case 'gameEV':
          aVal = a.gameEV
          bVal = b.gameEV
          break
        case 'poolEV':
          aVal = a.poolEV
          bVal = b.poolEV
          break
        case 'winProb':
          aVal = a.winProbability
          bVal = b.winProbability
          break
      }

      return bVal - aVal // descending
    })

    return sorted
  }, [sortBy, allEntries])

  // Filter entries
  const filteredEntries = useMemo(() => {
    switch (filterView) {
      case 'all':
        return sortedEntries
      case 'top10':
        return sortedEntries.slice(0, 10)
      case 'top25':
        return sortedEntries.slice(0, 25)
      case 'top50':
        return sortedEntries.slice(0, 50)
    }
  }, [sortedEntries, filterView])

  const bestEntry = sortedEntries[0]
  const highestGameEV = sortedEntries.reduce((max, e) => (e.gameEV > max.gameEV ? e : max))
  const highestPoolEV = sortedEntries.reduce((max, e) => (e.poolEV > max.poolEV ? e : max))
  const highestWinProb = sortedEntries.reduce((max, e) => (e.winProbability > max.winProbability ? e : max))

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
          MLB · Pool Optimizer
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Generate and analyze all 256 possible pool entries for maximum EV.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Best Entry" entry={bestEntry} games={MOCK_GAMES} isBest />
        <SummaryCard label="Highest Game EV" entry={highestGameEV} games={MOCK_GAMES} />
        <SummaryCard label="Highest Pool EV" entry={highestPoolEV} games={MOCK_GAMES} />
        <SummaryCard label="Highest Win Prob" entry={highestWinProb} games={MOCK_GAMES} />
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Sorting */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Sort by</p>
          <div className="flex flex-wrap gap-2">
            {(['totalEV', 'gameEV', 'poolEV', 'winProb'] as SortBy[]).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === option
                    ? 'bg-emerald-400/20 border border-emerald-400 text-emerald-400'
                    : 'bg-muted border border-border text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option === 'totalEV' && 'Total EV'}
                {option === 'gameEV' && 'Game EV'}
                {option === 'poolEV' && 'Pool EV'}
                {option === 'winProb' && 'Win Probability'}
              </button>
            ))}
          </div>
        </div>

        {/* Filtering */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Show</p>
          <div className="flex flex-wrap gap-2">
            {(['all', 'top10', 'top25', 'top50'] as FilterView[]).map((option) => (
              <button
                key={option}
                onClick={() => setFilterView(option)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterView === option
                    ? 'bg-emerald-400/20 border border-emerald-400 text-emerald-400'
                    : 'bg-muted border border-border text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option === 'all' && 'All 256'}
                {option === 'top10' && 'Top 10'}
                {option === 'top25' && 'Top 25'}
                {option === 'top50' && 'Top 50'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Entry</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Game EV</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Pool EV</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Total EV</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Win Prob</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => {
                const rank = sortedEntries.indexOf(entry) + 1
                const isExpanded = expandedEntryId === entry.id
                const isBest = rank === 1
                const isTop10 = rank <= 10

                return (
                  <tbody key={entry.id}>
                    <tr
                      className={`border-b border-border/40 transition-colors cursor-pointer hover:bg-muted/20 ${
                        isBest ? 'bg-amber-500/10 border-l-4 border-l-amber-400' : isTop10 ? 'bg-emerald-500/5' : ''
                      }`}
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {isBest ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                            #{rank} 🏆
                          </span>
                        ) : (
                          `#${rank}`
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm text-muted-foreground">{formatPoolEntry(entry.picks)}</code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={entry.gameEV > 0 ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}>
                          {entry.gameEV > 0 ? '+' : ''}
                          {(entry.gameEV * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {entry.poolEV > 0 ? '+' : ''}
                        {(entry.poolEV * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={entry.totalEV > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {entry.totalEV > 0 ? '+' : ''}
                          {(entry.totalEV * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {(entry.winProbability * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className="border-b border-border/40 bg-muted/10">
                        <td colSpan={7} className="px-4 py-4">
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
                                <span className="font-medium text-emerald-400">
                                  {entry.gameEV > 0 ? '+' : ''}
                                  {(entry.gameEV * 100).toFixed(1)}%
                                </span>
                              </p>
                              <p>
                                Pool EV:{' '}
                                <span className="font-medium text-muted-foreground">
                                  {entry.poolEV > 0 ? '+' : ''}
                                  {(entry.poolEV * 100).toFixed(1)}%
                                </span>
                              </p>
                              <p>
                                Total EV:{' '}
                                <span className="font-medium text-emerald-400">
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
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-muted-foreground">
        <p>Showing {filteredEntries.length} of {sortedEntries.length} entries</p>
      </div>
    </>
  )
}

interface SummaryCardProps {
  label: string
  entry: PoolEntry
  games: Game[]
  isBest?: boolean
}

function SummaryCard({ label, entry, games, isBest }: SummaryCardProps) {
  const rank = label === 'Best Entry' ? 1 : 'N/A'

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isBest
          ? 'border-amber-400/50 bg-amber-500/10'
          : 'border-border/40 bg-card/50 backdrop-blur-sm'
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="mt-2 space-y-1">
        <code className="block text-xs text-muted-foreground font-mono">{formatPoolEntry(entry.picks)}</code>
        <p className="text-sm font-semibold text-foreground">
          {entry.totalEV > 0 ? '+' : ''}
          {(entry.totalEV * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  )
}

