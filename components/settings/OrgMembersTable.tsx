import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    RowSelectionState,
} from "@tanstack/react-table";
import { LoaderIcon, Trash2Icon, Send, Key } from 'lucide-react';
import { useIsMobile } from '@/components/ui/use-mobile';
import { OrgMemberCard } from './OrgMemberCard'; // Assuming OrgMemberCard exists and accepts these props
import type { OrgMember, RoleOption } from '@/types/settings';

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
    const columns = React.useMemo<ColumnDef<OrgMember>[]>(() => [
        // Select column (optional, keep if bulk actions needed)
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
                const { availableRoles, uid, currentlyUpdatingId, handleRoleChangeFn } = table.options.meta as {
                    availableRoles: RoleOption[];
                    uid: string | null;
                    currentlyUpdatingId: string | null;
                    handleRoleChangeFn: (userId: string, newRoleId: string) => void;
                };
                return (
                    <Select
                        value={member.role_id}
                        onValueChange={(val) => handleRoleChangeFn(member.id, val)}
                        disabled={member.id === uid || currentlyUpdatingId === member.id}
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
                const { currentlyUpdatingId } = table.options.meta as { currentlyUpdatingId: string | null };
                if (currentlyUpdatingId === member.id) {
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
                const { uid, currentlyUpdatingId, handleResetPasswordFn, handleResendInvitationFn, handleBeginRemoveMemberFn } = table.options.meta as {
                    uid: string | null;
                    currentlyUpdatingId: string | null;
                    handleResetPasswordFn: (member: OrgMember) => void;
                    handleResendInvitationFn: (member: OrgMember) => void;
                    handleBeginRemoveMemberFn: (member: OrgMember) => void;
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
                                            onClick={() => handleResetPasswordFn(member)}
                                            disabled={currentlyUpdatingId === member.id}
                                            aria-label="Reset Password"
                                        >
                                            <Key className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Reset Password</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {/* Resend Invitation */} 
                        {canResend && (
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleResendInvitationFn(member)}
                                            disabled={currentlyUpdatingId === member.id}
                                            aria-label="Resend invitation"
                                        >
                                            {currentlyUpdatingId === member.id ? (
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
                        {/* Remove Member */} 
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isSelf}
                                        onClick={() => {
                                            if (!isSelf) {
                                                handleBeginRemoveMemberFn(member);
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
    ], [onRoleChange, onBeginRemoveMember, onResendInvitation, onResetPassword]); // Include callbacks if they might change

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
            availableRoles: roles,
            uid: currentUserId,
            currentlyUpdatingId: updatingMemberId,
            handleRoleChangeFn: onRoleChange,
            handleResetPasswordFn: onResetPassword,
            handleResendInvitationFn: onResendInvitation,
            handleBeginRemoveMemberFn: onBeginRemoveMember,
        }
    });

    // Update meta when props change
    useEffect(() => {
        table.setOptions(prev => ({
          ...prev,
          meta: {
            ...(prev.meta || {}),
            availableRoles: roles,
            uid: currentUserId,
            currentlyUpdatingId: updatingMemberId,
            handleRoleChangeFn: onRoleChange,
            handleResetPasswordFn: onResetPassword,
            handleResendInvitationFn: onResendInvitation,
            handleBeginRemoveMemberFn: onBeginRemoveMember,
          }
        }))
      }, [roles, currentUserId, updatingMemberId, onRoleChange, onResetPassword, onResendInvitation, onBeginRemoveMember, table])


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
    return (
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
                                No members found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
} 