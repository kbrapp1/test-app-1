import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { OrgMember, RoleOption } from '@/types/settings'; // Import from new types file

const REQUEST_TIMEOUT = 8000; // 8 seconds timeout - normal ops complete in 1-5s, this is just a safety net
const MAX_RETRIES = 2;

export function useOrgMembers(organizationId: string | null, debouncedSearchTerm: string) {
    const supabase = createClient();
    const { toast } = useToast();
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper function to refresh session and retry operation
    const withSessionRefresh = useCallback(async <T>(operation: () => Promise<T>, retryCount = 0): Promise<T> => {
        try {
            return await operation();
        } catch (error: any) {
            console.log(`Operation failed:`, error.message);
            
            // Check if this looks like a session/auth error and we haven't retried too many times
            if (retryCount < MAX_RETRIES && (
                error.message?.includes('JWT') || 
                error.message?.includes('session') ||
                error.message?.includes('unauthorized') ||
                error.message?.includes('invalid claim') ||
                error.code === 'PGRST301' // PostgREST auth error
            )) {
                console.log(`Attempting session refresh (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                
                // First, let's see what the current session looks like
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                console.log('Current session state:', {
                    hasSession: !!sessionData.session,
                    hasUser: !!sessionData.session?.user,
                    expiresAt: sessionData.session?.expires_at,
                    now: Math.floor(Date.now() / 1000),
                    isExpired: sessionData.session?.expires_at ? 
                        sessionData.session.expires_at < Math.floor(Date.now() / 1000) : 'unknown',
                    sessionError: sessionError?.message
                });
                
                try {
                    // Attempt to refresh the session
                    const { data, error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshError) {
                        console.warn('Session refresh failed:', refreshError);
                        console.log('Refresh error details:', {
                            message: refreshError.message,
                            status: (refreshError as any).status,
                            code: (refreshError as any).code
                        });
                        throw error; // Throw original error if refresh fails
                    }
                    
                    console.log('Session refreshed successfully:', {
                        hasNewSession: !!data.session,
                        newExpiresAt: data.session?.expires_at
                    });
                    // Wait a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    // Retry the operation
                    return await withSessionRefresh(operation, retryCount + 1);
                } catch (refreshError) {
                    console.warn('Session refresh failed:', refreshError);
                    throw error; // Throw original error if refresh fails
                }
            }
            throw error;
        }
    }, [supabase.auth]);

    // Helper function to add timeout to promises
    const withTimeout = useCallback(<T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
        });
        
        return Promise.race([promise, timeoutPromise]);
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        setMembers([]); // Clear members on new search/orgId change
        setError(null);

        if (!organizationId) {
            setLoading(false);
            setMembers([]);
            setRoles([]);
            return;
        }

        async function fetchData() {
            if (!isMounted) return;
            setLoading(true);

            try {
                await withSessionRefresh(async () => {
                    // Fetch Memberships with timeout
                    const membershipOperation = async () => {
                        const { data: membershipRows, error: membershipError } = await supabase
                            .from('organization_memberships')
                            .select('user_id, role_id, roles(id, name)') // Select role id and name directly
                            .eq('organization_id', organizationId);

                        if (membershipError) throw new Error(`Error loading members: ${membershipError.message}`);
                        return membershipRows;
                    };

                    const membershipRows = await withTimeout(membershipOperation(), REQUEST_TIMEOUT);
                    if (!isMounted) return;

                    const userIds = (membershipRows || []).map((row: any) => row.user_id);
                    let profileRows: any[] = [];
                    let authUserRows: any[] = [];

                    // Fetch Profiles (filtered by search term if provided)
                    if (userIds.length > 0) {
                        const profileOperation = async () => {
                            let profilesQuery = supabase
                                .from('profiles')
                                .select('id, email, full_name, last_sign_in_at')
                                .in('id', userIds);

                            if (debouncedSearchTerm) {
                                profilesQuery = profilesQuery.or(`full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`);
                            }

                            const { data: profilesData, error: profilesError } = await profilesQuery;
                            if (profilesError) throw new Error(`Error loading user profiles: ${profilesError.message}`);
                            return profilesData || [];
                        };

                        profileRows = await withTimeout(profileOperation(), REQUEST_TIMEOUT);
                        if (!isMounted) return;

                        // Fetch invitation details scoped to this organization
                        const invitationOperation = async () => {
                            const { data: authUsersData, error: authUsersError } = await supabase
                                .rpc('get_users_invitation_details', {
                                    user_ids_to_check: userIds,
                                    p_organization_id: organizationId,
                                });

                            if (authUsersError) {
                                // Non-critical error, log it but continue
                                console.warn("Error loading user invitation status:", authUsersError.message);
                            }
                            return authUsersData || [];
                        };

                        try {
                            authUserRows = await withTimeout(invitationOperation(), REQUEST_TIMEOUT);
                        } catch (invitationError) {
                            console.warn("Invitation details fetch failed, continuing without:", invitationError);
                            authUserRows = [];
                        }
                        if (!isMounted) return;
                    }

                    // Filter memberships based on search results from profiles
                    const finalMembershipRows = debouncedSearchTerm && profileRows.length > 0
                        ? (membershipRows || []).filter((memRow: any) => profileRows.some(p => p.id === memRow.user_id))
                        : (debouncedSearchTerm && profileRows.length === 0)
                        ? [] // No profiles match search, so no members match
                        : (membershipRows || []);


                    const mappedMembers: OrgMember[] = finalMembershipRows.map((row: any) => {
                        const profile = profileRows.find(p => p.id === row.user_id) || { email: '', full_name: '', last_sign_in_at: null };
                        const authUser = authUserRows.find(au => au.id === row.user_id) || { invited_at: null };
                        return {
                            id: row.user_id,
                            email: profile.email,
                            name: profile.full_name,
                            role_id: row.role_id,
                            role_name: row.roles?.name || '', // Get role name from join
                            organization_id: organizationId as string, // Assert organizationId is a string here
                            last_sign_in_at: profile.last_sign_in_at,
                            invited_at: authUser.invited_at, // Include invited_at
                        };
                    });
                    if (isMounted) setMembers(mappedMembers);

                    // Fetch Roles (excluding super-admin)
                    const rolesOperation = async () => {
                        const { data: roleRows, error: roleError } = await supabase
                            .from('roles')
                            .select('id, name')
                            .neq('name', 'super-admin');

                        if (roleError) throw new Error(`Error loading roles: ${roleError.message}`);
                        return roleRows || [];
                    };

                    const roleRows = await withTimeout(rolesOperation(), REQUEST_TIMEOUT);
                    if (isMounted) setRoles(roleRows);
                });

            } catch (err: any) {
                console.error("Error fetching org members/roles:", err);
                if (isMounted) {
                    let errorMessage = 'An unexpected error occurred';
                    
                    if (err.message === 'Request timeout') {
                        errorMessage = 'The request is taking longer than expected. This might be due to session refresh after being idle. Please try again.';
                    } else if (err.message?.includes('JWT') || err.message?.includes('session') || err.message?.includes('unauthorized')) {
                        errorMessage = 'Authentication issue detected. Please try refreshing the page or logging out and back in.';
                    } else {
                        errorMessage = err.message;
                    }
                    
                    setError(errorMessage);
                    toast({ 
                        variant: 'destructive', 
                        title: 'Error Loading Organization Data', 
                        description: errorMessage
                    });
                    setMembers([]); // Clear data on error
                    setRoles([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchData();

        return () => { 
            isMounted = false;
        };
    }, [organizationId, debouncedSearchTerm]); // Removed supabase, toast, and callback dependencies

    return { members, roles, loading, error };
}

// Add type definition export to avoid duplication later
// We might need to move these types to a central location like `types/settings.ts` eventually
export type { OrgMember, RoleOption }; 