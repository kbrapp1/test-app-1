/**
 * Auth Presentation Types - UI-Specific Data Contracts
 * 
 * AI INSTRUCTIONS:
 * - UI-specific data contracts for auth presentation layer
 * - Never expose domain entities directly to UI
 * - Keep types focused on presentation concerns
 * - Use DTOs for data transfer between layers
 */

// UI-specific auth state types
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserViewModel | null;
  error: string | null;
}

// UI-specific user view model
export interface UserViewModel {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  lastLoginAt?: Date;
  isActive: boolean;
}

// UI-specific profile view model
export interface ProfileViewModel {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatar?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  updatedAt: Date;
}

// UI-specific organization membership view model
export interface MembershipViewModel {
  id: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  role: RoleViewModel;
  status: 'active' | 'invited' | 'suspended';
  joinedAt: Date;
  invitedBy?: string;
  invitedAt?: Date;
}

// UI-specific role view model
export interface RoleViewModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  color?: string;
  icon?: string;
}

// UI-specific organization view model
export interface OrganizationViewModel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  logo?: string;
  website?: string;
  memberCount: number;
  planType: string;
  isActive: boolean;
  createdAt: Date;
}

// Form types for UI components
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
}

export interface InviteMemberFormData {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  message?: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// UI-specific error types
export interface AuthError {
  code: string;
  message: string;
  field?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// UI-specific loading states
export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

// UI-specific permission check types
export interface PermissionCheck {
  hasPermission: boolean;
  requiredPermission: string;
  userPermissions: string[];
  reason?: string;
}

// UI-specific organization context
export interface OrganizationContext {
  activeOrganization: OrganizationViewModel | null;
  availableOrganizations: OrganizationViewModel[];
  isLoading: boolean;
  canSwitchOrganization: boolean;
}

// UI-specific team member types
export interface TeamMemberViewModel {
  id: string;
  userId: string;
  profile: ProfileViewModel;
  membership: MembershipViewModel;
  lastActivity?: Date;
  isOnline: boolean;
}

// UI-specific notification types
export interface AuthNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
} 