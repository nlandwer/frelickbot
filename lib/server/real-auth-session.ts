type JsonObject = Record<string, unknown>

interface RealSession {
  realAuthInfo: string
  realRequestToken: string
  expiresAt: number
}

const REAL_API_ORIGIN = process.env.REAL_API_ORIGIN ?? 'https://api.real.vg'
const REAL_LOGIN_ENDPOINT = process.env.REAL_LOGIN_ENDPOINT ?? '/users/login'
const REAL_REQUEST_TOKEN_SOURCE_ENDPOINT =
  process.env.REAL_REQUEST_TOKEN_SOURCE_ENDPOINT ?? '/home/mlb/next'
const REAL_SESSION_TTL_SECONDS = Number.parseInt(process.env.REAL_SESSION_TTL_SECONDS ?? '3300', 10)

let cachedSession: RealSession | null = null
let inflightSessionPromise: Promise<RealSession> | null = null

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return (
    normalized.includes('password') ||
    normalized.includes('token') ||
    normalized.includes('auth') ||
    normalized.includes('authorization') ||
    normalized.includes('cookie')
  )
}

function isPasswordKey(key: string): boolean {
  return key.toLowerCase() === 'password'
}

function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item))
  }

  if (isRecord(value)) {
    const redacted: JsonObject = {}
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = isSensitiveKey(key) ? '[REDACTED]' : redactSecrets(item)
    }
    return redacted
  }

  return value
}

function redactHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of headers.entries()) {
    result[key] = isSensitiveKey(key) ? '[REDACTED]' : value
  }
  return result
}

function redactPasswordOnly(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactPasswordOnly(item))
  }

  if (isRecord(value)) {
    const redacted: JsonObject = {}
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = isPasswordKey(key) ? '[REDACTED]' : redactPasswordOnly(item)
    }
    return redacted
  }

  return value
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null
}

function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '')
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

function getDeviceHeaders(): Record<string, string> {
  return {
    'real-device-uuid': process.env.REAL_DEVICE_UUID ?? '',
    'real-device-name': process.env.REAL_DEVICE_NAME ?? '',
    'real-device-type': process.env.REAL_DEVICE_TYPE ?? 'web',
    'real-version': process.env.REAL_VERSION ?? '',
    id: process.env.REAL_ID ?? '',
  }
}

function addPresentHeaders(target: Headers, source: Record<string, string>) {
  for (const [key, value] of Object.entries(source)) {
    if (value.trim() !== '') {
      target.set(key, value.trim())
    }
  }
}

function pickStringByPath(source: unknown, path: string[]): string {
  let current: unknown = source
  for (const key of path) {
    if (!isRecord(current)) return ''
    current = current[key]
  }
  return typeof current === 'string' ? current.trim() : ''
}

function pickFirstStringByPaths(source: unknown, paths: string[][]): string {
  for (const path of paths) {
    const value = pickStringByPath(source, path)
    if (value !== '') return value
  }
  return ''
}

function buildLoginBody(): JsonObject {
  const rawPayload = process.env.REAL_LOGIN_PAYLOAD_JSON
  if (!rawPayload || rawPayload.trim() === '') {
    throw new Error(
      'Missing REAL_LOGIN_PAYLOAD_JSON. Use the exact login payload captured from Proxyman.'
    )
  }

  const parsed: unknown = JSON.parse(rawPayload)
  if (!isRecord(parsed)) {
    throw new Error('REAL_LOGIN_PAYLOAD_JSON must be a JSON object')
  }
  if (!Object.prototype.hasOwnProperty.call(parsed, 'password')) {
    throw new Error('REAL_LOGIN_PAYLOAD_JSON must include a password field from the captured payload.')
  }

  const configuredPassword = process.env.REAL_LOGIN_PASSWORD
  if (!configuredPassword || configuredPassword.trim() === '') {
    throw new Error('Missing REAL_LOGIN_PASSWORD for login payload password override.')
  }

  return {
    ...parsed,
    password: configuredPassword,
  }
}

function getLoginBodyJsonString(): string {
  return JSON.stringify(buildLoginBody())
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.trim() === '') return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

