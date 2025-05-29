import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { OrgMember, RoleOption } from '@/types/settings'; // Import from new types file

export function useOrgMembers(organizationId: string | null, debouncedSearchTerm: string) {
    const supabase = createClient();
    const { toast } = useToast();
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                // Fetch Memberships
                const { data: membershipRows, error: membershipError } = await supabase
                    .from('organization_memberships')
                    .select('user_id, role_id, roles(id, name)') // Select role id and name directly
                    .eq('organization_id', organizationId);

                if (membershipError) throw new Error(`Error loading members: ${membershipError.message}`);
                if (!isMounted) return;

                const userIds = (membershipRows || []).map((row: any) => row.user_id);
                let profileRows: any[] = [];
                let authUserRows: any[] = [];

                // Fetch Profiles (filtered by search term if provided)
                if (userIds.length > 0) {
                    let profilesQuery = supabase
                        .from('profiles')
                        .select('id, email, full_name, last_sign_in_at')
                        .in('id', userIds);

                    if (debouncedSearchTerm) {
                        profilesQuery = profilesQuery.or(`full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`);
                    }

                    const { data: profilesData, error: profilesError } = await profilesQuery;
                    if (profilesError) throw new Error(`Error loading user profiles: ${profilesError.message}`);
                    if (!isMounted) return;
                    profileRows = profilesData || [];

                    // Fetch invitation details scoped to this organization
                     const { data: authUsersData, error: authUsersError } = await supabase
                        .rpc('get_users_invitation_details', {
                            user_ids_to_check: userIds,
                            p_organization_id: organizationId,
                        });

                     if (authUsersError) {
                         // Non-critical error, log it but continue
                         console.warn("Error loading user invitation status:", authUsersError.message);
                         // toast({ variant: 'default', title: 'Warning', description: 'Could not load all invitation statuses.' });
                     }
                     if (!isMounted) return;
                     authUserRows = authUsersData || [];

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
                const { data: roleRows, error: roleError } = await supabase
                    .from('roles')
                    .select('id, name')
                    .neq('name', 'super-admin');

                if (roleError) throw new Error(`Error loading roles: ${roleError.message}`);
                if (isMounted) setRoles(roleRows || []);

            } catch (err: any) {
                console.error("Error fetching org members/roles:", err);
                if (isMounted) {
                    setError(err.message);
                    toast({ variant: 'destructive', title: 'Error Loading Data', description: err.message });
                    setMembers([]); // Clear data on error
                    setRoles([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchData();

        return () => { isMounted = false; };
    }, [organizationId, debouncedSearchTerm, supabase, toast]); // Include supabase and toast as dependencies

    return { members, roles, loading, error };
}

// Add type definition export to avoid duplication later
// We might need to move these types to a central location like `types/settings.ts` eventually
export type { OrgMember, RoleOption }; 