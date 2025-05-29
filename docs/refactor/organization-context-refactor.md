# Organization Context Refactor: Database-First for Enterprise

## Executive Summary

**Current Problem:** Organization data is stored in multiple places (user_metadata, app_metadata, localStorage), creating synchronization issues and complexity.

**Goal:** Migrate to a clean, database-first architecture to support enterprise requirements.

**Enterprise Requirements:**
- ✅ **Audit trails** for compliance and security
- ✅ **Real-time permission updates** without re-authentication  
- ✅ **Multi-org simultaneous access** for advanced dashboards
- ✅ **Scalable architecture** for large user bases

**Impact:** Enterprise-grade reliability, compliance support, real-time capabilities, cleaner code.

---

## Enterprise Requirements Analysis

### **Audit Trails**
```sql
-- Track every organization switch for compliance
CREATE TABLE organization_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  action VARCHAR(50) NOT NULL, -- 'switch', 'access', 'permission_change'
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Real-Time Permission Updates**
```typescript
// Permissions can change while user is active
// JWT approach: User would need to re-login to get new permissions
// Database approach: Permissions checked on every request (always current)

// Example: Admin revokes user's access to Organization A
// JWT: User keeps access until token expires
// Database: Access revoked immediately on next request
```

### **Multi-Org Simultaneous Access**
```typescript
// Enterprise dashboard showing data from multiple orgs
const dashboardData = await Promise.all([
  getDashboardData('org-1'),
  getDashboardData('org-2'), 
  getDashboardData('org-3')
]);

// JWT approach: Can only have 1 active org in token
// Database approach: Check permissions for each org in real-time
```

---

## Current State Analysis

### Data Storage Locations
```typescript
// 🔴 Current: Organization ID stored in 4 places
user.user_metadata.active_organization_id          // UI reads this
user.app_metadata.active_organization_id           // Legacy
user.app_metadata.custom_claims.active_organization_id // RLS policies use this
localStorage.active_organization_id                // Fallback for UI
```

### Current Flow
1. User clicks organization dropdown
2. UI calls `organizationService.switchToOrganization()`
3. Service calls Edge Function `switch-organization`
4. Edge Function updates both user_metadata and app_metadata
5. Session refresh propagates JWT claims
6. UI reads from user_metadata + localStorage fallback

### Problems for Enterprise
- **No audit trail** - Can't track who accessed what when
- **Stale permissions** - JWT tokens don't reflect real-time permission changes
- **Single org limitation** - Can't access multiple orgs simultaneously
- **Complex fallback logic** - Need to check 4 different places
- **Race conditions** - Updates might partially fail
- **Compliance gaps** - No logging for security audits

---

## Proposed Architecture: Database-First for Enterprise

### Single Source of Truth: Database Tables
```sql
-- User organization context with audit trail
CREATE TABLE user_organization_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Multi-org access permissions (real-time checkable)
CREATE TABLE user_organization_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  
  UNIQUE(user_id, organization_id)
);

-- Audit trail for compliance
CREATE TABLE organization_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  action VARCHAR(50) NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enterprise Flow
1. User requests organization switch
2. System logs audit trail
3. Database updates user context
4. Real-time permissions validated
5. React Context updates UI immediately
6. Multi-org access uses permission table

### Enterprise Benefits
- ✅ **Complete audit trail** - Every action logged for compliance
- ✅ **Real-time permissions** - Always current, no token lag
- ✅ **Multi-org access** - Check permissions for any org on demand
- ✅ **Scalable architecture** - Database can handle large user bases
- ✅ **Compliance ready** - SOC2, GDPR, HIPAA compatible

---

## Migration Steps for Enterprise

### Phase 1: Database Setup with Enterprise Features (3 days)

#### Step 1.1: Create enterprise tables
```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_create_enterprise_organization_context.sql

-- Main context table
CREATE TABLE public.user_organization_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enterprise permission tracking
CREATE TABLE public.user_organization_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(user_id, organization_id),
  -- Only allow active permissions (revoked_at IS NULL)
  EXCLUDE (user_id, organization_id) WHERE (revoked_at IS NULL)
);

-- Audit trail for compliance
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

-- Indexes for performance
CREATE INDEX idx_user_org_context_user_id ON public.user_organization_context(user_id);
CREATE INDEX idx_user_org_context_org_id ON public.user_organization_context(active_organization_id);
CREATE INDEX idx_user_org_permissions_user_org ON public.user_organization_permissions(user_id, organization_id);
CREATE INDEX idx_user_org_permissions_active ON public.user_organization_permissions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_org_access_log_user_time ON public.organization_access_log(user_id, created_at DESC);
CREATE INDEX idx_org_access_log_org_time ON public.organization_access_log(organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_organization_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organization_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_access_log ENABLE ROW LEVEL SECURITY;
```