function extractRealAuthInfo(loginBody: unknown, loginResponse: Response): string {
  const fromHeader = loginResponse.headers.get('real-auth-info')?.trim() ?? ''
  if (fromHeader !== '') return fromHeader

  return pickFirstStringByPaths(loginBody, [
    ['realAuthInfo'],
    ['authInfo'],
    ['token'],
    ['data', 'token'],
    ['data', 'realAuthInfo'],
    ['session', 'token'],
  ])
}

function extractRequestTokenFromBody(body: unknown): string {
  return pickFirstStringByPaths(body, [
    ['realRequestToken'],
    ['requestToken'],
    ['data', 'realRequestToken'],
    ['data', 'requestToken'],
  ])
}

async function fetchRequestToken(realAuthInfo: string): Promise<string> {
  const url = joinUrl(REAL_API_ORIGIN, REAL_REQUEST_TOKEN_SOURCE_ENDPOINT)
  const headers = new Headers()
  headers.set('accept', 'application/json')
  addPresentHeaders(headers, getDeviceHeaders())
  headers.set('real-auth-info', realAuthInfo)

  const response = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  const fromHeader = response.headers.get('real-request-token')?.trim() ?? ''
  if (fromHeader !== '') return fromHeader

  const body = await parseJsonSafe(response)
  const fromBody = extractRequestTokenFromBody(body)
  if (fromBody !== '') return fromBody

  throw new Error('Unable to derive real-request-token from authenticated bootstrap response')
}

async function authenticateRealSession(): Promise<RealSession> {
  const loginUrl = joinUrl(REAL_API_ORIGIN, REAL_LOGIN_ENDPOINT)
  const headers = new Headers()
  headers.set('accept', 'application/json')
  headers.set('content-type', 'application/json')
  addPresentHeaders(headers, getDeviceHeaders())

  const loginBodyPayload = buildLoginBody()
  const loginBodyJson = getLoginBodyJsonString()

  // Temporary verbose diagnostics for Real login request flow.
  console.log('[real-auth] login url:', loginUrl)
  console.log('[real-auth] login method:', 'POST')
  console.log('[real-auth] login headers:', redactHeaders(headers))
  console.log('[real-auth] login body:', redactPasswordOnly(loginBodyPayload))

  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers,
    body: loginBodyJson,
    cache: 'no-store',
  })

  const loginResponseClone = loginResponse.clone()
  const loginBody = await parseJsonSafe(loginResponse)

  if (!loginResponse.ok) {
    const loginResponseText = await loginResponseClone.text()
    console.error('[real-auth] login non-200 status:', loginResponse.status)
    console.error('[real-auth] login non-200 response body:', loginResponseText)
    throw new Error(`Real login failed (${loginResponse.status})`)
  }

  const realAuthInfo = extractRealAuthInfo(loginBody, loginResponse)
  if (realAuthInfo === '') {
    throw new Error('Unable to derive real-auth-info from login response')
  }

  const requestTokenFromLoginHeader = loginResponse.headers.get('real-request-token')?.trim() ?? ''
  const requestTokenFromLoginBody = extractRequestTokenFromBody(loginBody)
  const realRequestToken =
    requestTokenFromLoginHeader !== ''
      ? requestTokenFromLoginHeader
      : requestTokenFromLoginBody !== ''
        ? requestTokenFromLoginBody
        : await fetchRequestToken(realAuthInfo)

  return {
    realAuthInfo,
    realRequestToken,
    expiresAt: Date.now() + Math.max(60, REAL_SESSION_TTL_SECONDS) * 1000,
  }
}

export async function getRealSession(forceRefresh = false): Promise<RealSession> {
  if (!forceRefresh && cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession
  }

  if (inflightSessionPromise) {
    return inflightSessionPromise
  }

  inflightSessionPromise = authenticateRealSession()
    .then((session) => {
      cachedSession = session
      return session
    })
    .finally(() => {
      inflightSessionPromise = null
    })

  return inflightSessionPromise
}

export async function getRealPoolRequestHeaders(forceRefresh = false): Promise<Headers> {
  const session = await getRealSession(forceRefresh)
  const headers = new Headers()
  headers.set('accept', 'application/json')
  addPresentHeaders(headers, getDeviceHeaders())
  headers.set('real-auth-info', session.realAuthInfo)
  headers.set('real-request-token', session.realRequestToken)
  return headers
}
