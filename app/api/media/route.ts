import { NextResponse } from 'next/server'
import { isAllowedStorageUrl } from '@/lib/media-proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('u')
  if (!url || !isAllowedStorageUrl(url)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 400 })
  }

  const upstream = await fetch(url, {
    cache: 'force-cache',
    redirect: 'error',
  })
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Not found' }, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Unsupported' }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
