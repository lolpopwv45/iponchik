const headers = {
  'Content-Type': 'text/html; charset=UTF-8',
  'Cache-Control': 'no-store',
}

const body = 'google-site-verification: google5a6749b7f369b9f9.html\n'

export const dynamic = 'force-static'

export function GET() {
  return new Response(body, { status: 200, headers })
}

export function HEAD() {
  return new Response(null, { status: 200, headers })
}
