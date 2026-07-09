import { americanToProbability, americanToDecimal, isValidAmericanOdds } from './odds'

const PINNACLE_WEIGHT = 0.6
const BALLPARK_WEIGHT = 0.4

export interface Game {
  id: string
  team1Name: string
  team2Name: string
  team1Odds: number
  team2Odds: number
  ballparkWinPercent: number
  realTeam1Odds: number
  realTeam2Odds: number
}

export interface GameEVResult {
  team1_0Bet: number | null
  team1_100Bet: number | null
  team2_0Bet: number | null
  team2_100Bet: number | null
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
  poolEV: number // placeholder
  totalEV: number
  winProbability: number
}

/**
 * Calculate moneyline EV for a single game
 * Returns all four possible outcomes
 */
export function calculateGameEV(game: Game): GameEVResult {
  const { team1Odds, team2Odds, ballparkWinPercent, realTeam1Odds, realTeam2Odds } = game

  // Validate odds
  if (!isValidAmericanOdds(team1Odds) || !isValidAmericanOdds(team2Odds)) {
    return {
      team1_0Bet: null,
      team1_100Bet: null,
      team2_0Bet: null,
      team2_100Bet: null,
    }
  }

  // Validate ballpark %
  if (!Number.isFinite(ballparkWinPercent) || ballparkWinPercent <= 0 || ballparkWinPercent >= 100) {
    return {
      team1_0Bet: null,
      team1_100Bet: null,
      team2_0Bet: null,
      team2_100Bet: null,
    }
  }

  // Calculate probabilities
  const p1 = americanToProbability(team1Odds)
  const p2 = americanToProbability(team2Odds)
  const noVig = p1 / (p1 + p2)
  const weighted = PINNACLE_WEIGHT * noVig + BALLPARK_WEIGHT * (ballparkWinPercent / 100)

  // Calculate EV for each outcome
  let team1_0Bet: number | null = null
  let team1_100Bet: number | null = null
  let team2_0Bet: number | null = null
  let team2_100Bet: number | null = null

  if (isValidAmericanOdds(realTeam1Odds)) {
    team1_100Bet = weighted * americanToDecimal(realTeam1Odds) - 1
    team1_0Bet = weighted // 0 bet uses pure probability
  }

  if (isValidAmericanOdds(realTeam2Odds)) {
    team2_100Bet = (1 - weighted) * americanToDecimal(realTeam2Odds) - 1
    team2_0Bet = 1 - weighted // 0 bet uses pure probability
  }

  return {
    team1_0Bet,
    team1_100Bet,
    team2_0Bet,
    team2_100Bet,
  }
}

/**
 * Get EV value for a specific pick
 */
export function getPickEV(evResult: GameEVResult, team: 1 | 2, wager: 0 | 100): number | null {
  if (team === 1 && wager === 0) return evResult.team1_0Bet
  if (team === 1 && wager === 100) return evResult.team1_100Bet
  if (team === 2 && wager === 0) return evResult.team2_0Bet
  if (team === 2 && wager === 100) return evResult.team2_100Bet
  return null
}

/**
 * Generate all possible pool entries (4^n combinations for n games)
 */
export function generatePoolEntries(games: Game[]): PoolEntry[] {
  const entries: PoolEntry[] = []

  // Calculate EV for all games
  const gameEVs = games.map(calculateGameEV)

  // Generate all possible combinations
  const numGames = games.length
  const totalCombinations = Math.pow(4, numGames)

  for (let i = 0; i < totalCombinations; i++) {
    const picks: PickOption[] = []
    let gameEV = 0
    let winProb = 1

    // Decode this combination
    let remainder = i
    for (let gameIdx = 0; gameIdx < numGames; gameIdx++) {
      const option = remainder % 4
      remainder = Math.floor(remainder / 4)

      const game = games[gameIdx]
      const evResult = gameEVs[gameIdx]

      let team: 1 | 2
      let wager: 0 | 100

      // Map 0-3 to the four options
      if (option === 0) {
        team = 1
        wager = 0
      } else if (option === 1) {
        team = 1
        wager = 100
      } else if (option === 2) {
        team = 2
        wager = 0
      } else {
        team = 2
        wager = 100
      }

      const pick: PickOption = {
        teamName: team === 1 ? game.team1Name : game.team2Name,
        gameId: game.id,
        team,
        wager,
      }

      picks.push(pick)

      // Calculate EV and win probability for this pick
      const pickEV = getPickEV(evResult, team, wager)
      if (pickEV !== null) {
        gameEV += pickEV

        // Win probability (0 bet uses probability, 100 bet uses EV > 0 as indication)
        if (wager === 0) {
          winProb *= team === 1 ? evResult.team1_0Bet || 0 : evResult.team2_0Bet || 0
        }
      }
    }

    const entry: PoolEntry = {
      id: i.toString(),
      picks,
      gameEV,
      poolEV: 0, // placeholder
      totalEV: gameEV + 0, // gameEV + poolEV
      winProbability: winProb,
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
