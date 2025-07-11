/**
 * Notes Permission Wrapper Component
 * 
 * AI INSTRUCTIONS:
 * - Client component for permission-based conditional rendering
 * - Wraps permission-sensitive UI elements
 * - Uses useNotesPermissions hook for role-based access control
 * - Follows fail-secure principles (hide if no permission)
 */

'use client';

import { useNotesPermissions } from '@/lib/shared/access-control/hooks/usePermissions';

interface NotesPermissionWrapperProps {
  children: React.ReactNode;
  permission: 'create' | 'update' | 'delete' | 'view';
  fallback?: React.ReactNode;
}

export function NotesPermissionWrapper({ 
  children, 
  permission, 
  fallback = null 
}: NotesPermissionWrapperProps) {
  const { canView, canCreate, canUpdate, canDelete, isLoading } = useNotesPermissions();
  
  // AI: Show nothing while loading (fail-secure)
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  // AI: Check specific permission
  const hasPermission = (() => {
    switch (permission) {
      case 'view': return canView;
      case 'create': return canCreate;
      case 'update': return canUpdate;
      case 'delete': return canDelete;
      default: return false;
    }
  })();
  
  // AI: Render children only if permission granted
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// AI: Convenience components for common permission checks
export function CreateNoteWrapper({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <NotesPermissionWrapper permission="create" fallback={fallback}>
      {children}
    </NotesPermissionWrapper>
  );
}

export function UpdateNoteWrapper({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <NotesPermissionWrapper permission="update" fallback={fallback}>
      {children}
    </NotesPermissionWrapper>
  );
}

export function DeleteNoteWrapper({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <NotesPermissionWrapper permission="delete" fallback={fallback}>
      {children}
    </NotesPermissionWrapper>
  );
} 