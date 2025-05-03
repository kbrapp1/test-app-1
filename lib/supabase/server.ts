import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
  const getCookies = async () => {
    const { cookies } = await import('next/headers');
    return cookies();
  }
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const cookieStore = await getCookies();
          return cookieStore.get(name)?.value
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          try {
            const cookieStore = await getCookies();
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle potential errors, especially in Server Components
            console.warn(`Failed to set cookie ${name} in Server Component:`, error)
          }
        },
        remove: async (name: string, options: CookieOptions) => {
          try {
            const cookieStore = await getCookies();
            cookieStore.set({ name, value: '', ...options }) // Use set with empty value
          } catch (error) {
            // Handle potential errors
            console.warn(`Failed to remove cookie ${name} in Server Component:`, error)
          }
        },
      },
    }
  )
}