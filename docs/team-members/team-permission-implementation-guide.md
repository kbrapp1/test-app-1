# Team Management Permission Implementation Guide

**AI INSTRUCTIONS:**
- Follow @golden-rule DDD architecture patterns exactly
- Implement fail-secure permission checking at all layers
- Use single responsibility principle with components under 250 lines
- Maintain pattern consistency with notes implementation
- Include explicit AI guidance comments in all examples

This guide provides step-by-step instructions for implementing role-based permissions for the team management feature using the shared security system.

---

## Current Team System Analysis

### ✅ Database Layer (Already Complete)
**Tables:**
- `teams` - Functional teams within organizations
- `team_members` - Display team members (marketing/public-facing)  
- `team_user_memberships` - User assignments to functional teams
- `organization_memberships` - User roles within organizations

**RLS Policies:** ✅ Already implemented
- Organization-scoped access for all team tables
- Admin-only creation/modification for teams and team_members
- Super admin override policies in place

### ✅ Domain Layer (Partially Complete)
**Existing Permissions:**
- `MANAGE_TEAMS` - Create/edit/delete teams and team members
- `JOIN_TEAM` - Join functional teams  
- `VIEW_TEAM` - View team information

**Missing Granular Permissions:**
- Need more specific permissions for different team operations

### 🔧 Implementation Needed
**Server Layer:** Page protection and server actions need permission checks
**Client Layer:** UI conditional rendering based on permissions

---

## Step 1: Update Domain Layer Permissions

### 1.1 Add Granular Team Permissions

**File:** `lib/auth/roles.ts`

```typescript
/**
 * Team Management Permissions
 * 
 * AI INSTRUCTIONS:
 * - Use granular permissions for specific team operations
 * - Separate display team members from functional team management
 * - Follow namespace:action pattern consistently
 */
export enum Permission {
  // ... existing permissions ...
  
  // Team member management (display/marketing team)
  CREATE_TEAM_MEMBER = 'create:team_member',
  UPDATE_TEAM_MEMBER = 'update:team_member', 
  DELETE_TEAM_MEMBER = 'delete:team_member',
  VIEW_TEAM_MEMBER = 'view:team_member',
  
  // Functional team management
  CREATE_TEAM = 'create:team',
  UPDATE_TEAM = 'update:team',
  DELETE_TEAM = 'delete:team',
  VIEW_TEAM = 'view:team',
  
  // Team membership management
  MANAGE_TEAM_MEMBERSHIPS = 'manage:team_memberships',
  VIEW_TEAM_MEMBERSHIPS = 'view:team_memberships',
}

/**
 * Updated Role-Permission Mapping
 * 
 * AI INSTRUCTIONS:
 * - Admin/Editor: Full team management capabilities
 * - Member: Can view teams, join teams, basic team member viewing
 * - Viewer: Read-only access to team information
 * - Visitor: No team access
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // ... all existing permissions ...
    Permission.CREATE_TEAM_MEMBER,
    Permission.UPDATE_TEAM_MEMBER,
    Permission.DELETE_TEAM_MEMBER,
    Permission.VIEW_TEAM_MEMBER,
    Permission.CREATE_TEAM,
    Permission.UPDATE_TEAM,
    Permission.DELETE_TEAM,
    Permission.VIEW_TEAM,
    Permission.MANAGE_TEAM_MEMBERSHIPS,
    Permission.VIEW_TEAM_MEMBERSHIPS,
  ],
  [UserRole.EDITOR]: [
    // ... existing editor permissions ...
    Permission.CREATE_TEAM_MEMBER,
    Permission.UPDATE_TEAM_MEMBER,
    Permission.DELETE_TEAM_MEMBER,
    Permission.VIEW_TEAM_MEMBER,
    Permission.CREATE_TEAM,
    Permission.UPDATE_TEAM,
    Permission.DELETE_TEAM,
    Permission.VIEW_TEAM,
    Permission.MANAGE_TEAM_MEMBERSHIPS,
    Permission.VIEW_TEAM_MEMBERSHIPS,
  ],
  [UserRole.MEMBER]: [
    // ... existing member permissions ...
    Permission.VIEW_TEAM_MEMBER,
    Permission.VIEW_TEAM,
    Permission.VIEW_TEAM_MEMBERSHIPS,
    // AI: Members can join teams but not manage them
  ],
  [UserRole.VIEWER]: [
    // ... existing viewer permissions ...
    Permission.VIEW_TEAM_MEMBER,
    Permission.VIEW_TEAM,
    Permission.VIEW_TEAM_MEMBERSHIPS,
  ],
  [UserRole.VISITOR]: [
    // ... existing minimal permissions ...
    // AI: No team access for visitors
  ]
};
```

