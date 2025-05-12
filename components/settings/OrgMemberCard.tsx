import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2Icon, LoaderIcon } from "lucide-react";

// Assuming OrgMember and RoleOption interfaces are defined similarly to OrgRoleManager
// If they are in a shared types file, import them. Otherwise, redefine:
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

interface OrgMemberCardProps {
  member: OrgMember;
  roles: RoleOption[];
  currentUserId: string | null;
  updating: string | null; // ID of user whose role is being updated or invite resent
  onRoleChange: (userId: string, newRoleId: string) => void;
  onBeginRemoveMember: (member: OrgMember) => void; // Function to set state in parent to show dialog
  onResendInvitation: (member: OrgMember) => void; // Added handler for resending invitation
}

export function OrgMemberCard({
  member,
  roles,
  currentUserId,
  updating,
  onRoleChange,
  onBeginRemoveMember,
  onResendInvitation,
}: OrgMemberCardProps) {
  const isSelf = member.id === currentUserId;
  const isUpdatingThisMember = updating === member.id;
  const canResend = member.invited_at && !member.last_sign_in_at;

  return (
    <Card className="mb-4 shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">{member.name || <span className="italic text-muted-foreground">(No name set)</span>}</CardTitle>
        <CardDescription className="text-sm">{member.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <label htmlFor={`role-select-${member.id}`} className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
          <div className="flex items-center space-x-2">
            <Select
              value={member.role_id}
              onValueChange={(val) => onRoleChange(member.id, val)}
              disabled={isSelf || isUpdatingThisMember}
              name={`role-select-${member.id}`}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdatingThisMember && <LoaderIcon className="animate-spin h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
        {member.last_sign_in_at && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Last Login</p>
            <p className="text-xs">
              {new Date(member.last_sign_in_at).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end items-center space-x-2 border-t pt-3">
        {canResend && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResendInvitation(member)}
            disabled={isUpdatingThisMember}
            aria-label="Resend invitation"
          >
            {isUpdatingThisMember && <LoaderIcon className="animate-spin h-4 w-4 mr-2" />} Resend Invite
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm" // Adjusted size for card context
          disabled={isSelf}
          onClick={() => !isSelf && onBeginRemoveMember(member)}
          aria-label="Remove member"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2Icon className="h-4 w-4 mr-2" />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
} 