#### Step 1.2: Update RLS helper function
```sql
-- Update the get_active_organization_id function to read from database
CREATE OR REPLACE FUNCTION public.get_active_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT uoc.active_organization_id 
  FROM public.user_organization_context uoc
  JOIN public.user_organization_permissions uop ON (
    uop.user_id = uoc.user_id 
    AND uop.organization_id = uoc.active_organization_id
    AND uop.revoked_at IS NULL
  )
  WHERE uoc.user_id = auth.uid()
  LIMIT 1;
$$;

-- Check if user has access to specific organization (real-time)
CREATE OR REPLACE FUNCTION public.user_has_org_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_organization_permissions 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND revoked_at IS NULL
  );
$$;
```

### Phase 2: Enterprise Organization Service (2 days)

#### Step 2.1: Create enterprise service
```typescript
// File: lib/services/enterprise-organization-service.ts
import { createClient } from '@/lib/supabase/client';

export interface OrganizationContext {
  user_id: string;
  active_organization_id: string | null;
  last_accessed_at: string;
  updated_at: string;
}

export interface OrganizationPermission {
  organization_id: string;
  role_name: string;
  granted_at: string;
}

export class EnterpriseOrganizationService {
  private supabase = createClient();

  // Get current context with real-time permission validation
  async getCurrentContext(): Promise<OrganizationContext | null> {
    const { data, error } = await this.supabase
      .from('user_organization_context')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Switch organization with audit trail
  async switchOrganization(organizationId: string, metadata?: any): Promise<void> {
    // Start transaction-like operation
    const { error: contextError } = await this.supabase
      .from('user_organization_context')
      .upsert({
        user_id: (await this.supabase.auth.getUser()).data.user?.id,
        active_organization_id: organizationId,
        last_accessed_at: new Date().toISOString(),
      });

    if (contextError) throw contextError;

    // Log audit trail
    await this.logAccess('switch', organizationId, metadata);
  }

  // Multi-org access: Get data from multiple organizations
  async getMultiOrgData<T>(
    organizationIds: string[], 
    dataFetcher: (orgId: string) => Promise<T>
  ): Promise<Record<string, T | null>> {
    // Validate access to all requested organizations
    const accessChecks = await Promise.all(
      organizationIds.map(async (orgId) => ({
        orgId,
        hasAccess: await this.hasOrganizationAccess(orgId)
      }))
    );

    const results: Record<string, T | null> = {};
    
    // Fetch data only for organizations user has access to
    for (const { orgId, hasAccess } of accessChecks) {
      if (hasAccess) {
        try {
          results[orgId] = await dataFetcher(orgId);
        } catch (error) {
          console.error(`Failed to fetch data for org ${orgId}:`, error);
          results[orgId] = null;
        }
      } else {
        results[orgId] = null; // No access
      }
    }

    return results;
  }

  // Check real-time permission for specific organization
  async hasOrganizationAccess(organizationId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('user_has_org_access', { org_id: organizationId });

    if (error) throw error;
    return data === true;
  }

  // Private helper to log access
  private async logAccess(
    action: string, 
    organizationId: string | null, 
    details: any = {}
  ): Promise<void> {
    const { error } = await this.supabase
      .from('organization_access_log')
      .insert({
        user_id: (await this.supabase.auth.getUser()).data.user?.id,
        organization_id: organizationId,
        action,
        details,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
      });

    if (error) {
      console.error('Failed to log audit trail:', error);
    }
  }
}

export const enterpriseOrganizationService = new EnterpriseOrganizationService();
```

### Phase 3: Enterprise React Context (2 days)

