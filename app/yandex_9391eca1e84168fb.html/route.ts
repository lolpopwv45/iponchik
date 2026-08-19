const headers = {
  'Content-Type': 'text/html; charset=UTF-8',
  'Cache-Control': 'no-store',
}

const html = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 9391eca1e84168fb</body>
</html>`

export const dynamic = 'force-static'

export function GET() {
  return new Response(html, { status: 200, headers })
}

export function HEAD() {
  return new Response(null, { status: 200, headers })
}
