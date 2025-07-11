# Comprehensive Security Design

## Overview

This document provides a complete overview of our application's security architecture, covering everything from user authentication to feature access control. It includes both user-facing permissions and internal application security measures.

## Security Architecture Layers

### Layer 1: Authentication & Identity
**What it protects:** Who can access the system at all

- **User Registration/Login** - Supabase Auth with email/password
- **JWT Token Management** - Secure token generation and validation
- **Session Management** - Token refresh and expiration
- **Organization Context** - Active organization selection and switching

### Layer 2: Authorization & Roles
**What it protects:** What authenticated users can do

- **Role-Based Access Control (RBAC)** - Admin, Editor, Member, Viewer, Visitor
- **Permission Mapping** - Roles mapped to specific capabilities
- **Super Admin Override** - Database-level super admin access
- **Organization Membership** - Users belong to specific organizations

### Layer 3: Feature Access Control
**What it protects:** Which features users can access

- **Feature Flags** - Enable/disable features per organization
- **Feature-Level Permissions** - Role-based feature access
- **Component-Level Security** - UI elements shown/hidden based on permissions
- **API Endpoint Protection** - Server-side feature access validation

### Layer 4: Data Access Control
**What it protects:** Which specific data users can see/modify

- **Row Level Security (RLS)** - Database automatically filters data
- **Organization Scoping** - All data isolated by organization
- **User Ownership** - Users can only access their own data within organization
- **Super Admin Access** - Bypass restrictions for system administration

### Layer 5: Infrastructure Security
**What it protects:** Internal application communications

- **API Security** - Service-to-service authentication
- **Layer-to-Layer Permissions** - Clean architecture boundaries
- **Database Connection Security** - Encrypted connections and credentials
- **External Service Security** - Secure integrations with third-party APIs

## User Authentication Flow

### 1. Initial Login Process

```
User enters credentials → Supabase Auth validates → JWT token generated → Organization context set → Session established
```

**Detailed Steps:**
1. **User submits login form** with email/password
2. **Frontend validates input** (basic format checking)
3. **Request sent to Supabase Auth** via secure HTTPS
4. **Supabase validates credentials** against user database
5. **JWT token generated** with user identity and metadata
6. **Edge function sets organization context** in JWT custom claims
7. **Token returned to client** and stored securely
8. **User redirected** to application dashboard

### 2. JWT Token Structure

```typescript
// JWT Token Payload (what's inside the token)
{
  "sub": "user-uuid-12345",           // User ID
  "email": "user@company.com",        // User email
  "aud": "authenticated",             // Audience (authenticated users)
  "exp": 1704067200,                  // Expiration timestamp
  "iat": 1704063600,                  // Issued at timestamp
  "role": "authenticated",            // Supabase role (not business role)
  "app_metadata": {},                 // System metadata
  "user_metadata": {                  // Custom user data
    "email": "user@company.com"
  },
  "custom_claims": {                  // Organization context
    "active_organization_id": "org-uuid-67890"
  }
}
```

### 3. Session Management

- **Token Storage:** Stored in secure HTTP-only cookies
- **Auto-Refresh:** Tokens automatically refreshed before expiration
- **Organization Context:** Active organization ID stored in JWT custom claims
- **Context Switching:** Users can switch between organizations they have access to
- **Logout:** Tokens invalidated and removed from client

## Role-Based Permission System

### 1. Role Hierarchy (Simplified Model)

```typescript
// Five-role hierarchy with clear capabilities
enum UserRole {
  ADMIN = 'admin',     // Full access to all features
  EDITOR = 'editor',   // Full access to all features  
  MEMBER = 'member',   // Full access to all features
  VIEWER = 'viewer',   // Read-only access to features
  VISITOR = 'visitor'  // No access to features
}
```

### 2. Permission Model

**Feature-Level Permissions:**
- `notes:access` - Can access notes feature
- `notes:write` - Can create/edit/delete notes
- `dam:access` - Can access digital asset management
- `dam:write` - Can upload/edit/delete assets
- `chatbot:access` - Can access chatbot features
- `chatbot:write` - Can configure chatbot settings

