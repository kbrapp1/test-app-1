import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Create a Supabase client on the browser, forcing implicit grant for password recovery
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',        // Use implicit grant instead of PKCE
        detectSessionInUrl: true,     // Ensure hash fragment is parsed automatically
      },
    }
  )
} 