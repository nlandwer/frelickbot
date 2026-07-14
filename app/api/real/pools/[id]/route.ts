import { NextRequest, NextResponse } from 'next/server'
import { getRealHeaders } from '@/lib/server/real-session'

const REAL_API_ORIGIN = process.env.REAL_API_ORIGIN ?? 'https://api.real.vg'

export const runtime = 'nodejs'

async function fetchUpstreamPool(poolId: number) {
  const upstreamUrl = `${REAL_API_ORIGIN.replace(/\/+$/, '')}/pools/${poolId}`
  const headers = getRealHeaders()

  console.log('[real-test] URL:', upstreamUrl)

  const response = await fetch(upstreamUrl, {
    method: 'GET',
    headers,
  })

  console.log('[real-test] Status:', response.status)

  return response
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const parsedId = Number.parseInt(id, 10)
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: 'Invalid pool id' }, { status: 400 })
  }

  try {
    const upstreamResponse = await fetchUpstreamPool(parsedId)

    if (upstreamResponse.status !== 200) {
      const body = await upstreamResponse.text()
      console.log('[real-test] Body:', body)
      return new NextResponse(body, {
        status: upstreamResponse.status,
        headers: {
          'content-type': upstreamResponse.headers.get('content-type') ?? 'text/plain',
        },
      })
    }

    const data = await upstreamResponse.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('[real-test] Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch upstream pool' }, { status: 502 })
  }
}
