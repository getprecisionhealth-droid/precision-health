import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚡ Use getSession() instead of getUser() in middleware.
  // getUser() makes a network round-trip to Supabase on EVERY request which
  // causes MIDDLEWARE_INVOCATION_TIMEOUT on Vercel's Edge runtime.
  // getSession() reads the session from the cookie locally — no network call.
  // Full server-side verification (getUser) is done inside individual pages/API routes.
  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch {
    // If session parsing fails, treat as unauthenticated and fall through
  }

  const user = session?.user ?? null
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/signup', '/invite', '/']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/auth')

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For authenticated users: role-based routing
  if (user) {
    const role = (user.user_metadata?.role as string) ?? 'admin_trainer'

    const isAuthPage = ['/login', '/signup', '/invite'].includes(pathname)

    // Route groups
    const adminRoutes = ['/dashboard', '/clients', '/workouts', '/health', '/goals', '/notes', '/settings', '/calendar', '/nutrition-plans', '/team', '/exercise-library']
    const trainerRoutes = ['/trainer-dashboard', '/clients', '/workouts', '/health', '/goals', '/notes', '/settings', '/calendar', '/nutrition-plans', '/exercise-library']
    const clientRoutes = ['/client-dashboard', '/my-workouts', '/nutrition', '/my-health', '/my-goals', '/client-settings', '/my-calendar']

    const isAdminRoute = adminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
    const isClientRoute = clientRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

    // Redirect from auth pages to correct dashboard
    if (isAuthPage) {
      if (role === 'client') return NextResponse.redirect(new URL('/client-dashboard', request.url))
      if (role === 'trainer') return NextResponse.redirect(new URL('/trainer-dashboard', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect root to correct dashboard
    if (pathname === '/') {
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
    // Trainers cannot access admin-only routes
    if (role === 'trainer' && (pathname === '/team' || pathname.startsWith('/team/'))) {
      return NextResponse.redirect(new URL('/trainer-dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
