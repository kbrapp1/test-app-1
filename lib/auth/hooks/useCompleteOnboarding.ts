import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthentication } from '@/lib/auth/providers/AuthenticationProvider'
import { useToast } from '@/components/ui/use-toast'

/**
 * This hook checks if a logged-in user needs to complete their application-level onboarding.
 * 
 * Uses shared AuthenticationProvider (eliminates redundant auth calls)
 * 
 * Specifically, it looks for users who:
 * 1. Have a confirmed email (via clicking an invite link or password reset)
 * 2. Were invited to an organization (have invited_to_org_id in user_metadata)
 * 3. But don't have an active_organization_id set in their app_metadata
 * 
 * For these users, it calls the complete-onboarding-membership Edge Function
 * to properly set their active_organization_id, which is needed for the
 * organization and role to appear in the profile and for organization-specific
 * features to work correctly.
 * 
 * This hook is particularly useful for handling users who clicked an invite link,
 * which confirmed their email, but either:
 * - Navigated away from the onboarding form before setting a password
 * - Or later used password reset but still need their organization setup completed
 * 
 * @returns {Object} Status indicators for the completion process
 */
export function useCompleteOnboarding() {
  const supabase = createClient()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuthentication() // Use shared auth context
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const finalizeAppOnboarding = async () => {
      // Check if already completed to avoid unnecessary reruns
      if (isCompleting || isCompleted) return
      
      // Wait for authentication to be resolved
      if (!isAuthenticated || !user) {
        return
      }

      try {
        setIsCompleting(true)

        // Check conditions for onboarding completion
        const needsOnboardingCompletion = 
          user.email_confirmed_at && // Email is confirmed
          user.user_metadata?.invited_to_org_id && // Was invited to an organization
          !user.app_metadata?.active_organization_id // But active org is not set
        
        if (!needsOnboardingCompletion) {
          // User either doesn't need completion or is already properly set up
          setIsCompleted(true)
          return
        }

        // AI: Removed console.log - use proper logging service in production
        
        // Get the current session for the auth header
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('No active session to finalize onboarding.')
          return
        }

        // Call the Edge Function to complete onboarding
        toast({ 
          title: 'Account Update', 
          description: 'Finalizing your organization setup...' 
        })

        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          'complete-onboarding-membership',
          { 
            headers: { 
              Authorization: `Bearer ${session.access_token}` 
            } 
          }
        )

        if (fnError) {
          throw fnError
        }
        
        if (fnData && typeof fnData === 'object' && 'error' in fnData) {
          // Handle errors returned in the function's JSON response
          throw new Error(
            typeof fnData.error === 'object' && fnData.error 
              ? (fnData.error.details || fnData.error.error || 'Error completing onboarding')
              : String(fnData.error)
          )
        }

        // AI: Removed console.log - use proper logging service in production
        
        // Refresh session to get updated JWT with org claims
        const { error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.warn('Session refresh warning:', refreshError.message)
          toast({ 
            variant: 'default', 
            title: 'Session Refresh Note', 
            description: 'Organization details will update on next login or refresh.' 
          })
        } else {
          toast({ 
            title: 'Setup Complete!', 
            description: 'Your organization access is now active.' 
          })
          // The UI should automatically update due to auth state change
        }
        
        setIsCompleted(true)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to complete organization setup';
        console.error('Failed to finalize app onboarding:', errorMessage);
        toast({ 
          variant: 'destructive', 
          title: 'Setup Issue', 
          description: errorMessage 
        })
      } finally {
        setIsCompleting(false)
      }
    }

    // Run the onboarding completion check
    finalizeAppOnboarding()
  }, [supabase, toast, user, isAuthenticated, isCompleting, isCompleted])

  return { isCompleting, isCompleted }
} 