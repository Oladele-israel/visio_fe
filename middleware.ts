import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',           // landing page — always public
  '/login',
  '/signup',
  '/forgotPassword',
  '/api/auth',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow all public paths through immediately
  const isPublic =
    pathname === '/' ||
    PUBLIC_PATHS.some(p => p !== '/' && pathname.startsWith(p))

  if (isPublic) return NextResponse.next()

  // Check session cookie — set by better-auth as 'visio.session_token'
  const sessionCookie = req.cookies.get('visio.session_token')

  if (!sessionCookie?.value) {
    if (pathname.startsWith('/api/')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
