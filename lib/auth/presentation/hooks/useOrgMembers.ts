"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { OrgMember, RoleOption } from '@/types/settings'; // Import from new types file

const REQUEST_TIMEOUT = 8000; // 8 seconds timeout - normal ops complete in 1-5s, this is just a safety net
const MAX_RETRIES = 1; // Reduced retries - fail fast and redirect to login

// Type guard for error objects
function isErrorWithMessage(error: unknown): error is Error & { message: string } {
    return error instanceof Error && typeof error.message === 'string';
}

// Type guard for errors with code property
function isErrorWithCode(error: unknown): error is Error & { code: string } {
    return error instanceof Error && 'code' in error && typeof (error as Error & { code: unknown }).code === 'string';
}

// Database row types
interface MembershipRow {
    user_id: string;
    role_id: string;
    roles?: {
        id: string;
        name: string;
    } | null;
}

interface ProfileRow {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
}

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
        } catch (error: unknown) {
            
            // Check if this looks like a session/auth error and we haven't retried too many times
            if (retryCount < MAX_RETRIES && (
                (isErrorWithMessage(error) && (
                    error.message.includes('JWT') || 
                    error.message.includes('session') ||
                    error.message.includes('unauthorized') ||
                    error.message.includes('invalid claim')
                )) ||
                (isErrorWithCode(error) && error.code === 'PGRST301') // PostgREST auth error
            )) {
                
                // First, let's see what the current session looks like
                const { data: _sessionData, error: _sessionError } = await supabase.auth.getSession();
                
                try {
                    // Attempt to refresh the session
                    const { data: _data, error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshError) {
                        console.warn('Session refresh failed:', refreshError);
                        
                        // Session refresh failed - redirect to login immediately
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 500);
                        throw new Error('Session expired - redirecting to login');
                    }
                    
                    
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
            if (isErrorWithMessage(error) && (
                error.message.includes('JWT') || 
                error.message.includes('session') ||
                error.message.includes('unauthorized') ||
                error.message.includes('invalid claim')
            )) {
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
                        return (membershipRows as unknown) as MembershipRow[];
                    };

                    const membershipRows = await withTimeout(membershipOperation(), REQUEST_TIMEOUT);
                    if (!isMounted) return;

                    const userIds = (membershipRows || []).map((row) => row.user_id);
                    let profileRows: ProfileRow[] = [];

                    if (userIds.length > 0) {
                        // Fetch User Profiles with timeout (includes email)
                        const profileOperation = async () => {
                            const { data: profiles, error: profileError } = await supabase
                                .from('profiles')
                                .select('id, full_name, email, avatar_url')
                                .in('id', userIds);

                            if (profileError) throw new Error(`Error loading profiles: ${profileError.message}`);
                            return ((profiles || []) as unknown) as ProfileRow[];
                        };

                        profileRows = await withTimeout(profileOperation(), REQUEST_TIMEOUT);
                        if (!isMounted) return;
                    }

                    // Map to combined members
                    const mappedMembers: OrgMember[] = (membershipRows || []).map((membership) => {
                        const profile = profileRows.find(p => p.id === membership.user_id);

                        const displayName = profile?.full_name
                            ? profile.full_name
                            : (profile?.email ? profile.email.split('@')[0] : 'Unknown User');

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
                        return ((roleRows || []) as unknown) as RoleOption[];
                    };

                    const roleRows = await withTimeout(rolesOperation(), REQUEST_TIMEOUT);
                    if (isMounted) setRoles(roleRows);
                });

            } catch (err: unknown) {
                console.error("Error fetching org members/roles:", err);
                if (isMounted) {
                    let errorMessage = 'An unexpected error occurred';
                    
                    if (isErrorWithMessage(err)) {
                        if (err.message === 'Request timeout') {
                            errorMessage = 'The request is taking longer than expected. This might be due to session refresh after being idle. Please try again.';
                        } else if (err.message.includes('Session expired - redirecting to login')) {
                            // Don't show toast for session errors - user will be redirected
                            return;
                        } else if (err.message.includes('JWT') || err.message.includes('session') || err.message.includes('unauthorized')) {
                            errorMessage = 'Authentication issue detected. Redirecting to login...';
                        } else {
                            errorMessage = err.message;
                        }
                    }
                    
                    setError(errorMessage);
                    
                    // Only show toast for non-session errors
                    if (!isErrorWithMessage(err) || !err.message.includes('Session expired - redirecting to login')) {
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