**Role-Permission Mapping:**
```typescript
const ROLE_PERMISSIONS = {
  admin:   ['notes:access', 'notes:write', 'dam:access', 'dam:write', 'chatbot:access', 'chatbot:write'],
  editor:  ['notes:access', 'notes:write', 'dam:access', 'dam:write', 'chatbot:access', 'chatbot:write'],
  member:  ['notes:access', 'notes:write', 'dam:access', 'dam:write', 'chatbot:access', 'chatbot:write'],
  viewer:  ['notes:access', 'dam:access', 'chatbot:access'],  // READ-ONLY
  visitor: []  // NO ACCESS
};
```

### 3. Database Role Storage

**Current Implementation:**
- **Roles stored in database:** `roles` table with id, name, description
- **User role assignments:** `user_organization_permissions` table
- **Role checking:** Via database functions and application layer
- **Migration path:** From hardcoded roles to database-driven permissions

## Organization Context & Access Control

### 1. Organization Selection Flow

```
User logs in → Multiple orgs detected → User selects org → Context established → Permissions loaded
```

**Detailed Steps:**
1. **System checks user's organizations** from `user_organization_permissions` table
2. **If multiple orgs:** User sees organization selector
3. **If single org:** Automatically selected
4. **Organization context set** in JWT custom claims via edge function
5. **User's role determined** for selected organization
6. **Permissions calculated** based on role and feature flags

### 2. Active Organization Resolution

**Database Function:**
```sql
-- Returns user's active organization from JWT claims
CREATE OR REPLACE FUNCTION get_active_organization_id()
RETURNS UUID AS $$
  SELECT nullif(
    (current_setting('request.jwt.claims', true)::jsonb -> 'custom_claims') ->> 'active_organization_id', 
    ''
  )::uuid;
$$ LANGUAGE sql STABLE;
```

**Application Function:**
```typescript
// Server-side function to get active organization
export async function getActiveOrganizationId(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_active_organization_id');
  return data || null;
}
```

## Complete Feature Access Pipeline

### User Journey: Login → Feature Access

```
[Login] → [Org Selection] → [Dashboard] → [Feature Click] → [Permission Check] → [Data Loading]
```

### Detailed Pipeline Walkthrough

#### Step 1: Authentication Check
```
User: Clicks "Notes" feature
System: Verifies JWT token
✅ Token is valid and not expired
✅ User session is active
✅ User is authenticated
→ Proceed to Step 2
```

#### Step 2: Organization Context Validation
```
System: Checks organization context
✅ Active organization ID exists in JWT claims
✅ User has permission to access this organization
✅ Organization is active (not suspended)
→ Proceed to Step 3
```

#### Step 3: Feature Flag Check
```
System: Checks if feature is enabled
Query: SELECT feature_flags->'notes' FROM organizations 
       WHERE id = get_active_organization_id()
✅ Notes feature flag is enabled for this organization
→ Proceed to Step 4
```

#### Step 4: Role Permission Check
```
System: Validates user's role permissions
User Role: Editor (from database)
Required Permission: notes:access
✅ Editors have notes:access permission
→ Proceed to Step 5
```

#### Step 5: Component Rendering
```
Frontend: Renders notes interface based on permissions
✅ User can see notes list (has notes:access)
✅ User can see "Create Note" button (has notes:write)
✅ User can see edit/delete buttons (has notes:write)
→ Proceed to Step 6
```

#### Step 6: Data Loading with RLS
```
Database Query: SELECT * FROM notes
RLS Policy Applied Automatically:
  - Filter by organization_id = get_active_organization_id()
  - Filter by user_id = auth.uid() (for user's own notes)
  - OR is_super_admin() (super admin override)
✅ Only user's notes from current organization returned
→ Feature access complete
```

## Row Level Security (RLS) Deep Dive

### How RLS Works

