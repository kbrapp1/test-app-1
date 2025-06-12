import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { OrgMember, RoleOption } from '@/types/settings'; // Import from new types file

const REQUEST_TIMEOUT = 8000; // 8 seconds timeout - normal ops complete in 1-5s, this is just a safety net
const MAX_RETRIES = 1; // Reduced retries - fail fast and redirect to login

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
                        
                        // Session refresh failed - redirect to login immediately
                        console.log('Session refresh failed - redirecting to login');
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 500);
                        throw new Error('Session expired - redirecting to login');
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
                    // Redirect to login on refresh failure
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 500);
                    throw new Error('Session expired - redirecting to login');
                }
            }
            
            // If it's a session error but we've exceeded retries, redirect to login
            if (error.message?.includes('JWT') || 
                error.message?.includes('session') ||
                error.message?.includes('unauthorized') ||
                error.message?.includes('invalid claim')) {
                console.log('Session error detected - redirecting to login');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
                throw new Error('Session expired - redirecting to login');
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

                    if (userIds.length > 0) {
                        // Fetch User Profiles with timeout (includes email)
                        const profileOperation = async () => {
                            const { data: profiles, error: profileError } = await supabase
                                .from('profiles')
                                .select('id, full_name, email, avatar_url')
                                .in('id', userIds);

                            if (profileError) throw new Error(`Error loading profiles: ${profileError.message}`);
                            return profiles || [];
                        };

                        profileRows = await withTimeout(profileOperation(), REQUEST_TIMEOUT);
                        if (!isMounted) return;
                    }

                    // Map to combined members
                    const mappedMembers: OrgMember[] = (membershipRows || []).map((membership: any) => {
                        const profile = profileRows.find(p => p.id === membership.user_id);

                        const displayName = profile?.full_name
                            ? profile.full_name
                            : profile?.email?.split('@')[0] || 'Unknown User';

                        // Filter based on search term if provided
                        if (debouncedSearchTerm && !displayName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) && 
                            !(profile?.email || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
                            return null;
                        }

                        return {
                            id: membership.user_id,
                            email: profile?.email || '',
                            name: displayName,
                            role_id: membership.role_id,
                            role_name: membership.roles?.name || 'Unknown Role',
                            organization_id: organizationId,
                        };
                    }).filter((member): member is OrgMember => member !== null);

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
                    } else if (err.message?.includes('Session expired - redirecting to login')) {
                        // Don't show toast for session errors - user will be redirected
                        return;
                    } else if (err.message?.includes('JWT') || err.message?.includes('session') || err.message?.includes('unauthorized')) {
                        errorMessage = 'Authentication issue detected. Redirecting to login...';
                    } else {
                        errorMessage = err.message;
                    }
                    
                    setError(errorMessage);
                    
                    // Only show toast for non-session errors
                    if (!err.message?.includes('Session expired - redirecting to login')) {
                        toast({ 
                            variant: 'destructive', 
                            title: 'Error Loading Organization Data', 
                            description: errorMessage
                        });
                    }
                    
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
    }, [organizationId, debouncedSearchTerm, withSessionRefresh, withTimeout, supabase, toast]);

    return { members, roles, loading, error };
} 