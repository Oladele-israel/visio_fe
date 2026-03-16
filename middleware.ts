import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgotPassword',
  '/api/auth',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic =
    pathname === '/' ||
    PUBLIC_PATHS.some(p => p !== '/' && pathname.startsWith(p))

  if (isPublic) return NextResponse.next()

  // Check all possible session cookie names — log them in dev to confirm
  const sessionCookie =
    req.cookies.get('visio.session_token') ??
    req.cookies.get('better-auth.session_token') ??
    req.cookies.get('__Secure-visio.session_token') ??  // Vercel sometimes prefixes
    req.cookies.get('__Host-visio.session_token')

  // Temporary: log all cookies in dev to see what's actually arriving
  if (process.env.NODE_ENV !== 'production') {
    console.log('[middleware] cookies:', req.cookies.getAll().map(c => c.name))
  }

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