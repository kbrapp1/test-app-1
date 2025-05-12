// types/settings.ts

export interface OrgMember {
  id: string;
  email: string;
  name: string; // Typically full_name from profiles
  role_id: string;
  role_name: string;
  organization_id: string;
  last_sign_in_at?: string | null;
  invited_at?: string | null;
}

export interface RoleOption {
  id: string;
  name: string;
} 