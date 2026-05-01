import { NextResponse, type NextRequest } from 'next/server'

/**
 * Decode a Supabase JWT payload from cookies WITHOUT any network call.
 *
 * Supabase stores the session in a cookie named:
 *   sb-<project-ref>-auth-token
 * The value is a base64url-encoded JSON array: [accessToken, refreshToken]
 * We only need the access token (index 0), which is a standard JWT.
 *
 * We decode the JWT payload locally (no signature verification needed for
 * routing decisions — actual auth verification happens inside pages/API routes).
 */
function getSessionFromCookies(request: NextRequest): { user: { role: string } | null } {
  try {
    // Find the Supabase auth cookie (pattern: sb-*-auth-token)
    const authCookie = request.cookies.getAll().find(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )

    if (!authCookie?.value) return { user: null }

    // The cookie value is a base64url-encoded JSON string: [accessToken, refreshToken]
    let tokenValue = authCookie.value

    // Handle URL-encoded values
    if (tokenValue.startsWith('%')) {
      tokenValue = decodeURIComponent(tokenValue)
    }

    // Parse the array if wrapped in JSON
    let accessToken: string
    if (tokenValue.startsWith('[')) {
      const parsed = JSON.parse(tokenValue)
      accessToken = parsed[0]
    } else if (tokenValue.startsWith('{')) {
      const parsed = JSON.parse(tokenValue)
      accessToken = parsed.access_token
    } else {
      // It might be the raw JWT directly
      accessToken = tokenValue
    }

    if (!accessToken) return { user: null }

    // Decode the JWT payload (middle segment, base64url)
    const parts = accessToken.split('.')
    if (parts.length !== 3) return { user: null }

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    )

    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Token expired — treat as unauthenticated; page will handle refresh
      return { user: null }
    }

    const role = (payload.user_metadata?.role as string) ?? 'admin_trainer'
    return { user: { role } }
  } catch {
    return { user: null }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — always accessible
  const publicRoutes = ['/login', '/signup', '/invite', '/']
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith('/api/auth')

  // Decode session from cookie — purely local, zero network calls
  const { user } = getSessionFromCookies(request)

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based routing for authenticated users
  if (user) {
    const { role } = user
    const isAuthPage = ['/login', '/signup', '/invite'].includes(pathname)

    const adminRoutes = ['/dashboard', '/clients', '/workouts', '/health', '/goals', '/notes', '/settings', '/calendar', '/nutrition-plans', '/team', '/exercise-library']
    const clientRoutes = ['/client-dashboard', '/my-workouts', '/nutrition', '/my-health', '/my-goals', '/client-settings', '/my-calendar']

    const isAdminRoute = adminRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))
    const isClientRoute = clientRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))

    // Redirect from auth pages to the correct dashboard
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
