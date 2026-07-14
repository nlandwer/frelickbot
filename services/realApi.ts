import { Game } from '@/lib/pool-utils'

const LOCAL_REAL_POOLS_API_BASE = '/api/real/pools'
const LOCAL_REAL_TODAY_POOL_API_BASE = '/api/real/pools/today'

export class PoolNotFoundError extends Error {
  constructor(message = 'Pool not found') {
    super(message)
    this.name = 'PoolNotFoundError'
  }
}

export class RealApiRequestError extends Error {
  constructor(message = 'Real API request failed') {
    super(message)
    this.name = 'RealApiRequestError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const normalizedBase = base.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

function resolvePoolUrl(poolId: number): string {
  return joinUrl(LOCAL_REAL_POOLS_API_BASE, `/${poolId}`)
}

function resolveTodayPoolUrl(sport: string): string {
  const params = new URLSearchParams({ sport: sport.toLowerCase() })
  return `${joinUrl(LOCAL_REAL_TODAY_POOL_API_BASE, '')}?${params.toString()}`
}

async function getJson(url: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, { cache: 'no-store' })
  } catch {
    throw new RealApiRequestError()
  }

  if (response.status === 404) {
    throw new PoolNotFoundError()
  }

  if (!response.ok) {
    throw new RealApiRequestError(`Request failed: ${response.status}`)
  }

  try {
    return await response.json()
  } catch {
    throw new RealApiRequestError('Invalid JSON response')
  }
}

function pickFirstString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim()
    }
  }
  return ''
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NaN
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim()
    const parsed = Number.parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : Number.NaN
  }
  if (isRecord(value)) {
    if (Number.isFinite(Number(value.american))) return Number(value.american)
    if (Number.isFinite(Number(value.oddsAmerican))) return Number(value.oddsAmerican)
    if (Number.isFinite(Number(value.pickPercent))) return Number(value.pickPercent)
    if (Number.isFinite(Number(value.pickPct))) return Number(value.pickPct)
  }
  return Number.NaN
}

function pickFirstNumber(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const parsed = toFiniteNumber(source[key])
    if (Number.isFinite(parsed)) return parsed
  }
  return Number.NaN
}

function extractTeamName(node: unknown, side: 'away' | 'home'): string {
  if (!isRecord(node)) return ''

  const direct =
    side === 'away'
      ? pickFirstString(node, ['awayTeam', 'away_team', 'away', 'visitor', 'awayTeamName'])
      : pickFirstString(node, ['homeTeam', 'home_team', 'home', 'homeTeamName'])
  if (direct) return direct

  const nestedTeam = side === 'away' ? node.awayTeam : node.homeTeam
  if (!isRecord(nestedTeam)) return ''
  return pickFirstString(nestedTeam, ['abbreviation', 'abbr', 'code', 'shortName', 'name'])
}

function extractTeamOdds(node: unknown, side: 'away' | 'home'): number {
  if (!isRecord(node)) return Number.NaN

  const direct =
    side === 'away'
      ? pickFirstNumber(node, ['awayAmericanOdds', 'awayOdds', 'away_odds', 'awayRealOdds'])
      : pickFirstNumber(node, ['homeAmericanOdds', 'homeOdds', 'home_odds', 'homeRealOdds'])
  if (Number.isFinite(direct)) return direct

  const nestedTeam = side === 'away' ? node.awayTeam : node.homeTeam
  if (!isRecord(nestedTeam)) return Number.NaN
  return pickFirstNumber(nestedTeam, ['americanOdds', 'oddsAmerican', 'odds'])
}

function extractTeamPercent(node: unknown, side: 'away' | 'home'): number {
  if (!isRecord(node)) return Number.NaN

  const direct =
    side === 'away'
      ? pickFirstNumber(node, [
          'awayPickPercent',
          'away_pick_percent',
          'awayPickPct',
          'away_pick_pct',
          'teamAPercent',
        ])
      : pickFirstNumber(node, [
          'homePickPercent',
          'home_pick_percent',
          'homePickPct',
          'home_pick_pct',
          'teamBPercent',
        ])
  if (Number.isFinite(direct)) return direct

  const nestedTeam = side === 'away' ? node.awayTeam : node.homeTeam
  if (!isRecord(nestedTeam)) return Number.NaN
  return pickFirstNumber(nestedTeam, ['pickPercent', 'pickPct', 'percent'])
}

function extractOptionName(option: unknown): string {
  if (!isRecord(option)) return ''

  const direct = pickFirstString(option, [
    'name',
    'label',
    'title',
    'abbreviation',
    'abbr',
    'teamName',
  ])
  if (direct) return direct

  if (isRecord(option.team)) {
    const fromTeam = pickFirstString(option.team, ['abbreviation', 'abbr', 'code', 'shortName', 'name'])
    if (fromTeam) return fromTeam
  }

  return ''
}

function extractOptionOdds(option: unknown): number {
  if (!isRecord(option)) return Number.NaN
  return pickFirstNumber(option, [
    'americanOdds',
    'oddsAmerican',
    'odds',
    'realOdds',
    'realAmericanOdds',
    'line',
  ])
}

function extractOptionCount(option: unknown): number {
  if (!isRecord(option)) return Number.NaN
  return pickFirstNumber(option, ['count', 'votes', 'voteCount', 'pickCount'])
}

