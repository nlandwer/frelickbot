export interface Game {
  id: string
  teamAName: string
  teamBName: string
  teamAOdds: number    // American odds (e.g., -110, +150)
  teamBOdds: number    // American odds (e.g., -110, +150)
  teamAPercent: number // Probability % (e.g., 55 for 55%)
  teamBPercent: number // Probability % (e.g., 45 for 45%)
}

export interface PickOption {
  teamName: string
  gameId: string
  team: 1 | 2
  wager: 0 | 100
}

export interface PoolEntry {
  id: string
  picks: PickOption[]
  gameEV: number
  poolEV: number
  totalEV: number
  winProbability: number  // probability of all 0-bet picks winning (4/4)
  winAt3: number          // probability of winning 3 or 4
}

/**
 * Calculate EV from American odds and probability
 * Returns { ev100: EV for $100 bet, ev0: probability (0% bet baseline) }
 */
export function calculateEVFromOdds(
  americanOdds: number,
  probabilityPercent: number,
): { ev100: number; ev0: number } {
  const probWin = probabilityPercent / 100
  const probLose = 1 - probWin

  let ev100 = 0
  if (americanOdds > 0) {
    // Positive odds: +150 means $150 profit on $100 bet
    ev100 = probWin * americanOdds - probLose * 100
  } else {
    // Negative odds: -150 means need $150 bet to win $100
    const absOdds = Math.abs(americanOdds)
    ev100 = probWin * 100 - probLose * absOdds
  }

  // Normalize to percentage (if betting $100)
  const ev100Pct = ev100
  // For 0 bet, EV is just the probability
  const ev0Pct = probWin * 100

  return {
    ev100: ev100Pct,
    ev0: ev0Pct,
  }
}

/**
 * Calculate probability of winning at least 3 out of 4 games
 * given individual win probabilities for each game
 */
function calculateWinAt3(gameWinProbs: number[]): number {
  if (gameWinProbs.length !== 4) return 0

  let prob = 0
  // Enumerate all 16 combinations (2^4)
  for (let mask = 0; mask < 16; mask++) {
    let wins = 0
    let combinationProb = 1

    for (let gameIdx = 0; gameIdx < 4; gameIdx++) {
      const gameWins = (mask & (1 << gameIdx)) !== 0
      if (gameWins) {
        wins++
        combinationProb *= gameWinProbs[gameIdx]
      } else {
        combinationProb *= 1 - gameWinProbs[gameIdx]
      }
    }

    // Count combinations with 3 or 4 wins
    if (wins >= 3) {
      prob += combinationProb
    }
  }

  return prob
}

/**
 * Generate all possible pool entries (4^n combinations for n games)
 * Takes games with odds and probabilities, calculates EVs internally
 */
export function generatePoolEntries(games: Game[]): PoolEntry[] {
  const entries: PoolEntry[] = []

  // Generate all possible combinations
  const numGames = games.length
  const totalCombinations = Math.pow(4, numGames)

  for (let i = 0; i < totalCombinations; i++) {
    const picks: PickOption[] = []
    let gameEV = 0
    let poolEV = 0
    const gameWinProbs: number[] = []

    // Decode this combination
    let remainder = i
    for (let gameIdx = 0; gameIdx < numGames; gameIdx++) {
      const option = remainder % 4
      remainder = Math.floor(remainder / 4)

      const game = games[gameIdx]

      // Calculate EVs from odds and probability
      const teamAEv = calculateEVFromOdds(game.teamAOdds, game.teamAPercent)
      const teamBEv = calculateEVFromOdds(game.teamBOdds, game.teamBPercent)

      let teamName: string
      let wager: 0 | 100
      let pickEV = 0
      let gameWinProb = 0

      // Map 0-3 to the four options
      if (option === 0) {
        // Team A, no bet
        teamName = game.teamAName
        wager = 0
        pickEV = teamAEv.ev0
        gameWinProb = game.teamAPercent / 100
      } else if (option === 1) {
        // Team A, $100 bet
        teamName = game.teamAName
        wager = 100
        pickEV = teamAEv.ev100
        gameWinProb = game.teamAPercent / 100
      } else if (option === 2) {
        // Team B, no bet
        teamName = game.teamBName
        wager = 0
        pickEV = teamBEv.ev0
        gameWinProb = game.teamBPercent / 100
      } else {
        // Team B, $100 bet
        teamName = game.teamBName
        wager = 100
        pickEV = teamBEv.ev100
        gameWinProb = game.teamBPercent / 100
      }

      const pick: PickOption = {
        teamName,
        gameId: game.id,
        team: option < 2 ? 1 : 2,
        wager,
      }

      picks.push(pick)
      gameEV += pickEV
      gameWinProbs.push(gameWinProb)
    }

    const winAt3 = numGames === 4 ? calculateWinAt3(gameWinProbs) : 0
    const winProb = gameWinProbs.reduce((product, p) => product * p, 1)

    const entry: PoolEntry = {
      id: i.toString(),
      picks,
      gameEV,
      poolEV,
      totalEV: gameEV + poolEV,
      winProbability: winProb,
      winAt3,
    }

    entries.push(entry)
  }

  return entries
}

/**
 * Format a pool entry as a string
 * Example: "CIN100 • SEA0 • BOS100 • LAD100"
 */
export function formatPoolEntry(picks: PickOption[]): string {
  return picks.map((p) => `${p.teamName}${p.wager}`).join(' • ')
}
