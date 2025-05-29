/**
 * Domain Types: Super Admin
 * 
 * Single Responsibility: Defines super admin related domain types
 * Following DDD principles for type definitions
 */

import type { Tables } from '@/types/supabase';

// Core Profile Type with Super Admin
export interface Profile extends Tables<'profiles'> {
  readonly is_super_admin: boolean;
}

// Super Admin Audit Entry
export interface SuperAdminAuditEntry extends Tables<'super_admin_audit'> {
  readonly id: string;
  readonly target_user_id: string;
  readonly action: 'granted' | 'revoked';
  readonly performed_by_user_id: string | null;
  readonly performed_at: string;
  readonly notes: string | null;
}

// Permission Action Types
export type SuperAdminAction = 'granted' | 'revoked';

// Super Admin Context
export interface SuperAdminContext {
  readonly isSuperAdmin: boolean;
  readonly canAccessAllOrganizations: boolean;
}

// Enhanced Auth Context with Super Admin
export interface AuthContextType {
  readonly user: any;
  readonly profile: Profile | null;
  readonly activeOrgId: string | null;
  readonly isSuperAdmin: boolean;
  readonly loading: boolean;
} 