### 1.2 Create Team-Specific Permission Helper

**File:** `lib/shared/access-control/helpers/teamPermissions.ts`

```typescript
/**
 * Team-specific permission checking utilities
 * 
 * AI INSTRUCTIONS:
 * - Provide convenient helpers for team permission checks
 * - Follow single responsibility principle
 * - Include both individual and bulk permission checks
 * - Maintain fail-secure defaults
 */

import { Permission, hasPermission } from '@/lib/auth/authorization';
import { User } from '@supabase/supabase-js';

/**
 * Check team access permissions for a user
 * 
 * AI INSTRUCTIONS:
 * - Use for server-side permission validation
 * - Return false by default (fail-secure)
 * - Include organization context validation
 */
export async function checkTeamAccess(
  requiredPermissions: Permission[] = [],
  requiredRoles: UserRole[] = []
): Promise<{
  organizationId: string;
  userId: string;
  userRole: UserRole;
}> {
  return checkFeatureAccess({
    featureName: 'teams',
    requiredPermissions,
    requiredRoles
  });
}

/**
 * Convenience function for common team permission checks
 * 
 * AI INSTRUCTIONS:
 * - Simplify common permission patterns
 * - Use descriptive function names
 * - Handle edge cases gracefully
 */
export const checkTeamPermissions = {
  canViewTeams: () => checkTeamAccess([Permission.VIEW_TEAM]),
  canManageTeamMembers: () => checkTeamAccess([Permission.CREATE_TEAM_MEMBER, Permission.UPDATE_TEAM_MEMBER, Permission.DELETE_TEAM_MEMBER]),
  canCreateTeams: () => checkTeamAccess([Permission.CREATE_TEAM]),
  canManageTeamMemberships: () => checkTeamAccess([Permission.MANAGE_TEAM_MEMBERSHIPS]),
};
```

---

## Step 2: Server Layer Protection

### 2.1 Protect Team Page

**File:** `app/(protected)/team/page.tsx`

```typescript
/**
 * Team Management Page with Permission Protection
 * 
 * AI INSTRUCTIONS:
 * - Check VIEW_TEAM permission before rendering
 * - Use checkFeatureAccess for consistent permission validation
 * - Handle permission failures gracefully
 * - Follow @golden-rule single responsibility pattern
 */

import { checkFeatureAccess } from '@/lib/shared/access-control/server/checkFeatureAccess';
import { Permission } from '@/lib/auth/roles';
import { getTeamMembers } from '@/lib/auth';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { AddTeamMemberDialog } from '@/components/team/AddTeamMemberDialog';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  // AI: Check permission before loading any data
  await checkFeatureAccess({
    featureName: 'teams',
    requiredPermissions: [Permission.VIEW_TEAM],
    requiredRoles: []
  });

  // AI: Only fetch data after permission validation
  const members = await getTeamMembers();

  return (
    <div className="space-y-6 min-h-[50vh]">
      <div className="flex justify-between items-center min-h-[60px]">
        <h1 className="text-3xl font-bold">Our Team</h1>
        {/* AI: AddTeamMemberDialog has its own permission checking */}
        <AddTeamMemberDialog />
      </div>
      
      <TeamMemberList members={members} />
    </div>
  );
}
```

