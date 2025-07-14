import React, { useState } from 'react';
import {
    getCoreRowModel,
    useReactTable,
    RowSelectionState,
} from "@tanstack/react-table";
import { useIsMobile } from '@/components/ui/use-mobile';
import { OrgMemberCard } from './OrgMemberCard'; // Assuming OrgMemberCard exists and accepts these props
import type { OrgMember, RoleOption } from '@/types/settings';
import { getOrgMembersTableColumns } from './OrgMembersTable.columns';
import { OrgMembersDesktopTable } from './OrgMembersDesktopTable';

interface OrgMembersTableProps {
    members: OrgMember[];
    roles: RoleOption[];
    currentUserId: string | null;
    updatingMemberId: string | null; // ID of member whose role is being updated
    onRoleChange: (userId: string, newRoleId: string) => void;
    onBeginRemoveMember: (member: OrgMember) => void; // Function to trigger the removal dialog
    onResendInvitation: (member: OrgMember) => void;
    onResetPassword: (member: OrgMember) => void;
}

export function OrgMembersTable({
    members,
    roles,
    currentUserId,
    updatingMemberId,
    onRoleChange,
    onBeginRemoveMember,
    onResendInvitation,
    onResetPassword,
}: OrgMembersTableProps) {
    const isMobile = useIsMobile();
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Define columns within the component or memoize them
    const columns = React.useMemo(() => getOrgMembersTableColumns({
        roles,
        currentUserId,
        updatingMemberId,
        onRoleChange,
        onBeginRemoveMember,
        onResendInvitation,
        onResetPassword,
    }), [roles, currentUserId, updatingMemberId, onRoleChange, onBeginRemoveMember, onResendInvitation, onResetPassword]);

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
        // Pass necessary props and callbacks down through meta
        meta: {
            // Example: if some other part of the table (not columns) needs `currentUserId`
            // uid: currentUserId, 
            // availableRoles: roles, // No longer needed here if columns handle it
            // currentlyUpdatingId: updatingMemberId, // No longer needed here
            // handleRoleChangeFn: onRoleChange, // No longer needed here
            // handleResetPasswordFn: onResetPassword, // No longer needed here
            // handleResendInvitationFn: onResendInvitation, // No longer needed here
            // handleBeginRemoveMemberFn: onBeginRemoveMember, // No longer needed here
        }
    });

    // Update meta when props change - This useEffect can likely be removed
    // useEffect(() => {
    //     table.setOptions(prev => ({
    //       ...prev,
    //       meta: {
    //         ...(prev.meta || {}),
    //         availableRoles: roles,
    //         uid: currentUserId,
    //         currentlyUpdatingId: updatingMemberId,
    //         handleRoleChangeFn: onRoleChange,
    //         handleResetPasswordFn: onResetPassword,
    //         handleResendInvitationFn: onResendInvitation,
    //         handleBeginRemoveMemberFn: onBeginRemoveMember,
    //       }
    //     }))
    //   }, [roles, currentUserId, updatingMemberId, onRoleChange, onResetPassword, onResendInvitation, onBeginRemoveMember, table])


    if (isMobile) {
        return (
            <div className="space-y-4">
                {members.length > 0 ? members.map(member => (
                    <OrgMemberCard
                        key={member.id}
                        member={member}
                        roles={roles} // Pass roles for dropdown
                        currentUserId={currentUserId}
                        updating={updatingMemberId}
                        onRoleChange={onRoleChange}
                        onBeginRemoveMember={onBeginRemoveMember}
                        onResendInvitation={onResendInvitation}
                        onResetPassword={onResetPassword}
                    />
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No members found.
                    </p>
                )}
            </div>
        );
    }

    // Desktop Table View
    return <OrgMembersDesktopTable table={table} columns={columns} />;
} 