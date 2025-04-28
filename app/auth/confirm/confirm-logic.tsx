'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client' // Use the standard client-side client

// This component handles the redirect logic from Supabase email confirmations.
export default function ConfirmLogic() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // If there's an error in the URL params, redirect to login with the error
    if (error) {
      console.error('Auth Confirm Error:', errorDescription || error)
      router.replace(`/login?error=${encodeURIComponent(errorDescription || error)}`)
      return
    }

    // If there's a code, attempt to exchange it (this implicitly handles session creation)
    // Supabase client handles the exchange automatically when it initializes
    // if it finds the code in the URL hash after redirect from email link.
    // However, sometimes it lands here directly with the code as a query param.
    // We don't strictly need exchangeCodeForSession on the client if the session
    // is picked up automatically, but confirming login state is good.

    const checkUserAndRedirect = async () => {
      // Give Supabase client a moment to potentially auto-process the session from the URL hash
      await new Promise(resolve => setTimeout(resolve, 100))

      const { data, error: getUserError } = await supabase.auth.getUser()

      if (getUserError || !data?.user) {
        // If user is still not found, perhaps the code exchange is needed explicitly
        // or something went wrong. Redirect to login.
        console.error('Auth Confirm: User not found after potential code exchange.', getUserError)
        router.replace('/login?error=confirmation_failed')
      } else {
        // User found, session likely established, redirect to dashboard
        router.replace('/dashboard')
      }
    }

    // If there's a code, initiate the check (which implicitly includes exchange process)
    if (code) {
        checkUserAndRedirect();
    } else {
        // If no code and no error, maybe user landed here incorrectly
        console.warn('Auth Confirm: No code or error found.')
        router.replace('/login')
    }

  }, [searchParams, router, supabase])

  // Display a loading or confirmation message while processing
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Verifying your email, please wait...</p>
      {/* Add a spinner component if desired */}
    </div>
  )
} 