Row Level Security is PostgreSQL's built-in feature that automatically filters database rows based on the current user context and JWT claims.

### RLS Policy Examples

#### Notes Table RLS Policies
```sql
-- Policy 1: Users can only access their own notes in their active organization
CREATE POLICY "Enable user access to their notes in active organization" 
ON notes FOR ALL TO public
USING (
  organization_id = get_active_organization_id() 
  AND user_id = auth.uid()
)
WITH CHECK (
  organization_id = get_active_organization_id() 
  AND user_id = auth.uid()
);

-- Policy 2: Super admins can access all notes
CREATE POLICY "Super admins can manage all notes" 
ON notes FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());
```

#### How RLS Executes
```sql
-- What developer writes:
SELECT * FROM notes;

-- What database actually executes with RLS:
SELECT * FROM notes 
WHERE (
  (organization_id = get_active_organization_id() AND user_id = auth.uid())
  OR is_super_admin()
);
```

### RLS Helper Functions

#### get_active_organization_id()
```sql
-- Returns the user's currently selected organization from JWT claims
CREATE OR REPLACE FUNCTION get_active_organization_id()
RETURNS uuid AS $$
  SELECT nullif(
    (current_setting('request.jwt.claims', true)::jsonb -> 'custom_claims') ->> 'active_organization_id', 
    ''
  )::uuid;
$$ LANGUAGE sql STABLE;
```

#### is_super_admin()
```sql
-- Checks if current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_super_admin 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

#### user_has_org_access()
```sql
-- Checks if user has access to specific organization
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_organization_permissions 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND revoked_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## API Security & Layer Permissions

### API Endpoint Protection

#### Server Action Security Pattern
```typescript
// Every server action follows this security pattern
export async function createNote(content: string) {
  try {
    // 1. Authentication check
    const user = await getCurrentUser();
    if (!user) throw new Error('Authentication required');
    
    // 2. Feature access check using shared access control
    await checkFeatureAccess({
      featureName: 'notes',
      requiredPermissions: ['notes:write'],
      requireOrganization: true
    });
    
    // 3. Organization context validation (handled by checkFeatureAccess)
    const orgId = await getActiveOrganizationId();
    if (!orgId) throw new Error('No active organization found');
    
    // 4. Business logic execution
    const service = NotesCompositionRoot.getApplicationService();
    return await service.createNote(content, user.id, orgId);
    
  } catch (error) {
    // 5. Error handling with proper logging
    return handleSecurityError(error);
  }
}
```

#### Shared Access Control Implementation
```typescript
// lib/shared/access-control/server/checkFeatureAccess.ts
export async function checkFeatureAccess({
  featureName,
  requiredRoles = [],
  requiredPermissions = [],
  requireOrganization = true,
  defaultEnabled = true // AI: Universal rule - all features default to enabled when flag is missing
}: ServerFeatureAccessOptions): Promise<ServerFeatureAccessResult> {
  
  // Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }
  
  // Organization context check
  let organizationId: string | null = null;
  if (requireOrganization) {
    organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      throw new Error('Organization access required');
    }
  }
  
  // Feature flag check
  if (organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', organizationId)
      .single();
    
    // Feature flag default behavior:
    // - Universal rule: All features default to enabled when flag is missing from database
    // - Organizations must explicitly disable features they don't want
    const isFeatureEnabled = org?.feature_flags?.[featureName] ?? defaultEnabled;
    if (!isFeatureEnabled) {
      throw new Error(`Feature '${featureName}' is not enabled for this organization`);
    }
  }
  
  // Get user role from database (organization-specific)
  let userRole: UserRole | undefined = undefined;
  if (organizationId) {
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();
    
    userRole = membership?.role as UserRole | undefined;
  }
  
  // Role and permission checks
  if (requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new Error(`Insufficient permissions: requires one of [${requiredRoles.join(', ')}]`);
    }
  }
  
  if (requiredPermissions.length > 0) {
    if (!userRole) {
      throw new Error(`No role found for user in organization`);
    }
    
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasRequiredPermissions = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermissions) {
      throw new Error(`Insufficient permissions: requires one of [${requiredPermissions.join(', ')}]`);
    }
  }
  
  return { organizationId: organizationId!, userId: user.id, userRole };
}
```