### 2.2 Create Team Server Actions with Permissions

**File:** `app/(protected)/team/actions.ts`

```typescript
/**
 * Team Management Server Actions with Permission Protection
 * 
 * AI INSTRUCTIONS:
 * - Validate permissions before any database operations
 * - Use specific permissions for each action type
 * - Include organization context in all operations
 * - Handle errors with appropriate error types
 * - Follow @golden-rule error handling patterns
 */

'use server';

import { revalidatePath } from 'next/cache';
import { checkFeatureAccess } from '@/lib/shared/access-control/server/checkFeatureAccess';
import { Permission } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';

/**
 * Create a new team member (display/marketing team)
 * 
 * AI INSTRUCTIONS:
 * - Check CREATE_TEAM_MEMBER permission
 * - Validate organization context
 * - Handle file uploads securely
 * - Return structured success/error response
 */
export async function createTeamMember(formData: FormData) {
  try {
    // AI: Permission check first, always
    const { organizationId } = await checkFeatureAccess({
      featureName: 'teams',
      requiredPermissions: [Permission.CREATE_TEAM_MEMBER],
      requiredRoles: []
    });

    const supabase = createClient();
    
    // AI: Extract and validate form data
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const primaryImage = formData.get('primary_image') as File;
    const secondaryImage = formData.get('secondary_image') as File;

    if (!name || !title || !primaryImage || !secondaryImage) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
          severity: 'medium' as const
        }
      };
    }

    // AI: Upload images to storage (organization-scoped paths)
    const primaryImagePath = `team/${organizationId}/${Date.now()}-primary-${primaryImage.name}`;
    const secondaryImagePath = `team/${organizationId}/${Date.now()}-secondary-${secondaryImage.name}`;

    const [primaryUpload, secondaryUpload] = await Promise.all([
      supabase.storage.from('assets').upload(primaryImagePath, primaryImage),
      supabase.storage.from('assets').upload(secondaryImagePath, secondaryImage)
    ]);

    if (primaryUpload.error || secondaryUpload.error) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload images',
          severity: 'high' as const
        }
      };
    }

    // AI: Create team member record with organization context
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({
        name,
        title,
        primary_image_path: primaryImagePath,
        secondary_image_path: secondaryImagePath,
        organization_id: organizationId
      });

    if (insertError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create team member',
          severity: 'high' as const
        }
      };
    }

    // AI: Revalidate team page
    revalidatePath('/team');
    
    return { success: true };

  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Insufficient permissions to create team members',
          severity: 'high' as const
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        severity: 'critical' as const
      }
    };
  }
}

/**
 * Update an existing team member
 * 
 * AI INSTRUCTIONS:
 * - Check UPDATE_TEAM_MEMBER permission
 * - Validate team member belongs to user's organization
 * - Handle partial updates gracefully
 */
export async function updateTeamMember(id: string, formData: FormData) {
  try {
    const { organizationId } = await checkFeatureAccess({
      featureName: 'teams',
      requiredPermissions: [Permission.UPDATE_TEAM_MEMBER],
      requiredRoles: []
    });

    const supabase = createClient();
    
    // AI: Verify team member belongs to organization
    const { data: existingMember, error: fetchError } = await supabase
      .from('team_members')
      .select('id, organization_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingMember) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Team member not found',
          severity: 'medium' as const
        }
      };
    }

    // AI: Build update object from form data
    const updateData: any = {};
    
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    
    if (name) updateData.name = name;
    if (title) updateData.title = title;

    // AI: Handle image updates if provided
    const primaryImage = formData.get('primary_image') as File;
    const secondaryImage = formData.get('secondary_image') as File;

    if (primaryImage && primaryImage.size > 0) {
      const primaryImagePath = `team/${organizationId}/${Date.now()}-primary-${primaryImage.name}`;
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(primaryImagePath, primaryImage);
      
      if (!uploadError) {
        updateData.primary_image_path = primaryImagePath;
      }
    }

    if (secondaryImage && secondaryImage.size > 0) {
      const secondaryImagePath = `team/${organizationId}/${Date.now()}-secondary-${secondaryImage.name}`;
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(secondaryImagePath, secondaryImage);
      
      if (!uploadError) {
        updateData.secondary_image_path = secondaryImagePath;
      }
    }

    // AI: Update team member
    const { error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (updateError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update team member',
          severity: 'high' as const
        }
      };
    }

    revalidatePath('/team');
    return { success: true };

  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Insufficient permissions to update team members',
          severity: 'high' as const
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        severity: 'critical' as const
      }
    };
  }
}

/**
 * Delete a team member
 * 
 * AI INSTRUCTIONS:
 * - Check DELETE_TEAM_MEMBER permission
 * - Verify organization ownership
 * - Clean up associated storage files
 */
export async function deleteTeamMember(id: string) {
  try {
    const { organizationId } = await checkFeatureAccess({
      featureName: 'teams',
      requiredPermissions: [Permission.DELETE_TEAM_MEMBER],
      requiredRoles: []
    });

    const supabase = createClient();
    
    // AI: Get team member data before deletion for cleanup
    const { data: member, error: fetchError } = await supabase
      .from('team_members')
      .select('id, primary_image_path, secondary_image_path, organization_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !member) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Team member not found',
          severity: 'medium' as const
        }
      };
    }

    // AI: Delete team member record
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (deleteError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete team member',
          severity: 'high' as const
        }
      };
    }

    // AI: Clean up storage files (best effort, don't fail if cleanup fails)
    try {
      await Promise.all([
        supabase.storage.from('assets').remove([member.primary_image_path]),
        supabase.storage.from('assets').remove([member.secondary_image_path])
      ]);
    } catch (cleanupError) {
      // AI: Log but don't fail the operation
      console.warn('Failed to cleanup team member images:', cleanupError);
    }

    revalidatePath('/team');
    return { success: true };

  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Insufficient permissions to delete team members',
          severity: 'high' as const
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        severity: 'critical' as const
      }
    };
  }
}
```

