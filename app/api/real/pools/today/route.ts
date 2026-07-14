import { NextRequest, NextResponse } from 'next/server'
import { getRealHeaders } from '@/lib/server/real-session'

const REAL_WEB_ORIGIN = process.env.REAL_WEB_ORIGIN ?? 'https://web.realapp.com'
const REAL_API_ORIGIN = process.env.REAL_API_ORIGIN ?? 'https://api.real.vg'

export const runtime = 'nodejs'

type PostSummary = {
  postId: number
  header: string
  display: string
}

function parsePostSummaries(payload: unknown): PostSummary[] {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('latestDayContent' in payload) ||
    !payload.latestDayContent ||
    typeof payload.latestDayContent !== 'object' ||
    (!('items' in payload.latestDayContent) || !Array.isArray(payload.latestDayContent.items)) &&
    (!('content' in payload.latestDayContent) || !Array.isArray(payload.latestDayContent.content))
  ) {
    return []
  }

  const blocks = Array.isArray(payload.latestDayContent.items)
    ? payload.latestDayContent.items
    : payload.latestDayContent.content
  const summaries: PostSummary[] = []

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const entityType = 'entityType' in block ? block.entityType : undefined
    const header = 'header' in block && typeof block.header === 'string' ? block.header : ''
    const posts = 'posts' in block ? block.posts : undefined
    if (entityType !== 'post' || !Array.isArray(posts)) continue

    for (const post of posts) {
      if (!post || typeof post !== 'object') continue
      const postId = 'postId' in post ? Number(post.postId) : Number.NaN
      const display = 'display' in post && typeof post.display === 'string' ? post.display : ''
      if (Number.isInteger(postId) && postId > 0) {
        summaries.push({ postId, header, display })
      }
    }
  }

  return summaries
}

function choosePoolPostId(summaries: PostSummary[]): number | null {
  const poolPost = summaries.find((summary) => {
    const display = summary.display.trim().toLowerCase()
    const header = summary.header.trim().toLowerCase()
    return display === 'pool of the day' || header === 'pool of the day'
  })
  return poolPost ? poolPost.postId : null
}

function parsePoolIdFromPostPayload(payload: unknown): number | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('post' in payload) ||
    !payload.post ||
    typeof payload.post !== 'object' ||
    !('content' in payload.post) ||
    !payload.post.content ||
    typeof payload.post.content !== 'object' ||
    !('nodes' in payload.post.content) ||
    !Array.isArray(payload.post.content.nodes)
  ) {
    return null
  }

  for (const node of payload.post.content.nodes) {
    if (!node || typeof node !== 'object') continue
    if (!('type' in node) || node.type !== 'Pool') continue

    const poolId = 'poolId' in node ? Number(node.poolId) : Number.NaN
    if (Number.isInteger(poolId) && poolId > 0) {
      return poolId
    }
  }

  return null
}

async function fetchJson(url: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, {
    method: 'GET',
    headers: getRealHeaders(),
    cache: 'no-store',
  })

  const bodyText = await response.text()
  let body: unknown = null
  try {
    body = JSON.parse(bodyText)
  } catch {
    body = bodyText
  }

  return {
    status: response.status,
    body,
  }
}

async function fetchFirstOkJson(urls: string[]): Promise<{ status: number; body: unknown }> {
  let lastResult: { status: number; body: unknown } = { status: 502, body: null }

  for (const url of urls) {
    const result = await fetchJson(url)
    if (result.status === 200) {
      return result
    }
    lastResult = result
  }

  return lastResult
}

export async function GET(request: NextRequest) {
  const sportParam = request.nextUrl.searchParams.get('sport')
  const sport = (sportParam ?? '').trim().toLowerCase()

  if (!sport) {
    return NextResponse.json({ error: 'Missing sport query param' }, { status: 400 })
  }

  try {
    const homeResult = await fetchFirstOkJson([
      `${REAL_WEB_ORIGIN.replace(/\/+$/, '')}/home/${sport}/next?cohort=0`,
      `${REAL_API_ORIGIN.replace(/\/+$/, '')}/home/${sport}/next?cohort=0`,
    ])

    if (homeResult.status !== 200) {
      return NextResponse.json({ error: 'Failed to resolve today pool from home endpoint' }, { status: 502 })
    }

    const postSummaries = parsePostSummaries(homeResult.body)
    const postId = choosePoolPostId(postSummaries)

    if (!postId) {
      return NextResponse.json({ error: 'No pool post found for sport' }, { status: 404 })
    }

    const postResult = await fetchFirstOkJson([
      `${REAL_WEB_ORIGIN.replace(/\/+$/, '')}/posts/${postId}?version=2`,
      `${REAL_API_ORIGIN.replace(/\/+$/, '')}/posts/${postId}?version=2`,
    ])

    if (postResult.status !== 200) {
      return NextResponse.json({ error: 'Failed to resolve pool post details' }, { status: 502 })
    }

    const poolId = parsePoolIdFromPostPayload(postResult.body)
    if (!poolId) {
      return NextResponse.json({ error: 'No pool id found in post content' }, { status: 404 })
    }

    return NextResponse.json({ sport, id: poolId })
  } catch {
    return NextResponse.json({ error: 'Failed to resolve today pool id' }, { status: 502 })
  }
}
