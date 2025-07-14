import React from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoaderIcon, Trash2Icon, Send, Key } from 'lucide-react';
import type { OrgMember, RoleOption } from '@/types/settings';

interface GetOrgMembersTableColumnsProps {
    roles: RoleOption[];
    currentUserId: string | null;
    updatingMemberId: string | null;
    onRoleChange: (userId: string, newRoleId: string) => void;
    onBeginRemoveMember: (member: OrgMember) => void;
    onResendInvitation: (member: OrgMember) => void;
    onResetPassword: (member: OrgMember) => void;
}

export function getOrgMembersTableColumns({
    roles: availableRoles,
    currentUserId: uid,
    updatingMemberId: currentlyUpdatingId,
    onRoleChange: handleRoleChangeFn,
    onBeginRemoveMember: handleBeginRemoveMemberFn,
    onResendInvitation: handleResendInvitationFn,
    onResetPassword: handleResetPasswordFn,
}: GetOrgMembersTableColumnsProps): ColumnDef<OrgMember>[] {
    return [
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
                } catch (_e) {
                    return <span className="text-xs text-destructive">Invalid Date</span>;
                }
            },
            size: 150,
        },
        {
            accessorKey: "role_id",
            header: "Role",
            cell: ({ row }) => {
                const member = row.original;
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
            cell: ({ row }) => {
                const member = row.original;
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
            cell: ({ row }) => {
                const member = row.original;
                const isSelf = member.id === uid;
                const canResend = member.invited_at && !member.last_sign_in_at;

                return (
                    <div className="text-right pr-2 flex items-center justify-end space-x-1">
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
    ];
} 