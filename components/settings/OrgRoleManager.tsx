import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { LoaderIcon, Trash2Icon, Send, Key } from 'lucide-react';
import { useIsMobile } from '@/components/ui/use-mobile';
import { OrgMemberCard } from './OrgMemberCard';
import { Input } from '@/components/ui/input';
import { AddMemberDialog } from './AddMemberDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OrgMember {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role_name: string;
  organization_id: string;
  last_sign_in_at?: string | null;
  invited_at?: string | null;
}

interface RoleOption {
  id: string;
  name: string;
}

export function OrgRoleManager() {
  const supabase = createClient();
  const { toast } = useToast();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [removingMember, setRemovingMember] = useState<OrgMember | null>(null);
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  // Determine current user's role in this organization
  const currentMembership = members.find(m => m.id === currentUserId);
  const currentUserRoleName = currentMembership?.role_name;

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData(currentSearchTerm: string) {
      if (!isMounted) return;
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { if (isMounted) setLoading(false); return; }
      const userId = userData.user.id;
      if (isMounted) setCurrentUserId(userId);
      const orgIdFromAuth = userData.user.app_metadata?.active_organization_id;
      if (isMounted) setActiveOrganizationId(orgIdFromAuth || null);
      
      if (!orgIdFromAuth) { if (isMounted) setLoading(false); return; }

      const { data: membershipRows, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('user_id, role_id, roles(name), organization_id')
        .eq('organization_id', orgIdFromAuth);

      if (membershipError) {
        if (isMounted) toast({ variant: 'destructive', title: 'Error loading members', description: membershipError.message });
        if (isMounted) setLoading(false);
        return;
      }

      const userIds = (membershipRows || []).map((row: any) => row.user_id);
      let profileRows: any[] = [];
      let authUserRows: any[] = [];

      if (userIds.length > 0) {
        let profilesQuery = supabase
          .from('profiles')
          .select('id, email, full_name, last_sign_in_at')
          .in('id', userIds);

        if (currentSearchTerm) {
          profilesQuery = profilesQuery.or(`full_name.ilike.%${currentSearchTerm}%,email.ilike.%${currentSearchTerm}%`);
        }

        const { data: profilesData, error: profilesError } = await profilesQuery;
        
        if (profilesError) {
          if (isMounted) toast({ variant: 'destructive', title: 'Error loading user profiles', description: profilesError.message });
          if (isMounted) setLoading(false);
          return;
        }
        profileRows = profilesData || [];

        // Fetch auth.users for invited_at using RPC
        if (userIds.length > 0) {
          const { data: authUsersData, error: authUsersError } = await supabase
            .rpc('get_users_invitation_details', { user_ids_to_check: userIds });

          if (authUsersError) {
            if (isMounted) toast({ variant: 'destructive', title: 'Error loading user invitation status', description: authUsersError.message });
            // Decide if this is a hard stop or if you can proceed without invited_at
          }
          authUserRows = authUsersData || [];
        } else {
          authUserRows = []; // Ensure authUserRows is an empty array if userIds is empty
        }
      }

      const finalMembershipRows = currentSearchTerm && profileRows.length > 0 
        ? (membershipRows || []).filter((memRow: any) => profileRows.some(p => p.id === memRow.user_id))
        : (currentSearchTerm && profileRows.length === 0)
          ? []
          : (membershipRows || []);

      const mappedMembers: OrgMember[] = finalMembershipRows.map((row: any) => {
        const profile = profileRows.find(p => p.id === row.user_id) || { email: '', full_name: '', last_sign_in_at: null };
        const authUser = authUserRows.find(au => au.id === row.user_id) || { invited_at: null };
        return {
          id: row.user_id,
          email: profile.email,
          name: profile.full_name,
          role_id: row.role_id,
          role_name: row.roles?.name || '',
          organization_id: row.organization_id,
          last_sign_in_at: profile.last_sign_in_at,
          invited_at: authUser.invited_at,
        };
      });
      if (isMounted) setMembers(mappedMembers);

      const { data: roleRows, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .neq('name', 'super-admin');
      if (roleError) {
        if (isMounted) toast({ variant: 'destructive', title: 'Error loading roles', description: roleError.message });
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setRoles(roleRows || []);
      if (isMounted) setLoading(false);
    }

    fetchData(debouncedSearchTerm);

    return () => { isMounted = false; };
  }, [supabase, toast, debouncedSearchTerm]);

  async function handleRoleChange(userId: string, newRoleId: string) {
    const prevMembers = [...members];
    setUpdating(userId);
    setMembers(currentMembers => currentMembers.map(m => m.id === userId ? { ...m, role_id: newRoleId, role_name: roles.find(r => r.id === newRoleId)?.name || m.role_name } : m));
    
    const { error } = await supabase
      .from('organization_memberships')
      .update({ role_id: newRoleId })
      .eq('user_id', userId)
      .eq('organization_id', members.find(m => m.id === userId)?.organization_id);

    if (error) {
      setMembers(prevMembers); 
      toast({ variant: 'destructive', title: 'Error updating role', description: error.message });
    } else {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', newRoleId).single();
      setMembers(currentMembers => currentMembers.map(m => m.id === userId ? { ...m, role_name: roleData?.name || '' } : m));
      toast({ title: 'Role updated', description: 'User role updated successfully.' });
    }
    setUpdating(null);
  }

  async function handleRemoveMember(memberToRemove: OrgMember | null) {
    if (!memberToRemove) return;

    const organizationId = members.find(m => m.id === memberToRemove.id)?.organization_id;
    if (!organizationId) {
      toast({ variant: "destructive", title: "Error", description: "Organization context is missing for this member." });
      setRemovingMember(null);
      return;
    }

    const { error } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('user_id', memberToRemove.id)
      .eq('organization_id', organizationId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error removing member",
        description: error.message,
      });
    } else {
      setMembers(currentMembers => currentMembers.filter(m => m.id !== memberToRemove.id));
      toast({
        title: "Member Removed",
        description: `${memberToRemove.name || memberToRemove.email} has been removed from the organization.`,
      });
    }
    setRemovingMember(null);
  }

  async function handleResendInvitation(memberToResend: OrgMember) {
    if (!activeOrganizationId) {
      toast({ variant: "destructive", title: "Error", description: "Active organization not found." });
      return;
    }
    if (!memberToResend.email || !memberToResend.role_id) {
      toast({ variant: "destructive", title: "Error", description: "Member email or role ID is missing. Cannot resend invitation." });
      return;
    }

    setUpdating(memberToResend.id); // Visually indicate loading for this member

    try {
      const { data, error } = await supabase.functions.invoke('admin-resend-invitation', {
        body: { 
          email: memberToResend.email,
          organizationId: activeOrganizationId, 
          roleId: memberToResend.role_id 
        }
      });

      if (error) { // For non-2xx status codes from the function
        console.error("Error resending invitation (non-2xx response):", error);
        toast({ 
          variant: "destructive", 
          title: "Error Resending Invitation", 
          description: error.message || "An unexpected error occurred."
        });
      } else if (data && data.code === "USER_ALREADY_CONFIRMED") {
        // Instead of manual guidance, automatically send a password reset link
        try {
          const redirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/login/reset/password#`
            : undefined;
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            memberToResend.email,
            redirectTo ? { redirectTo } : {}
          );
          if (resetError) {
            throw resetError;
          }
          toast({
            title: 'Password Reset Email Sent',
            description: `A password reset link has been sent to ${memberToResend.email}.`,
          });
        } catch (resetErr: any) {
          console.error('Error sending password reset email:', resetErr);
          toast({
            variant: 'destructive',
            title: 'Error Sending Password Reset',
            description: resetErr.message || 'Failed to send password reset link.',
          });
        }
      } else if (data && data.success === true) {
        // Handle successful re-invitation
        toast({ 
          title: "Invitation Resent", 
          description: data.message || `A new invitation has been sent to ${memberToResend.email}.` 
        });
        // Consider re-fetching member data or updating invited_at if your function provides it
      } else {
        // Catch-all for unexpected 2xx responses that aren't USER_ALREADY_CONFIRMED or clear success
        console.error("Unexpected response from admin-resend-invitation:", data);
        toast({
          variant: "destructive",
          title: "Unexpected Response",
          description: "Received an unexpected response from the server."
        });
      }
    } catch (e: any) { // For network errors or exceptions during the invoke call
      console.error("Exception when resending invitation:", e);
      toast({ 
        variant: "destructive", 
        title: "Error Resending Invitation", 
        description: e.message || "An unexpected error occurred during the function call."
      });
    }
    setUpdating(null);
  }

  // Admin-triggered password reset for a member
  async function handleResetPassword(memberToReset: OrgMember) {
    if (!memberToReset.role_id) return; // guard, though not strictly needed
    setUpdating(memberToReset.id);
    try {
      // Call the admin-reset-password Edge Function instead of direct client reset
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/login/reset/password`
        : undefined;
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { email: memberToReset.email, redirectTo }
      });
      console.log('admin-reset-password invoke response:', { data, error });

      // Explicitly check the data/error from the function response
      if (error) {
        console.log('handleResetPassword branch: invocation error');
        // This will catch network errors or if the function itself throws an unhandled exception
        // or returns a non-2xx status code that invoke() surfaces as an error.
        console.error('Error invoking admin-reset-password function:', error);
        sonnerToast.error('Function Error', { description: error.message });
      } else if (data && data.error) {
        console.log('handleResetPassword branch: data.error', data.error);
        // This catches errors returned in the JSON payload from a 2xx response
        console.error('Error from admin-reset-password function payload:', data.error);
        sonnerToast.error('Reset Error', { description: data.error });
      } else if (data && data.success) {
        console.log('handleResetPassword branch: success');
        sonnerToast.success('Password Reset Email Sent', { description: `Password reset link sent to ${memberToReset.email}.` });
      } else {
        console.log('handleResetPassword branch: fallback', data);
        // Fallback for unexpected successful responses without clear success/error fields
        console.warn('Unexpected response from admin-reset-password function:', data);
        sonnerToast('Password reset initiated, but response was unexpected.');
      }
    } catch (e: any) {
      // This catches errors from the try block itself (e.g., if `invoke` fails in a way not handled above)
      console.error('Error sending password reset email (client-side exception):', e);
      sonnerToast.error('Client Error', { description: e.message });
    } finally {
      setUpdating(null);
    }
  }

  const columns: ColumnDef<OrgMember>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-1">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-1">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.getValue("name") || <span className="text-muted-foreground text-sm">(No name set)</span>,
      size: 200,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-sm">{row.getValue("email")}</span>,
      size: 220,
    },
    {
      accessorKey: "last_sign_in_at",
      header: "Last Login",
      cell: ({ row }) => {
        const lastLogin = row.getValue("last_sign_in_at") as string | null;
        if (!lastLogin) return <span className="text-muted-foreground text-xs italic">Never</span>;
        try {
          const date = new Date(lastLogin);
          return <span className="text-xs">{date.toLocaleString()}</span>;
        } catch (e) {
          return <span className="text-xs text-destructive">Invalid Date</span>;
        }
      },
      size: 150,
    },
    {
      accessorKey: "role_id",
      header: "Role",
      cell: ({ row, table }) => {
        const member = row.original;
        const { roles: availableRoles, currentUserId: uid, updating: currentlyUpdatingFc, handleRoleChangeFn } = table.options.meta as {
          roles: RoleOption[];
          currentUserId: string | null;
          updating: string | null;
          handleRoleChangeFn: (userId: string, newRoleId: string) => void;
        };
        return (
          <Select
            value={member.role_id}
            onValueChange={(val) => handleRoleChangeFn(member.id, val)}
            disabled={member.id === uid || currentlyUpdatingFc === member.id}
          >
            <SelectTrigger className="w-40 text-sm">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role.id} value={role.id} className="text-sm">{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
      size: 180,
    },
    {
      id: "status",
      header: "",
      cell: ({ row, table }) => {
        const member = row.original;
        const { updating: currentlyUpdatingFc } = table.options.meta as { updating: string | null };
        if (currentlyUpdatingFc === member.id) {
          return <LoaderIcon className="animate-spin h-4 w-4 text-muted-foreground" />;
        }
        return null;
      },
      size: 30,
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-2">Actions</div>,
      cell: ({ row, table }) => {
        const member = row.original;
        const { currentUserId: uid, updating: currentlyUpdatingFc } = table.options.meta as { 
          currentUserId: string | null;
          updating: string | null;
         };
        const isSelf = member.id === uid;
        const canResend = member.invited_at && !member.last_sign_in_at;

        return (
          <div className="text-right pr-2 flex items-center justify-end space-x-1">
            {/* Password Reset Icon - Show for all users except self */}
            {!isSelf && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResetPassword(member)}
                      disabled={currentlyUpdatingFc === member.id}
                      aria-label="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Reset Password</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {canResend && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResendInvitation(member)}
                      disabled={currentlyUpdatingFc === member.id}
                      aria-label="Resend invitation"
                    >
                      {currentlyUpdatingFc === member.id ? (
                        <LoaderIcon className="animate-spin h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resend Invitation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isSelf}
                    onClick={() => {
                      if (!isSelf) {
                        setRemovingMember(member);
                      }
                    }}
                    aria-label="Remove member"
                  >
                    <Trash2Icon className={`h-4 w-4 ${isSelf ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-destructive hover:text-destructive/80'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove Member</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      size: 80,
    }
  ], [handleResendInvitation, handleResetPassword]);

  const table = useReactTable({
    data: members,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: {
      roles,
      currentUserId,
      updating,
      handleRoleChangeFn: handleRoleChange,
      handleResetPasswordFn: handleResetPassword,
    }
  });

  useEffect(() => {
    table.setOptions(prev => ({
      ...prev,
      meta: {
        ...(prev.meta || {}),
        roles,
        currentUserId,
        updating,
        handleRoleChangeFn: handleRoleChange,
        handleResetPasswordFn: handleResetPassword,
      }
    }))
  }, [roles, currentUserId, updating, handleRoleChange, handleResetPassword, table])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Organization Members</h2>
        {(currentUserRoleName === 'admin' || currentUserRoleName === 'super-admin') && (
          <Button onClick={() => setShowAddMemberDialog(true)}>Add Member</Button>
        )}
      </div>
      
      <Input 
        type="search"
        placeholder="Search members by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      {loading ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {debouncedSearchTerm ? 'Searching members...' : 'Loading organization members...'}
        </div>
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-4">
              {members.map(member => (
                <OrgMemberCard 
                  key={member.id}
                  member={member}
                  roles={roles}
                  currentUserId={currentUserId}
                  updating={updating}
                  onRoleChange={handleRoleChange}
                  onBeginRemoveMember={setRemovingMember}
                  onResendInvitation={handleResendInvitation}
                />
              ))}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members found in this organization.
                  {debouncedSearchTerm && ' matching your search.'}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow 
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                        No members found in this organization.
                        {debouncedSearchTerm && members.length === 0 && ' matching your search.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {removingMember && (
        <AlertDialog open={!!removingMember} onOpenChange={(isOpen) => !isOpen && setRemovingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove{" "}
                <strong>{removingMember.name || removingMember.email}</strong>{" "}
                from the organization. They will lose access to this organization's resources.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRemovingMember(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRemoveMember(removingMember)}
                className={buttonVariants({ variant: "destructive" })}
              >
                Yes, Remove Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AddMemberDialog
        isOpen={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        roles={roles}
        organizationId={activeOrganizationId}
        onMemberInvited={(email: string, name?: string) => {
          setShowAddMemberDialog(false);
          toast({ title: "Invitation Sent", description: `Invitation has been sent to ${email}${name ? ' (' + name + ')' : ''}.` });
        }}
      />
    </div>
  );
} 