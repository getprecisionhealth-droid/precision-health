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

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/signup', '/client-login', '/client-signup', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For authenticated users: role-based routing
  if (user) {
    // Determine role from user metadata (fast, no extra DB call)
    const role = (user.user_metadata?.role as string) ?? 'trainer'

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/client-login' || pathname === '/client-signup'
    const trainerRoutes = ['/dashboard', '/clients', '/workouts', '/health', '/goals', '/notes', '/settings']
    const clientRoutes = ['/client-dashboard', '/my-workouts', '/nutrition', '/my-health', '/my-goals', '/client-settings']

    const isTrainerRoute = trainerRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
    const isClientRoute = clientRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

    // Redirect from auth pages to correct dashboard
    if (isAuthPage) {
      const dest = role === 'client' ? '/client-dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // Redirect root to correct dashboard
    if (pathname === '/') {
      const dest = role === 'client' ? '/client-dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // Block cross-role access
    if (role === 'client' && isTrainerRoute) {
      return NextResponse.redirect(new URL('/client-dashboard', request.url))
    }
    if (role === 'trainer' && isClientRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