function parseGenericPoolPolls(root: unknown): Game[] {
  if (!isRecord(root) || !isRecord(root.pool) || !Array.isArray(root.pool.polls)) {
    return []
  }

  const games = root.pool.polls
    .map((poll, idx) => {
      const pollNode = isRecord(poll) && isRecord(poll.poll) ? poll.poll : poll

      if (!isRecord(pollNode) || !Array.isArray(pollNode.options) || pollNode.options.length < 2) {
        return null
      }

      const optionA = pollNode.options[0]
      const optionB = pollNode.options[1]

      const countA = extractOptionCount(optionA)
      const countB = extractOptionCount(optionB)
      const totalCount =
        (Number.isFinite(countA) ? countA : 0) + (Number.isFinite(countB) ? countB : 0)

      const teamAPercent =
        totalCount > 0 && Number.isFinite(countA) ? (countA / totalCount) * 100 : Number.NaN
      const teamBPercent =
        totalCount > 0 && Number.isFinite(countB) ? (countB / totalCount) * 100 : Number.NaN

      const game: Game = {
        id:
          pickFirstString(pollNode, ['id', 'pollId']) ||
          (isRecord(poll) ? pickFirstString(poll, ['id', 'pollId']) : '') ||
          String(idx + 1),
        teamAName: extractOptionName(optionA),
        teamBName: extractOptionName(optionB),
        teamAOdds: extractOptionOdds(optionA),
        teamBOdds: extractOptionOdds(optionB),
        teamAPercent,
        teamBPercent,
        pollId:
          pickFirstString(pollNode, ['id', 'pollId']) ||
          (isRecord(poll) ? pickFirstString(poll, ['id', 'pollId']) : '') ||
          undefined,
        gameId: Number.isInteger(pollNode.gameId) ? Number(pollNode.gameId) : undefined,
        lockTime: typeof pollNode.locksAt === 'string' ? pollNode.locksAt : undefined,
        realTeamAOdds: extractOptionOdds(optionA),
        realTeamBOdds: extractOptionOdds(optionB),
      }

      const hasData =
        game.teamAName !== '' ||
        game.teamBName !== '' ||
        Number.isFinite(game.teamAOdds) ||
        Number.isFinite(game.teamBOdds)

      return hasData ? game : null
    })
    .filter((item): item is Game => item !== null)

  return games
}

function parseLegacyPoolGames(payload: unknown): Game[] {
  const sources: unknown[] = [payload]
  if (isRecord(payload)) {
    sources.push(payload.games)
    sources.push(payload.matchups)
    sources.push(payload.pool)
    if (isRecord(payload.pool)) {
      sources.push(payload.pool.games)
      sources.push(payload.pool.matchups)
    }
    sources.push(payload.data)
    if (isRecord(payload.data)) {
      sources.push(payload.data.games)
      sources.push(payload.data.matchups)
    }
  }

  for (const source of sources) {
    if (!Array.isArray(source)) continue

    const games = source
      .map((item, idx) => {
        const teamAName = extractTeamName(item, 'away')
        const teamBName = extractTeamName(item, 'home')
        const teamAOdds = extractTeamOdds(item, 'away')
        const teamBOdds = extractTeamOdds(item, 'home')
        const teamAPercent = extractTeamPercent(item, 'away')
        const teamBPercent = extractTeamPercent(item, 'home')

        const hasData =
          teamAName !== '' ||
          teamBName !== '' ||
          Number.isFinite(teamAOdds) ||
          Number.isFinite(teamBOdds)

        if (!hasData) return null

        return {
          id: String(idx + 1),
          teamAName,
          teamBName,
          teamAOdds,
          teamBOdds,
          teamAPercent,
          teamBPercent,
          realTeamAOdds: teamAOdds,
          realTeamBOdds: teamBOdds,
        } as Game
      })
      .filter((item): item is Game => item !== null)

    if (games.length > 0) {
      return games.slice(0, 4)
    }
  }

  return []
}

function parsePoolGames(payload: unknown): Game[] {
  const genericCandidates: unknown[] = [payload]
  if (isRecord(payload) && isRecord(payload.payload)) {
    genericCandidates.push(payload.payload)
  }

  for (const candidate of genericCandidates) {
    const genericGames = parseGenericPoolPolls(candidate)
    if (genericGames.length > 0) {
      return genericGames.slice(0, 4)
    }
  }

  const legacyGames = parseLegacyPoolGames(payload)
  if (legacyGames.length > 0) {
    return legacyGames
  }

  throw new RealApiRequestError('No pool games found')
}

export async function getPool(poolId: number): Promise<Game[]> {
  if (!Number.isInteger(poolId) || poolId <= 0) {
    throw new PoolNotFoundError('Invalid pool id')
  }

  const poolUrl = resolvePoolUrl(poolId)
  const payload = await getJson(poolUrl)
  return parsePoolGames(payload)
}

function parseTodayPoolId(payload: unknown, sport: string): number {
  const normalizedSport = sport.toLowerCase()
  if (!isRecord(payload)) {
    throw new PoolNotFoundError('No active pool found')
  }

  const directBySport = payload[normalizedSport]
  if (Number.isInteger(directBySport) && Number(directBySport) > 0) {
    return Number(directBySport)
  }

  if (Array.isArray(payload.pools)) {
    const match = payload.pools.find((item) => {
      if (!isRecord(item)) return false
      return (
        typeof item.sport === 'string' &&
        item.sport.toLowerCase() === normalizedSport &&
        Number.isInteger(item.id) &&
        Number(item.id) > 0
      )
    })

    if (isRecord(match) && Number.isInteger(match.id) && Number(match.id) > 0) {
      return Number(match.id)
    }
  }

  if (Number.isInteger(payload.id) && Number(payload.id) > 0) {
    return Number(payload.id)
  }

  throw new PoolNotFoundError('No active pool found')
}

export async function getTodayPool(sport: string): Promise<Game[]> {
  const todayPoolUrl = resolveTodayPoolUrl(sport)
  const payload = await getJson(todayPoolUrl)
  const poolId = parseTodayPoolId(payload, sport)
  return getPool(poolId)
}
