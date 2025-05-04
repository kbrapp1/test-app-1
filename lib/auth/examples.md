# Auth System Usage Examples

This document provides examples of how to use the new authentication and authorization system in different contexts.

## API Route Example

```typescript
// app/api/assets/route.ts
import { withAuth } from '@/lib/auth';
import { Permission } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';

// Handler with permission-based check
export const GET = withAuth(
  async (req, user, supabase) => {
    // Your implementation here
    return NextResponse.json({ assets: [] });
  },
  { 
    requiredPermission: Permission.VIEW_ASSET
  }
);

// Handler with role-based check
export const POST = withAuth(
  async (req, user, supabase) => {
    // Your implementation here
    return NextResponse.json({ success: true });
  },
  { 
    requiredRole: UserRole.EDITOR 
  }
);

// Handler with multiple permissions (any of)
export const DELETE = withAuth(
  async (req, user, supabase) => {
    // Your implementation here
    return NextResponse.json({ success: true });
  },
  { 
    requiredPermissions: [Permission.DELETE_ASSET, Permission.MANAGE_SETTINGS],
    anyPermission: true
  }
);
```

## Server Action Example

```typescript
// app/actions/team.ts
import { withAuthAction, withServerActionErrorHandling, Permission } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Combined with error handling middleware
export const createTeam = withServerActionErrorHandling(
  withAuthAction(
    async (formData: FormData) => {
      const name = formData.get('name') as string;
      // Your implementation here
      return { success: true };
    },
    { requiredPermission: Permission.MANAGE_TEAMS }
  )
);

// Using manual permission check
import { getSessionUser, assertPermission } from '@/lib/auth';

export async function updateTeam(formData: FormData) {
  // Get the current user
  const { user, error } = await getSessionUser();
  
  if (error || !user) {
    throw new AuthorizationError('Authentication required');
  }
  
  // Will throw AuthorizationError if the user doesn't have the permission
  assertPermission(user, Permission.MANAGE_TEAMS);
  
  // If we get here, the user is authorized
  // Your implementation here
  return { success: true };
}
```

## React Component Example

```tsx
// components/assets/AssetActions.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/useUser';
import { Permission } from '@/lib/auth/roles';
import { useState } from 'react';

export function AssetActions({ assetId }: { assetId: string }) {
  const { auth } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the auth helpers for permission checks
  return (
    <div className="flex gap-2">
      {/* Only show if user has VIEW_ASSET permission */}
      {auth.hasPermission(Permission.VIEW_ASSET) && (
        <Button onClick={() => window.open(`/assets/${assetId}`)}>
          View
        </Button>
      )}
      
      {/* Only show if user has UPDATE_ASSET permission */}
      {auth.hasPermission(Permission.UPDATE_ASSET) && (
        <Button onClick={() => window.location.href = `/assets/${assetId}/edit`}>
          Edit
        </Button>
      )}
      
      {/* Only show if user has DELETE_ASSET permission */}
      {auth.hasPermission(Permission.DELETE_ASSET) && (
        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
          Delete
        </Button>
      )}
      
      {/* Example using role checks */}
      {auth.isAdmin && (
        <Button variant="outline">Admin Action</Button>
      )}
    </div>
  );
}
```

## Layout-Level Protection Example

```tsx
// app/(protected)/admin/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/lib/auth/roles';
import { getUserRole } from '@/lib/auth/roles';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if the user is authenticated and is an admin
  if (!user || getUserRole(user.app_metadata?.role) !== UserRole.ADMIN) {
    // Not authenticated or not an admin, redirect to sign-in
    redirect('/auth/signin?next=/admin');
  }
  
  // User is authenticated and is an admin
  return (
    <div className="admin-layout">
      {/* Admin sidebar or navigation */}
      <nav>Admin Navigation</nav>
      
      {/* Admin content */}
      <main>{children}</main>
    </div>
  );
} 