#### Step 3.1: Create enterprise context with real-time updates
```typescript
// File: context/enterprise-organization-context.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { enterpriseOrganizationService, type OrganizationContext } from '@/lib/services/enterprise-organization-service';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';

interface EnterpriseOrganizationContextValue {
  context: OrganizationContext | null;
  isLoading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  hasAccess: (organizationId: string) => Promise<boolean>;
  getMultiOrgData: <T>(orgIds: string[], fetcher: (orgId: string) => Promise<T>) => Promise<Record<string, T | null>>;
  refresh: () => Promise<void>;
}

const EnterpriseOrganizationContext = createContext<EnterpriseOrganizationContextValue | null>(null);

export function EnterpriseOrganizationProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<OrganizationContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const contextData = await enterpriseOrganizationService.getCurrentContext();
      setContext(contextData);
    } catch (error) {
      console.error('Failed to load organization data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchOrganization = async (organizationId: string) => {
    try {
      // Optimistic update
      setContext(prev => prev ? {
        ...prev,
        active_organization_id: organizationId,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null);

      await enterpriseOrganizationService.switchOrganization(organizationId, {
        source: 'ui_dropdown',
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Organization Switched',
        description: 'Successfully switched organization with audit trail logged'
      });

    } catch (error) {
      console.error('Switch organization error:', error);
      await loadData(); // Revert optimistic update
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to switch organization'
      });
    }
  };

  const hasAccess = async (organizationId: string): Promise<boolean> => {
    try {
      return await enterpriseOrganizationService.hasOrganizationAccess(organizationId);
    } catch (error) {
      console.error('Access check error:', error);
      return false;
    }
  };

  const getMultiOrgData = async <T,>(
    orgIds: string[], 
    fetcher: (orgId: string) => Promise<T>
  ): Promise<Record<string, T | null>> => {
    return await enterpriseOrganizationService.getMultiOrgData(orgIds, fetcher);
  };

  useEffect(() => {
    loadData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });

    // Set up real-time updates for permission changes
    const permissionSubscription = supabase
      .channel('user_permissions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_organization_permissions',
        }, 
        () => {
          console.log('Real-time permission change detected');
          loadData(); // Refresh on permission changes
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      permissionSubscription.unsubscribe();
    };
  }, [loadData]);

  return (
    <EnterpriseOrganizationContext.Provider value={{
      context,
      isLoading,
      switchOrganization,
      hasAccess,
      getMultiOrgData,
      refresh: loadData
    }}>
      {children}
    </EnterpriseOrganizationContext.Provider>
  );
}

export function useEnterpriseOrganization() {
  const context = useContext(EnterpriseOrganizationContext);
  if (!context) {
    throw new Error('useEnterpriseOrganization must be used within EnterpriseOrganizationProvider');
  }
  return context;
}
```

### Phase 4: Enterprise API Routes (1 day)

#### Step 4.1: Create enterprise organization API
```typescript
// File: app/api/enterprise/organization/switch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { organization_id, metadata } = await request.json();
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.ip || request.headers.get('x-forwarded-for');

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to the organization
    const { data: hasAccess } = await supabase
      .rpc('user_has_org_access', { org_id: organization_id });

    if (!hasAccess) {
      // Log unauthorized access attempt
      await supabase.from('organization_access_log').insert({
        user_id: user.id,
        organization_id,
        action: 'unauthorized_switch_attempt',
        details: { metadata, user_agent: userAgent },
        ip_address: ipAddress,
      });

      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update context
    const { error: updateError } = await supabase
      .from('user_organization_context')
      .upsert({
        user_id: user.id,
        active_organization_id: organization_id,
        last_accessed_at: new Date().toISOString(),
      });

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update context' }, { status: 500 });
    }

    // Log successful switch
    await supabase.from('organization_access_log').insert({
      user_id: user.id,
      organization_id,
      action: 'switch',
      details: { metadata, user_agent: userAgent },
      ip_address: ipAddress,
    });

    return NextResponse.json({
      success: true,
      organization_id,
      message: 'Organization switched with audit trail'
    });

  } catch (error) {
    console.error('Enterprise organization switch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Enterprise Timeline Estimate

- **Phase 1:** Enterprise Database Setup - 3 days
- **Phase 2:** Enterprise Service Layer - 2 days  
- **Phase 3:** Enterprise React Context - 2 days
- **Phase 4:** API Routes & UI Components - 2 days
- **Phase 5:** Testing & Compliance Validation - 2 days

**Total:** ~11 days for enterprise-grade implementation

---

## Enterprise Success Criteria

### **Compliance & Audit**
- [ ] Complete audit trail of all organization access
- [ ] Real-time permission revocation (< 1 second)
- [ ] Multi-org access with proper authorization
- [ ] GDPR/SOC2 compliant logging

### **Performance at Scale**
- [ ] Sub-200ms response for organization switching
- [ ] Multi-org data fetching with proper access control
- [ ] Real-time permission updates via WebSockets
- [ ] Efficient database queries with proper indexing

### **Enterprise Features**
- [ ] Audit trail export for compliance officers
- [ ] Real-time permission management UI
- [ ] Multi-org dashboard capabilities
- [ ] Granular access control and role management

---

## Notes

- Database-first approach provides enterprise-grade capabilities
- Real-time permission validation ensures security compliance
- Audit trail supports SOC2, GDPR, and other compliance requirements
- Multi-org access enables advanced enterprise dashboard features
- Scalable architecture supports large user bases and complex hierarchies 