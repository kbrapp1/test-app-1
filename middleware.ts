import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let user = null;
  try {
    // Fetch user from session on the server
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // In case of any auth error, treat user as null
      user = null;
    } else {
      user = data.user;
    }
  } catch (err: any) {
    // Catch unexpected errors during the getUser call
    user = null;
  }

  const { pathname } = request.nextUrl

  // Skip auth redirects for API routes - they handle their own authentication
  if (pathname.startsWith('/api/')) {
    return response
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/login/forgot',       // Forgot Password
    '/login/reset/password',// Handle password reset link
    '/signup',
    '/auth/confirm',
    '/onboarding'
  ]
  
  // Define routes that authenticated users should be redirected *away* from
  const authRoutes = ['/', '/login', '/signup']

  // If user is not authenticated (user is null) and trying to access a protected route
  if (!user && !publicRoutes.includes(pathname)) {
    // Redirect to login, adding the intended destination as a query param
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect_to', pathname) // Pass the original path
    return NextResponse.redirect(redirectUrl)
  }

  // If user IS authenticated and trying to access root, login, or signup pages
  if (user && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Continue processing the request
  return response
}

export const config = {
  matcher: [
    // Exclude static assets, images, favicon, AND common file extensions
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|css|js)$).*)',
  ],
} 