---

## Step 3: Client Layer Permission Integration

### 3.1 Create Team Permission Hooks

**File:** `lib/shared/access-control/hooks/useTeamPermissions.ts`

```typescript
/**
 * Team-specific permission hooks for client components
 * 
 * AI INSTRUCTIONS:
 * - Provide convenient permission checking for team components
 * - Include loading states for proper UI handling
 * - Follow fail-secure principles (hide during loading)
 * - Use consistent naming patterns with other permission hooks
 */

'use client';

import { usePermissions } from './usePermissions';
import { Permission } from '@/lib/auth/roles';

/**
 * Hook for team member management permissions
 * 
 * AI INSTRUCTIONS:
 * - Return boolean flags for common team operations
 * - Include loading state for proper UI handling
 * - Use descriptive property names
 */
export function useTeamMemberPermissions() {
  const { hasPermission, isLoading } = usePermissions();

  return {
    canView: hasPermission(Permission.VIEW_TEAM_MEMBER),
    canCreate: hasPermission(Permission.CREATE_TEAM_MEMBER),
    canUpdate: hasPermission(Permission.UPDATE_TEAM_MEMBER),
    canDelete: hasPermission(Permission.DELETE_TEAM_MEMBER),
    isLoading
  };
}

/**
 * Hook for functional team management permissions
 * 
 * AI INSTRUCTIONS:
 * - Separate functional teams from display team members
 * - Include membership management capabilities
 * - Provide granular permission checking
 */
export function useTeamPermissions() {
  const { hasPermission, isLoading } = usePermissions();

  return {
    canView: hasPermission(Permission.VIEW_TEAM),
    canCreate: hasPermission(Permission.CREATE_TEAM),
    canUpdate: hasPermission(Permission.UPDATE_TEAM),
    canDelete: hasPermission(Permission.DELETE_TEAM),
    canManageMemberships: hasPermission(Permission.MANAGE_TEAM_MEMBERSHIPS),
    canViewMemberships: hasPermission(Permission.VIEW_TEAM_MEMBERSHIPS),
    isLoading
  };
}

/**
 * Combined hook for all team-related permissions
 * 
 * AI INSTRUCTIONS:
 * - Provide comprehensive team permission checking
 * - Useful for complex components needing multiple permission types
 * - Maintain consistent loading state across all checks
 */
export function useAllTeamPermissions() {
  const teamMemberPermissions = useTeamMemberPermissions();
  const teamPermissions = useTeamPermissions();

  return {
    teamMembers: teamMemberPermissions,
    teams: teamPermissions,
    isLoading: teamMemberPermissions.isLoading || teamPermissions.isLoading
  };
}
```