### Layer-to-Layer Security

#### 1. Presentation → Application Layer
```typescript
// Presentation layer (React components, server actions)
// Security: User authentication, feature flags, input validation

async function handleCreateNote(formData: FormData) {
  // ✅ User is authenticated (middleware check)
  // ✅ Feature flag checked (checkFeatureAccess)
  // ✅ Input validated (form validation)
  
  const service = getApplicationService(); // → Application layer
  return await service.createNote(formData);
}
```

#### 2. Application → Domain Layer  
```typescript
// Application layer (use cases, application services)
// Security: Business rule validation, cross-cutting concerns

class NotesApplicationService {
  async createNote(content: string, userId: string, orgId: string) {
    // ✅ Parameters validated
    // ✅ User context established
    // ✅ Organization context established
    
    const domainService = this.notesDomainService; // → Domain layer
    return await domainService.createNote(content, userId, orgId);
  }
}
```

#### 3. Domain → Infrastructure Layer
```typescript
// Domain layer (business logic, domain services)  
// Security: Business invariants, domain rules

class NotesDomainService {
  async createNote(content: string, userId: string, orgId: string) {
    // ✅ Business rules validated
    // ✅ Domain invariants checked
    
    const repository = this.notesRepository; // → Infrastructure layer
    return await repository.save(note);
  }
}
```

#### 4. Infrastructure Layer (Database)
```typescript
// Infrastructure layer (repositories, external services)
// Security: RLS policies, connection security, data encryption

class NotesSupabaseRepository {
  async save(note: Note) {
    // ✅ Database connection authenticated
    // ✅ RLS policies automatically applied
    // ✅ Data encrypted in transit and at rest
    
    return await this.supabase
      .from('notes')
      .insert(note.toDatabase()); // RLS ensures proper filtering
  }
}
```

## Internal Application Security

### Service-to-Service Communication

#### 1. Database Security
- **Connection Encryption:** All database connections use TLS
- **Credential Management:** Database credentials stored in environment variables
- **Connection Pooling:** Secure connection pooling with authentication
- **Query Parameterization:** All queries use parameterized statements (no SQL injection)

#### 2. External API Security
```typescript
// Example: Secure external service integration
class ExternalAPIProvider {
  private async authenticateRequest(request: Request) {
    // ✅ API keys stored in secure environment variables
    // ✅ Request signing for tamper protection
    // ✅ Rate limiting to prevent abuse
    // ✅ Timeout handling for reliability
    
    request.headers.set('Authorization', `Bearer ${this.apiKey}`);
    request.headers.set('X-Signature', this.signRequest(request));
    return request;
  }
}
```

#### 3. Composition Root Security
```typescript
// Dependency injection with security controls
class CompositionRoot {
  static getApplicationService(): NotesApplicationService {
    // ✅ Singleton pattern prevents multiple instances
    // ✅ Dependencies injected securely
    // ✅ No direct instantiation allowed
    
    if (!this.instance) {
      this.instance = new NotesApplicationService(
        this.getDomainService(),
        this.getRepository(),
        this.getLogger()
      );
    }
    return this.instance;
  }
}
```

## User Permissions vs Internal Permissions

### User-Facing Permissions
**Purpose:** Control what users can see and do

- **Feature Access:** Can user access Notes, DAM, Chatbot, etc.?
- **Action Permissions:** Can user create, edit, delete content?
- **Data Visibility:** Which specific records can user see?
- **UI Controls:** Which buttons/menus are shown?

### Internal Application Permissions  
**Purpose:** Control how system components interact

- **Layer Boundaries:** Presentation can call Application, but not Domain directly
- **Service Access:** Only authorized services can access repositories
- **Database Access:** Only infrastructure layer can execute database queries
- **External APIs:** Only designated providers can call external services

