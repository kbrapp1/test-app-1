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
    // Refresh session - important to do before accessing user data
    const { data } = await supabase.auth.getUser()
    user = data.user;
  } catch (error: any) {
    // console.error("Middleware getUser Error:", error); // Removed generic error log
    // Check if it's the specific invalid refresh token error
    if (error.name === 'AuthApiError' && error.message.includes('Invalid Refresh Token')) {
      console.warn('Middleware: Invalid refresh token detected, redirecting to login.');
      // Clear potentially invalid cookies by redirecting (browser handles clearing on response)
      // Or explicitly try to clear cookies on the redirect response if needed, though often not necessary
      return NextResponse.redirect(new URL('/login', request.url));
    } 
    // For other unexpected errors during getUser, we might still want to log or handle them
    // but for now, we just let the user be treated as null.
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

  // If user is not logged in and trying to access a protected route
  if (!user && !publicRoutes.includes(pathname)) {
    // Check if the path is the root, allow it even if user is null (it might be a public landing page)
    // Or handle root protection differently if needed.
    // For this specific project, assuming root should redirect to login if not logged in.
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url))
    } else {
        // For any other non-public route without a user, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If user is logged in and trying to access root, login, or signup pages
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