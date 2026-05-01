import { NextResponse, type NextRequest } from 'next/server'

/**
 * Decode the Supabase session from cookies WITHOUT any network call.
 *
 * Supabase SSR stores the session in one of these formats:
 *   1. Single cookie:  sb-<ref>-auth-token  = base64url(JSON([accessToken, refreshToken]))
 *   2. Chunked cookies: sb-<ref>-auth-token.0, .1, .2 ... (when JWT > 4KB)
 *
 * We reassemble the chunks, parse the access token (a JWT), and decode
 * the payload to get the user's role for routing — no network call needed.
 */
function getSessionFromCookies(request: NextRequest): { role: string } | null {
  try {
    const allCookies = request.cookies.getAll()

    // Find the base auth cookie name (sb-<ref>-auth-token)
    const baseCookie = allCookies.find(
      (c) => c.name.match(/^sb-.+-auth-token$/) && !c.name.includes('.0')
    )
    const chunkedBase = allCookies.find((c) =>
      c.name.match(/^sb-.+-auth-token\.0$/)
    )

    let rawValue: string | null = null

    if (baseCookie) {
      rawValue = baseCookie.value
    } else if (chunkedBase) {
      // Reassemble chunked cookies: .0, .1, .2, ...
      const baseName = chunkedBase.name.replace('.0', '')
      let combined = ''
      let i = 0
      while (true) {
        const chunk = request.cookies.get(`${baseName}.${i}`)
        if (!chunk) break
        combined += chunk.value
        i++
      }
      rawValue = combined
    }

    if (!rawValue) return null

    // URL-decode if needed
    if (rawValue.startsWith('%')) {
      rawValue = decodeURIComponent(rawValue)
    }

    // Parse the value — could be JSON array, JSON object, or raw JWT
    let accessToken: string | null = null

    if (rawValue.startsWith('[')) {
      const parsed = JSON.parse(rawValue)
      accessToken = parsed[0]
    } else if (rawValue.startsWith('{')) {
      const parsed = JSON.parse(rawValue)
      accessToken = parsed.access_token
    } else if (rawValue.startsWith('base64-')) {
      // Supabase v2 stores it as base64-<encoded>
      const decoded = atob(rawValue.replace('base64-', ''))
      const parsed = JSON.parse(decoded)
      accessToken = parsed.access_token ?? parsed[0]
    } else {
      // Raw JWT
      accessToken = rawValue
    }

    if (!accessToken) return null

    // Decode JWT payload (base64url → JSON)
    const parts = accessToken.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    )

    // Treat expired tokens as unauthenticated — page will redirect to login for refresh
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }

    const role = (payload.user_metadata?.role as string) ?? 'admin_trainer'
    return { role }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — always accessible
  const publicRoutes = ['/login', '/signup', '/invite', '/']
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/')

  // Decode session locally — zero network calls, zero timeout risk
  const session = getSessionFromCookies(request)

  // Redirect unauthenticated users to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based routing for authenticated users
  if (session) {
    const { role } = session
    const isAuthPage = ['/login', '/signup', '/invite'].includes(pathname)

    const adminRoutes = [
      '/dashboard', '/clients', '/workouts', '/health', '/goals',
      '/notes', '/settings', '/calendar', '/nutrition-plans', '/team', '/exercise-library',
    ]
    const clientRoutes = [
      '/client-dashboard', '/my-workouts', '/nutrition', '/my-health',
      '/my-goals', '/client-settings', '/my-calendar',
    ]

    const isAdminRoute = adminRoutes.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )
    const isClientRoute = clientRoutes.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )

    // Redirect from auth pages / root to the correct dashboard
    if (isAuthPage || pathname === '/') {
      if (role === 'client') return NextResponse.redirect(new URL('/client-dashboard', request.url))
      if (role === 'trainer') return NextResponse.redirect(new URL('/trainer-dashboard', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Block cross-role access
    if (role === 'client' && (isAdminRoute || pathname === '/trainer-dashboard')) {
      return NextResponse.redirect(new URL('/client-dashboard', request.url))
    }
    if (role === 'trainer' && isClientRoute) {
      return NextResponse.redirect(new URL('/trainer-dashboard', request.url))
    }
    if (role === 'trainer' && (pathname === '/team' || pathname.startsWith('/team/'))) {
      return NextResponse.redirect(new URL('/trainer-dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
