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
    // Log cookies received by the middleware
    console.log("Middleware received cookies:", request.cookies.getAll());

    // Fetch user from session on the server
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Check for errors and handle specific cases
      if (error.code === 'refresh_token_not_found') {
        // This is expected when the session/refresh token expires or is invalid
        // Log it as info or debug, not a warning/error
        console.info(`Middleware: Invalid refresh token (user needs to log in). Code: ${error.code}`);
      } else if (!error.message.includes('Auth session missing')) {
        // Log other Supabase auth errors as warnings
        console.warn(`Middleware: Supabase auth error fetching user: ${error.message}. Code: ${error.code}`);
      } 
      // In case of any auth error, treat user as null
      user = null;
    } else {
      user = data.user;
    }
  } catch (err: any) {
    // Catch unexpected errors during the getUser call
    console.error("Middleware: Unexpected error fetching user:", err);
    user = null;
  }

  // --- Remove Debug Logging --- 
  const { pathname } = request.nextUrl
  // console.log(`[Middleware] Processing path: ${pathname}`)
  // console.log(`[Middleware] User object after getUser:`, user);
  // --- End Debug Logging ---

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth/confirm']
  
  // Define routes that authenticated users should be redirected *away* from
  const authRoutes = ['/', '/login', '/signup']

  // --- Remove Debug Logging --- 
  // console.log(`[Middleware] Checking redirect condition: !user (${!user}), !publicRoutes.includes(${pathname}) (${!publicRoutes.includes(pathname)})`);
  // --- End Debug Logging ---

  // If user is not authenticated (user is null) and trying to access a protected route
  if (!user && !publicRoutes.includes(pathname)) {
    // Redirect to login, adding the intended destination as a query param
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect_to', pathname) // Pass the original path
    console.log(`Middleware: No user, redirecting to login for protected route: ${pathname}`);
    return NextResponse.redirect(redirectUrl)
  }

  // If user IS authenticated and trying to access root, login, or signup pages
  if (user && authRoutes.includes(pathname)) {
      console.log(`Middleware: User logged in, redirecting from auth route ${pathname} to /dashboard`);
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