### 3.2 Update AddTeamMemberDialog with Permissions

**File:** `components/team/AddTeamMemberDialog.tsx`

```typescript
/**
 * Add Team Member Dialog with Permission-Based Rendering
 * 
 * AI INSTRUCTIONS:
 * - Check CREATE_TEAM_MEMBER permission before rendering
 * - Return null if no permission (fail-secure)
 * - Handle loading states gracefully
 * - Follow @golden-rule single responsibility pattern
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import { useTeamMemberPermissions } from '@/lib/shared/access-control/hooks/useTeamPermissions';

/**
 * Team Member Creation Dialog with Permission Protection
 * 
 * AI INSTRUCTIONS:
 * - Only render if user has CREATE_TEAM_MEMBER permission
 * - Show loading state while permissions are being checked
 * - Use consistent styling with other dialogs
 */
export function AddTeamMemberDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { canCreate, isLoading } = useTeamMemberPermissions();

  // AI: Fail-secure - don't render during loading or without permission
  if (isLoading || !canCreate) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <AddTeamMemberForm onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
```

### 3.3 Update TeamMemberCard with Permission-Based Actions

**File:** `components/team/TeamMemberCard.tsx`

```typescript
/**
 * Team Member Card with Permission-Based Action Buttons
 * 
 * AI INSTRUCTIONS:
 * - Show edit/delete buttons only with appropriate permissions
 * - Use fail-secure rendering (hide during loading)
 * - Maintain consistent styling and interaction patterns
 * - Follow @golden-rule component size limits
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { TeamMember } from '@/types/team';
import { useTeamMemberPermissions } from '@/lib/shared/access-control/hooks/useTeamPermissions';
import { deleteTeamMember } from '@/app/(protected)/team/actions';
import { useToast } from '@/components/ui/use-toast';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
}

/**
 * Team Member Display Card with Permission-Based Actions
 * 
 * AI INSTRUCTIONS:
 * - Always show member information (public data)
 * - Show edit/delete actions only with permissions
 * - Handle action states and error feedback
 * - Use hover effects for better UX
 */
export function TeamMemberCard({ member, onEdit }: TeamMemberCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { canUpdate, canDelete, isLoading } = useTeamMemberPermissions();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const result = await deleteTeamMember(member.id);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Team member deleted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to delete team member',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (canUpdate && onEdit) {
      onEdit(member);
    }
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 relative">
        {/* AI: Member image with hover effect */}
        <div className="aspect-square relative overflow-hidden">
          <img
            src={isHovered ? member.secondary_image_url : member.primary_image_url}
            alt={member.name}
            className="w-full h-full object-cover transition-all duration-300"
          />
          
          {/* AI: Action buttons overlay - only show with permissions */}
          {!isLoading && (canUpdate || canDelete) && (
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
              {canUpdate && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* AI: Member information - always visible */}
        <div className="p-4">
          <h3 className="font-semibold text-lg">{member.name}</h3>
          <p className="text-muted-foreground">{member.title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Step 4: Testing & Validation

### 4.1 Permission Matrix Testing

**Test Scenarios:**

| Role | View Team Page | View Team Members | Add Team Member | Edit Team Member | Delete Team Member |
|------|----------------|-------------------|-----------------|------------------|-------------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ❌ | ❌ | ❌ |
| Viewer | ✅ | ✅ | ❌ | ❌ | ❌ |
| Visitor | ❌ | ❌ | ❌ | ❌ | ❌ |

### 4.2 Security Validation Checklist

- [ ] **Page Access Control**
  - [ ] Visitor role gets "insufficient permissions" on `/team`
  - [ ] Viewer role can access `/team` but sees read-only view
  - [ ] Member role can view but not modify team members
  - [ ] Editor/Admin roles have full access

- [ ] **Component Rendering**
  - [ ] Add Team Member button hidden for Member/Viewer/Visitor roles
  - [ ] Edit/Delete buttons hidden for Member/Viewer/Visitor roles
  - [ ] Loading states show no actions until permissions resolved

- [ ] **Server Action Protection**
  - [ ] All team actions reject requests without proper permissions
  - [ ] Organization context validated for all operations
  - [ ] Proper error messages returned for permission failures

- [ ] **Database Security**
  - [ ] RLS policies prevent cross-organization access
  - [ ] Super admin can access all team data
  - [ ] Regular users limited to their organization's teams

---

## Step 5: Deployment Checklist

### 5.1 Code Updates Required

- [ ] **Update `lib/auth/roles.ts`** - Add granular team permissions
- [ ] **Create `lib/shared/access-control/helpers/teamPermissions.ts`** - Team permission helpers
- [ ] **Update `app/(protected)/team/page.tsx`** - Add permission checking
- [ ] **Create `app/(protected)/team/actions.ts`** - Protected server actions
- [ ] **Create `lib/shared/access-control/hooks/useTeamPermissions.ts`** - Client permission hooks
- [ ] **Update `components/team/AddTeamMemberDialog.tsx`** - Permission-based rendering
- [ ] **Update `components/team/TeamMemberCard.tsx`** - Permission-based actions

### 5.2 Database Validation

- [ ] **Verify team feature flag** exists in organizations table
- [ ] **Test RLS policies** with different user roles
- [ ] **Validate organization scoping** for all team tables

### 5.3 Integration Testing

- [ ] **Test with existing test users** (visitor, viewer, editor roles)
- [ ] **Verify cross-organization isolation** 
- [ ] **Test permission changes** without re-authentication
- [ ] **Validate error handling** for edge cases

---

## Implementation Notes

### Architecture Compliance

**✅ @Golden-Rule Compliance:**
- **AI-First Architecture** - Explicit AI instruction comments throughout
- **DDD Layer Architecture** - Clear separation of concerns across layers
- **Single Responsibility** - Each component under 250 lines with focused purpose
- **Pattern Consistency** - Follows established notes implementation patterns
- **Fail-Secure Design** - Permissions checked at every layer, default deny

### Security Considerations

**Defense in Depth:**
1. **Database Layer** - RLS policies prevent unauthorized data access
2. **Server Layer** - Permission checks in server actions and pages
3. **Client Layer** - UI elements conditionally rendered based on permissions
4. **Network Layer** - API endpoints protected with authentication

**Organization Isolation:**
- All team operations scoped to user's active organization
- Cross-organization access prevented at database level
- Super admin override available for system administration

### Performance Considerations

**Client-Side Caching:**
- Permission checks cached in React hooks
- Minimal re-renders through proper state management
- Loading states prevent UI flicker during permission resolution

**Server-Side Efficiency:**
- Database role fetching optimized with proper indexing
- Permission mapping loaded once per request
- Organization context resolved efficiently through JWT claims

This implementation provides enterprise-grade security for team management while maintaining excellent user experience and developer productivity. 