### Permission Enforcement Points

#### User Permissions Enforced At:
1. **Middleware Level** - Route access control
2. **Component Level** - UI element visibility (`useFeatureAccess` hook)
3. **Server Action Level** - Request processing (`checkFeatureAccess`)
4. **Database Level** - Row-level security policies

#### Internal Permissions Enforced At:
1. **Architecture Level** - Layer separation rules (DDD boundaries)
2. **Composition Root** - Dependency injection controls
3. **Interface Level** - Contract enforcement
4. **Build Time** - TypeScript type checking

## Security Monitoring & Audit

### What We Track
- **Authentication Events:** Login attempts, failures, successes
- **Organization Switching:** Context changes and access patterns
- **Permission Changes:** Role assignments, feature flag changes
- **Data Access:** Who accessed what data when
- **Security Violations:** Failed permission checks, suspicious activity

### Audit Trail Implementation
```sql
-- Organization access logging
CREATE TABLE public.organization_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  action VARCHAR(50) NOT NULL, -- 'switch', 'access', 'permission_grant', 'permission_revoke'
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Audit Trail Example
```
Event: Note Created
User: jane@company.com (ID: 12345)
Organization: Acme Corp (ID: 67890)  
Role: Editor
Timestamp: 2024-01-15 14:30:25 UTC
Resource: Note ID 98765
Action: CREATE
IP Address: 192.168.1.100
User Agent: Chrome 120.0.0.0
Status: SUCCESS
```

## Super Admin System

### Super Admin Capabilities
- **Cross-Organization Access:** Can access any organization's data
- **RLS Bypass:** Special database function `is_super_admin()` bypasses normal RLS
- **System Administration:** Can manage users, organizations, and system settings
- **Audit Trail Access:** Can view all audit logs across organizations

### Super Admin Security
- **Database-Only Management:** Super admin status can only be granted via direct database access
- **Audit Trail:** All super admin privilege changes are logged
- **Function-Based Checking:** Uses `is_super_admin()` function instead of hardcoded UUIDs

```sql
-- Grant super admin privileges (database-only function)
SELECT grant_super_admin('user-uuid', 'Granted for system administration');

-- Check super admin status
SELECT is_super_admin(); -- Returns true/false for current user
```

## Security Best Practices Applied

### Defense in Depth
- **Multiple Security Layers:** If one fails, others still protect
- **Fail-Safe Defaults:** When in doubt, deny access
- **Principle of Least Privilege:** Users get minimum access needed
- **Zero Trust:** Never trust, always verify

### Input Validation & Sanitization
- **Client-Side Validation:** Immediate user feedback
- **Server-Side Validation:** Security enforcement
- **Database Constraints:** Final data integrity check
- **Output Encoding:** Prevent XSS attacks

### Error Handling
- **Security Errors:** Never expose sensitive information
- **Logging:** Detailed logs for security analysis
- **User Feedback:** Helpful but non-revealing error messages
- **Fail Gracefully:** System remains stable during security events

## Future Security Enhancements

### Planned Improvements
- **Database-Driven Permissions:** Move from hardcoded to database-stored permissions
- **Advanced Audit Logging:** More detailed security event tracking
- **Anomaly Detection:** Automated suspicious activity detection  
- **Multi-Factor Authentication:** Additional security layer
- **API Rate Limiting:** Prevent abuse and DoS attacks
- **Content Security Policy:** Enhanced browser security
- **Security Headers:** Additional HTTP security headers

### Compliance Readiness
- **SOX Compliance:** Audit trail and access controls
- **GDPR Compliance:** Data privacy and user rights
- **SOC 2 Type II:** Security controls and monitoring
- **HIPAA Readiness:** Healthcare data protection (if needed)

This comprehensive security design ensures that user data is protected at every level, from initial authentication through final data storage, while maintaining a simple and understandable permission model for users and developers. 