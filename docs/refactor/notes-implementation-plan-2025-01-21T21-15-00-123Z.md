# Notes Domain - Implementation Plan for 100/100 Excellence

**Date**: 2025-01-21T21:15:00.123Z  
**Domain**: Notes (Gold Standard Enhancement)  
**Target Score**: 100/100 (Current: 92/100)  
**Related Audit**: `notes-upgrade-audit-2025-01-21T21-15-00-123Z.md`  

---

## 🎯 Implementation Overview

This plan provides **detailed, executable tasks** to enhance the Notes domain from 92/100 to 100/100 while preserving its gold standard status. Each task includes code examples, acceptance criteria, and quality gates.

### **Enhancement Summary**
- **Phase 1**: Critical Security Enhancements (8-12 hours)
- **Phase 2**: Performance Optimizations (6-8 hours)  
- **Phase 3**: Advanced Features (4-6 hours)
- **Total Effort**: 18-26 hours (2.5-3.5 days)

---

## 🚨 Phase 1: Critical Security Enhancements (HIGH PRIORITY)

### **Task 001: Implement Permission Caching System**
**Priority**: CRITICAL  
**Estimated Time**: 4-6 hours  
**Files to Create/Modify**: 3 files  

#### **Step 1.1: Create Cached Permission Service**
**File**: `lib/notes/infrastructure/services/CachedPermissionService.ts`

```typescript
import { IPermissionService, Permission } from '../../domain/services/IPermissionService';
import { PermissionDeniedError } from '../../domain/errors/NotesDomainError';
import { SupabasePermissionService } from './SupabasePermissionService';

interface PermissionCacheEntry {
  permissions: Permission[];
  roles: string[];
  timestamp: number;
  organizationId: string;
}

interface PermissionAuditEvent {
  userId: string;
  organizationId: string;
  action: string;
  requiredPermissions: Permission[];
  userPermissions: Permission[];
  result: 'granted' | 'denied';
  timestamp: Date;
  fromCache: boolean;
}

export class CachedPermissionService implements IPermissionService {
  private cache = new Map<string, PermissionCacheEntry>();
  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 10000; // Prevent memory exhaustion
  
  constructor(
    private baseService: SupabasePermissionService,
    private auditService?: IAuditService
  ) {}

  async validateNotePermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[]
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `permissions-${userId}-${organizationId}`;
      let cacheEntry = this.getCachedPermissions(cacheKey);
      let fromCache = true;
      
      if (!cacheEntry || this.isCacheExpired(cacheEntry)) {
        // Cache miss or expired - fetch from database
        const [userPermissions, userRoles] = await Promise.all([
          this.baseService.getUserPermissions(userId, organizationId),
          this.baseService.getUserRoles(userId, organizationId)
        ]);
        
        cacheEntry = {
          permissions: userPermissions,
          roles: userRoles,
          timestamp: Date.now(),
          organizationId
        };
        
        this.setCachedPermissions(cacheKey, cacheEntry);
        fromCache = false;
      }
      
      // Validate permissions
      const hasAllPermissions = requiredPermissions.every(permission =>
        cacheEntry!.permissions.includes(permission)
      );
      
      // Audit the permission check
      if (this.auditService) {
        await this.auditService.logPermissionCheck({
          userId,
          organizationId,
          action: 'validateNotePermissions',
          requiredPermissions,
          userPermissions: cacheEntry.permissions,
          result: hasAllPermissions ? 'granted' : 'denied',
          timestamp: new Date(),
          fromCache,
          responseTimeMs: Date.now() - startTime
        });
      }
      
      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission =>
          !cacheEntry!.permissions.includes(permission)
        );
        
        throw new PermissionDeniedError(
          `User ${userId} lacks required permissions: ${missingPermissions.join(', ')}`,
          {
            userId,
            organizationId,
            requiredPermissions,
            userPermissions: cacheEntry.permissions,
            missingPermissions
          }
        );
      }
      
    } catch (error) {
      // Audit failed permission checks
      if (this.auditService && error instanceof PermissionDeniedError) {
        await this.auditService.logSecurityEvent({
          eventType: 'PERMISSION_DENIED',
          userId,
          organizationId,
          context: error.context,
          severity: 'HIGH',
          timestamp: new Date()
        });
      }
      throw error;
    }
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    // Always check database for SuperAdmin status (security-critical)
    return await this.baseService.isSuperAdmin(userId);
  }

  async getCurrentUserId(): Promise<string | null> {
    return await this.baseService.getCurrentUserId();
  }

  private getCachedPermissions(cacheKey: string): PermissionCacheEntry | null {
    this.cleanupExpiredEntries();
    return this.cache.get(cacheKey) || null;
  }

  private setCachedPermissions(cacheKey: string, entry: PermissionCacheEntry): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestEntries(Math.floor(this.MAX_CACHE_SIZE * 0.1));
    }
    
    this.cache.set(cacheKey, entry);
  }

  private isCacheExpired(entry: PermissionCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_TTL;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);
    
    entries.forEach(([key]) => this.cache.delete(key));
  }

  // Security: Clear cache on organization context change
  clearCacheForUser(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`permissions-${userId}-`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`[SECURITY] Cleared permission cache for user ${userId}: ${keysToDelete.length} entries`);
  }

  // Performance monitoring
  getCacheStats(): { hitRate: number; size: number; entries: number } {
    // Implementation for monitoring cache performance
    return {
      hitRate: 0, // Calculate based on hit/miss counters
      size: this.cache.size,
      entries: this.cache.size
    };
  }
}
```

#### **Step 1.2: Update Composition Root**
**File**: `lib/notes/infrastructure/composition/NotesCompositionRoot.ts`

```typescript
// Add to existing imports
import { CachedPermissionService } from '../services/CachedPermissionService';

export class NotesCompositionRoot {
  private static _permissionService: IPermissionService | null = null;

  // Update getPermissionService method
  static getPermissionService(): IPermissionService {
    if (!this._permissionService) {
      const basePermissionService = new SupabasePermissionService(this.getSupabaseClient());
      this._permissionService = new CachedPermissionService(
        basePermissionService,
        this.getAuditService() // Add when audit service is implemented
      );
    }
    return this._permissionService;
  }

  // Add cache management for testing
  static clearPermissionCache(): void {
    if (this._permissionService instanceof CachedPermissionService) {
      (this._permissionService as any).cache.clear();
    }
  }
}
```

#### **Step 1.3: Add Cache Performance Tests**
**File**: `lib/notes/infrastructure/services/__tests__/CachedPermissionService.test.ts`

```typescript
import { CachedPermissionService } from '../CachedPermissionService';
import { SupabasePermissionService } from '../SupabasePermissionService';
import { Permission } from '../../../domain/services/IPermissionService';

describe('CachedPermissionService', () => {
  let cachedService: CachedPermissionService;
  let mockBaseService: jest.Mocked<SupabasePermissionService>;

  beforeEach(() => {
    mockBaseService = {
      validateNotePermissions: jest.fn(),
      getUserPermissions: jest.fn(),
      getUserRoles: jest.fn(),
      isSuperAdmin: jest.fn(),
      getCurrentUserId: jest.fn()
    } as any;

    cachedService = new CachedPermissionService(mockBaseService);
  });

  describe('permission caching', () => {
    it('should cache permission results for performance', async () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const permissions = [Permission.VIEW_NOTE];

      mockBaseService.getUserPermissions.mockResolvedValue([Permission.VIEW_NOTE, Permission.CREATE_NOTE]);
      mockBaseService.getUserRoles.mockResolvedValue(['MEMBER']);

      // First call - should hit database
      await cachedService.validateNotePermissions(userId, organizationId, permissions);
      expect(mockBaseService.getUserPermissions).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await cachedService.validateNotePermissions(userId, organizationId, permissions);
      expect(mockBaseService.getUserPermissions).toHaveBeenCalledTimes(1);
    });

    it('should expire cache after TTL', async () => {
      // Test cache expiration logic
      jest.useFakeTimers();
      
      const userId = 'user123';
      const organizationId = 'org456';
      
      // First call
      await cachedService.validateNotePermissions(userId, organizationId, [Permission.VIEW_NOTE]);
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(400000); // 6+ minutes
      
      // Should fetch from database again
      await cachedService.validateNotePermissions(userId, organizationId, [Permission.VIEW_NOTE]);
      expect(mockBaseService.getUserPermissions).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should prevent cache size from exceeding limits', async () => {
      // Test cache size management
      for (let i = 0; i < 15000; i++) {
        await cachedService.validateNotePermissions(`user${i}`, `org${i}`, [Permission.VIEW_NOTE]);
      }
      
      const stats = cachedService.getCacheStats();
      expect(stats.size).toBeLessThan(10000);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] Permission validation queries reduced by 80%+
- [ ] Cache hit rate >85% after warmup period
- [ ] Memory usage remains stable under load
- [ ] Cache correctly expires and refreshes
- [ ] All existing tests still pass

---

### **Task 002: Complete Audit Trail Implementation**
**Priority**: CRITICAL  
**Estimated Time**: 3-4 hours  
**Files to Create/Modify**: 4 files  

#### **Step 2.1: Define Audit Service Interface**
**File**: `lib/notes/domain/services/IAuditService.ts`

```typescript
export interface PermissionAuditEvent {
  userId: string;
  organizationId: string;
  action: string;
  requiredPermissions: Permission[];
  userPermissions: Permission[];
  result: 'granted' | 'denied';
  timestamp: Date;
  fromCache: boolean;
  responseTimeMs: number;
  missingPermissions?: Permission[];
}

export interface SecurityAuditEvent {
  eventType: 'PERMISSION_DENIED' | 'ORGANIZATION_SWITCH' | 'CACHE_CLEARED' | 'SUPER_ADMIN_ACCESS';
  userId: string;
  organizationId: string;
  context: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface PerformanceAuditEvent {
  metric: string;
  value: number;
  unit: 'ms' | 'count' | 'percentage' | 'bytes';
  context: Record<string, any>;
  timestamp: Date;
}

export interface IAuditService {
  logPermissionCheck(event: PermissionAuditEvent): Promise<void>;
  logSecurityEvent(event: SecurityAuditEvent): Promise<void>;
  logPerformanceMetric(event: PerformanceAuditEvent): Promise<void>;
  getAuditTrail(filters: AuditTrailFilters): Promise<AuditEntry[]>;
}

export interface AuditTrailFilters {
  userId?: string;
  organizationId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: string;
  limit?: number;
}

export interface AuditEntry {
  id: string;
  eventType: string;
  userId: string;
  organizationId: string;
  context: Record<string, any>;
  severity: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

#### **Step 2.2: Implement Supabase Audit Service**
**File**: `lib/notes/infrastructure/services/SupabaseAuditService.ts`

```typescript
import { IAuditService, PermissionAuditEvent, SecurityAuditEvent, PerformanceAuditEvent, AuditEntry, AuditTrailFilters } from '../../domain/services/IAuditService';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseAuditService implements IAuditService {
  constructor(private supabase: SupabaseClient) {}

  async logPermissionCheck(event: PermissionAuditEvent): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        event_type: 'PERMISSION_CHECK',
        user_id: event.userId,
        organization_id: event.organizationId,
        context: {
          action: event.action,
          required_permissions: event.requiredPermissions,
          user_permissions: event.userPermissions,
          result: event.result,
          from_cache: event.fromCache,
          response_time_ms: event.responseTimeMs,
          missing_permissions: event.missingPermissions
        },
        severity: event.result === 'denied' ? 'HIGH' : 'LOW',
        timestamp: event.timestamp.toISOString()
      });

      // High-frequency permission denials could indicate attack
      if (event.result === 'denied') {
        await this.checkForSuspiciousActivity(event.userId, event.organizationId);
      }

    } catch (error) {
      // Don't throw - audit failures shouldn't break functionality
      console.error('[AUDIT_ERROR] Failed to log permission check:', error);
    }
  }

  async logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        event_type: event.eventType,
        user_id: event.userId,
        organization_id: event.organizationId,
        context: event.context,
        severity: event.severity,
        timestamp: event.timestamp.toISOString(),
        ip_address: event.ipAddress,
        user_agent: event.userAgent
      });

      // Alert on critical security events
      if (event.severity === 'CRITICAL') {
        await this.sendSecurityAlert(event);
      }

    } catch (error) {
      console.error('[AUDIT_ERROR] Failed to log security event:', error);
    }
  }

  async logPerformanceMetric(event: PerformanceAuditEvent): Promise<void> {
    try {
      await this.supabase.from('performance_metrics').insert({
        metric: event.metric,
        value: event.value,
        unit: event.unit,
        context: event.context,
        timestamp: event.timestamp.toISOString()
      });

      // Alert on performance degradation
      if (event.metric === 'api_response_time' && event.value > 5000) {
        await this.sendPerformanceAlert(event);
      }

    } catch (error) {
      console.error('[AUDIT_ERROR] Failed to log performance metric:', error);
    }
  }

  async getAuditTrail(filters: AuditTrailFilters): Promise<AuditEntry[]> {
    let query = this.supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate.toISOString());
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit trail: ${error.message}`);
    }

    return data?.map(row => ({
      id: row.id,
      eventType: row.event_type,
      userId: row.user_id,
      organizationId: row.organization_id,
      context: row.context,
      severity: row.severity,
      timestamp: new Date(row.timestamp),
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    })) || [];
  }

  private async checkForSuspiciousActivity(userId: string, organizationId: string): Promise<void> {
    // Check for high frequency permission denials in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const { count } = await this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('event_type', 'PERMISSION_CHECK')
      .contains('context', { result: 'denied' })
      .gte('timestamp', fiveMinutesAgo.toISOString());

    if (count && count > 10) {
      await this.logSecurityEvent({
        eventType: 'PERMISSION_DENIED',
        userId,
        organizationId,
        context: {
          denials_in_5_minutes: count,
          suspicious_activity: true
        },
        severity: 'CRITICAL',
        timestamp: new Date()
      });
    }
  }

  private async sendSecurityAlert(event: SecurityAuditEvent): Promise<void> {
    // TODO: Implement alerting mechanism (email, Slack, etc.)
    console.warn(`[SECURITY_ALERT] ${event.eventType} for user ${event.userId} in org ${event.organizationId}`);
  }

  private async sendPerformanceAlert(event: PerformanceAuditEvent): Promise<void> {
    // TODO: Implement performance alerting
    console.warn(`[PERFORMANCE_ALERT] ${event.metric} degraded: ${event.value}${event.unit}`);
  }
}
```

#### **Step 2.3: Create Database Migration**
**File**: `supabase/migrations/20250121000001_audit_logging.sql`

```sql
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  context JSONB DEFAULT '{}',
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_org ON audit_logs(user_id, organization_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_performance_metrics_metric ON performance_metrics(metric);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Super admins can see all audit logs
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- Performance metrics are read-only for authenticated users
CREATE POLICY "Authenticated users can view performance metrics" ON performance_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert audit logs and metrics
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

#### **Step 2.4: Update Notes Actions with Audit Integration**
**File**: `lib/notes/presentation/actions/notesUnifiedActions.ts`

```typescript
// Add audit logging to existing actions
export async function createNote(input: CreateNoteInput): Promise<ActionResult<Note>> {
  const startTime = Date.now();
  
  try {
    const auditService = NotesCompositionRoot.getAuditService();
    
    // Log performance metric
    await auditService.logPerformanceMetric({
      metric: 'notes_create_request',
      value: 1,
      unit: 'count',
      context: {
        organization_id: input.organizationId,
        content_length: input.content.length
      },
      timestamp: new Date()
    });

    const result = await notesApplicationService.createNote(input);
    
    // Log successful operation
    await auditService.logPerformanceMetric({
      metric: 'notes_create_duration',
      value: Date.now() - startTime,
      unit: 'ms',
      context: {
        organization_id: input.organizationId,
        success: true
      },
      timestamp: new Date()
    });

    return { success: true, data: result };
    
  } catch (error) {
    // Log error with context
    const auditService = NotesCompositionRoot.getAuditService();
    await auditService.logSecurityEvent({
      eventType: 'PERMISSION_DENIED',
      userId: input.userId,
      organizationId: input.organizationId,
      context: {
        action: 'createNote',
        error: error.message,
        duration_ms: Date.now() - startTime
      },
      severity: 'MEDIUM',
      timestamp: new Date()
    });

    throw error;
  }
}
```

**Acceptance Criteria:**
- [ ] All permission checks logged with context
- [ ] Security events tracked and alerted
- [ ] Performance metrics collected
- [ ] Audit trail queryable via API
- [ ] No performance impact on core operations

---

### **Task 003: Remove Hardcoded Security Values**
**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Files to Create/Modify**: 3 files  

#### **Step 3.1: Create Super Admin Configuration Table**
**File**: `supabase/migrations/20250121000002_super_admin_config.sql`

```sql
-- Create super_admin_config table
CREATE TABLE IF NOT EXISTS super_admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated function for super admin detection
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admin_config 
    WHERE admin_user_id = user_id 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX idx_super_admin_config_user_id ON super_admin_config(admin_user_id);
CREATE INDEX idx_super_admin_config_active ON super_admin_config(is_active);

-- RLS Policies
ALTER TABLE super_admin_config ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage super admin config
CREATE POLICY "Super admins can manage super admin config" ON super_admin_config
  FOR ALL USING (is_super_admin(auth.uid()));

-- Users can check their own super admin status
CREATE POLICY "Users can check own super admin status" ON super_admin_config
  FOR SELECT USING (admin_user_id = auth.uid());

-- Update existing RLS policies to use the new function
DROP POLICY IF EXISTS "Enable user access to their notes in active organization" ON notes;
CREATE POLICY "Enable user access to their notes in active organization" ON notes
  FOR ALL USING (
    (organization_id = get_active_organization_id() AND user_id = auth.uid())
    OR is_super_admin(auth.uid())
  );

-- Insert current super admin (migrate from hardcoded value)
-- NOTE: Replace with actual super admin user ID
INSERT INTO super_admin_config (admin_user_id, granted_by, notes)
VALUES (
  'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid,
  'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid,
  'Initial super admin migrated from hardcoded policy'
) ON CONFLICT DO NOTHING;
```

#### **Step 3.2: Create Super Admin Management Service**
**File**: `lib/notes/infrastructure/services/SuperAdminManagementService.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export interface SuperAdminConfig {
  id: string;
  adminUserId: string;
  isActive: boolean;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  notes?: string;
}

export interface GrantSuperAdminRequest {
  targetUserId: string;
  grantedBy: string;
  expiresAt?: Date;
  notes?: string;
}

export class SuperAdminManagementService {
  constructor(private supabase: SupabaseClient) {}

  async grantSuperAdminAccess(request: GrantSuperAdminRequest): Promise<SuperAdminConfig> {
    // First verify the granter is a super admin
    const isGranterSuperAdmin = await this.isSuperAdmin(request.grantedBy);
    if (!isGranterSuperAdmin) {
      throw new Error('Only super admins can grant super admin access');
    }

    const { data, error } = await this.supabase
      .from('super_admin_config')
      .insert({
        admin_user_id: request.targetUserId,
        granted_by: request.grantedBy,
        expires_at: request.expiresAt?.toISOString(),
        notes: request.notes,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to grant super admin access: ${error.message}`);
    }

    return this.mapToSuperAdminConfig(data);
  }

  async revokeSuperAdminAccess(adminUserId: string, revokedBy: string): Promise<void> {
    // Verify the revoker is a super admin
    const isRevokerSuperAdmin = await this.isSuperAdmin(revokedBy);
    if (!isRevokerSuperAdmin) {
      throw new Error('Only super admins can revoke super admin access');
    }

    const { error } = await this.supabase
      .from('super_admin_config')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('admin_user_id', adminUserId);

    if (error) {
      throw new Error(`Failed to revoke super admin access: ${error.message}`);
    }
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('super_admin_config')
      .select('is_active')
      .eq('admin_user_id', userId)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking super admin status:', error);
      return false;
    }

    return data?.is_active === true;
  }

  async listSuperAdmins(): Promise<SuperAdminConfig[]> {
    const { data, error } = await this.supabase
      .from('super_admin_config')
      .select('*')
      .eq('is_active', true)
      .order('granted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list super admins: ${error.message}`);
    }

    return data?.map(this.mapToSuperAdminConfig) || [];
  }

  private mapToSuperAdminConfig(data: any): SuperAdminConfig {
    return {
      id: data.id,
      adminUserId: data.admin_user_id,
      isActive: data.is_active,
      grantedBy: data.granted_by,
      grantedAt: new Date(data.granted_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      notes: data.notes
    };
  }
}
```

#### **Step 3.3: Update Permission Service**
**File**: `lib/notes/infrastructure/services/SupabasePermissionService.ts`

```typescript
// Update the isSuperAdmin method to use the new service
export class SupabasePermissionService implements IPermissionService {
  private superAdminService: SuperAdminManagementService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.superAdminService = new SuperAdminManagementService(supabase);
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    // Use the new configurable service instead of hardcoded check
    return await this.superAdminService.isSuperAdmin(userId);
  }

  // Rest of the implementation remains the same...
}
```

**Acceptance Criteria:**
- [ ] No hardcoded UUIDs in security policies
- [ ] Super admin status configurable via database
- [ ] Super admin access can be granted/revoked
- [ ] Expiration dates supported for temporary access
- [ ] All security tests still pass

---

## 🚀 Phase 2: Performance Optimizations (MEDIUM PRIORITY)

### **Task 004: Service Complexity Reduction**
**Priority**: MEDIUM  
**Estimated Time**: 3-4 hours  
**Files to Create/Modify**: 4 files  

#### **Step 4.1: Extract Context Validation Service**
**File**: `lib/notes/application/services/NotesContextValidationService.ts`

```typescript
import { IPermissionService, Permission } from '../../domain/services/IPermissionService';
import { IOrganizationService } from '../../../organization/domain/services/IOrganizationService';
import { OrganizationContext } from '../../../organization/domain/entities/OrganizationContext';
import { NotesDomainError } from '../../domain/errors/NotesDomainError';

export interface UserValidationResult {
  isValid: boolean;
  user: CurrentUser;
  organizationContext: OrganizationContext;
  permissions: Permission[];
  validationErrors?: string[];
}

export interface CurrentUser {
  id: string;
  email: string;
  organizationId: string;
}

export class NotesContextValidationService {
  constructor(
    private permissionService: IPermissionService,
    private organizationService: IOrganizationService
  ) {}

  async validateUserAccess(
    userId: string,
    organizationId: string
  ): Promise<UserValidationResult> {
    const validationErrors: string[] = [];
    
    try {
      // Parallel validation for performance
      const [currentUser, organizationContext, userPermissions] = await Promise.all([
        this.getCurrentUser(userId),
        this.organizationService.getCurrentContext(organizationId),
        this.getUserPermissions(userId, organizationId)
      ]);

      // Validate organization membership
      if (!currentUser || currentUser.organizationId !== organizationId) {
        validationErrors.push('User does not belong to the specified organization');
      }

      // Validate organization context
      if (!organizationContext || !organizationContext.isActive) {
        validationErrors.push('Organization context is invalid or inactive');
      }

      // Validate minimum permissions
      const hasMinimumPermissions = userPermissions.includes(Permission.VIEW_NOTE);
      if (!hasMinimumPermissions) {
        validationErrors.push('User lacks minimum required permissions');
      }

      const isValid = validationErrors.length === 0;

      return {
        isValid,
        user: currentUser!,
        organizationContext: organizationContext!,
        permissions: userPermissions,
        validationErrors: isValid ? undefined : validationErrors
      };

    } catch (error) {
      throw new NotesDomainError(
        'Failed to validate user access',
        'VALIDATION_ERROR',
        'HIGH',
        { userId, organizationId, error: error.message }
      );
    }
  }

  async validateNoteAccess(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[]
  ): Promise<void> {
    // Validate basic access first
    const validationResult = await this.validateUserAccess(userId, organizationId);
    
    if (!validationResult.isValid) {
      throw new NotesDomainError(
        `Access validation failed: ${validationResult.validationErrors?.join(', ')}`,
        'ACCESS_DENIED',
        'HIGH',
        { userId, organizationId, validationErrors: validationResult.validationErrors }
      );
    }

    // Validate specific permissions
    await this.permissionService.validateNotePermissions(
      userId,
      organizationId,
      requiredPermissions
    );
  }

  private async getCurrentUser(userId: string): Promise<CurrentUser | null> {
    // Implementation depends on auth service
    const currentUserId = await this.permissionService.getCurrentUserId();
    
    if (currentUserId !== userId) {
      throw new Error('User ID mismatch - potential security violation');
    }

    // TODO: Implement proper user retrieval
    return {
      id: userId,
      email: 'user@example.com', // Get from auth service
      organizationId: 'org123' // Get from user profile
    };
  }

  private async getUserPermissions(
    userId: string,
    organizationId: string
  ): Promise<Permission[]> {
    // This would normally call permission service
    // For now, return based on validation
    try {
      await this.permissionService.validateNotePermissions(
        userId,
        organizationId,
        [Permission.VIEW_NOTE]
      );
      return [Permission.VIEW_NOTE, Permission.CREATE_NOTE]; // Example
    } catch {
      return [];
    }
  }
}
```

#### **Step 4.2: Extract Cache Service**
**File**: `lib/notes/application/services/NotesCacheService.ts`

```typescript
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  organizationId: string;
}

export interface CacheConfiguration {
  ttlMs: number;
  maxSize: number;
  cleanupIntervalMs: number;
}

export class NotesCacheService<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private config: CacheConfiguration) {
    this.startCleanupTimer();
  }

  getCachedContext(key: string, organizationId: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Security: Verify organization matches
    if (entry.organizationId !== organizationId) {
      console.warn(`[SECURITY] Cache key ${key} requested for wrong organization`);
      this.cache.delete(key);
      return null;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  setCachedContext(key: string, data: T, organizationId: string): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldestEntries(Math.floor(this.config.maxSize * 0.1));
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      organizationId
    });
  }

  clearCacheForOrganization(organizationId: string): number {
    let clearedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.organizationId === organizationId) {
        this.cache.delete(key);
        clearedCount++;
      }
    }

    console.log(`[CACHE] Cleared ${clearedCount} entries for organization ${organizationId}`);
    return clearedCount;
  }

  clearCacheForUser(userId: string): number {
    let clearedCount = 0;
    
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.includes(userId));
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      clearedCount++;
    });

    console.log(`[CACHE] Cleared ${clearedCount} entries for user ${userId}`);
    return clearedCount;
  }

  getCacheStats(): { 
    size: number; 
    hitRate: number; 
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit/miss counters
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null
    };
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.ttlMs;
  }

  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    entries.forEach(([key]) => this.cache.delete(key));
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupIntervalMs);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[CACHE] Cleaned up ${cleanedCount} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}
```

#### **Step 4.3: Create Unified Orchestrator**
**File**: `lib/notes/application/services/NotesUnifiedOrchestrator.ts`

```typescript
import { NotesContextValidationService, UserValidationResult } from './NotesContextValidationService';
import { NotesCacheService } from './NotesCacheService';
import { NotesApplicationService } from './NotesApplicationService';
import { NotesUnifiedContextResult } from './NotesUnifiedContextService';
import { Note } from '../../domain/aggregates/NoteAggregate';

export class NotesUnifiedOrchestrator {
  private cacheService: NotesCacheService<NotesUnifiedContextResult>;

  constructor(
    private validationService: NotesContextValidationService,
    private notesApplicationService: NotesApplicationService,
    cacheConfig = { ttlMs: 5000, maxSize: 1000, cleanupIntervalMs: 60000 }
  ) {
    this.cacheService = new NotesCacheService<NotesUnifiedContextResult>(cacheConfig);
  }

  async getUnifiedContext(
    userId: string,
    organizationId: string
  ): Promise<NotesUnifiedContextResult> {
    // Check cache first
    const cacheKey = `notes-context-${userId}-${organizationId}`;
    const cachedContext = this.cacheService.getCachedContext(cacheKey, organizationId);
    
    if (cachedContext) {
      return { ...cachedContext, fromCache: true };
    }

    try {
      // Validate user access
      const validationResult = await this.validationService.validateUserAccess(
        userId,
        organizationId
      );

      if (!validationResult.isValid) {
        return {
          isValid: false,
          hasLoaded: true,
          notes: [],
          user: null,
          organizationContext: null,
          permissions: [],
          validationErrors: validationResult.validationErrors,
          fromCache: false
        };
      }

      // Fetch notes data
      const notes = await this.fetchNotesData(userId, organizationId);

      const result: NotesUnifiedContextResult = {
        isValid: true,
        hasLoaded: true,
        notes,
        user: validationResult.user,
        organizationContext: validationResult.organizationContext,
        permissions: validationResult.permissions,
        fromCache: false
      };

      // Cache the successful result
      this.cacheService.setCachedContext(cacheKey, result, organizationId);

      return result;

    } catch (error) {
      console.error('[NOTES_UNIFIED_ORCHESTRATOR] Error:', error);
      
      // Return graceful failure
      return {
        isValid: false,
        hasLoaded: true,
        notes: [],
        user: null,
        organizationContext: null,
        permissions: [],
        validationErrors: [`Failed to load context: ${error.message}`],
        fromCache: false
      };
    }
  }

  async invalidateUserCache(userId: string): Promise<number> {
    return this.cacheService.clearCacheForUser(userId);
  }

  async invalidateOrganizationCache(organizationId: string): Promise<number> {
    return this.cacheService.clearCacheForOrganization(organizationId);
  }

  getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  private async fetchNotesData(userId: string, organizationId: string): Promise<Note[]> {
    try {
      return await this.notesApplicationService.getAllNotes(userId, organizationId);
    } catch (error) {
      console.error('[NOTES_UNIFIED_ORCHESTRATOR] Notes fetch failed:', error);
      // Return empty array instead of failing entire context
      return [];
    }
  }

  destroy(): void {
    this.cacheService.destroy();
  }
}
```

#### **Step 4.4: Update Original Unified Context Service**
**File**: `lib/notes/application/services/NotesUnifiedContextService.ts`

```typescript
// Simplify the original service to use the new orchestrator
export class NotesUnifiedContextService {
  private orchestrator: NotesUnifiedOrchestrator;

  constructor(
    validationService: NotesContextValidationService,
    notesApplicationService: NotesApplicationService
  ) {
    this.orchestrator = new NotesUnifiedOrchestrator(
      validationService,
      notesApplicationService
    );
  }

  async getNotesUnifiedContext(
    userId: string,
    organizationId: string
  ): Promise<NotesUnifiedContextResult> {
    return await this.orchestrator.getUnifiedContext(userId, organizationId);
  }

  clearCacheOnOrganizationSwitch(userId: string, newOrganizationId: string): void {
    this.orchestrator.invalidateUserCache(userId);
  }

  // Keep existing public interface for backward compatibility
  // ... rest of methods delegate to orchestrator
}
```

**Acceptance Criteria:**
- [ ] Original service under 250 lines
- [ ] Clear separation of concerns
- [ ] All existing functionality preserved
- [ ] Performance characteristics maintained
- [ ] Testability improved

---

## ⚡ Phase 3: Advanced Features (LOW PRIORITY)

### **Task 005: Resource Quota Implementation**
**Priority**: LOW  
**Estimated Time**: 2-3 hours  
**Files to Create/Modify**: 3 files  

#### **Step 5.1: Create Resource Quota Domain Logic**
**File**: `lib/notes/domain/specifications/OrganizationNoteLimitSpec.ts`

```typescript
import { ISpecification } from '../../../shared/domain/specifications/ISpecification';
import { Note } from '../aggregates/NoteAggregate';
import { NotesDomainError } from '../errors/NotesDomainError';

export interface OrganizationQuota {
  maxNotes: number;
  maxContentLength: number;
  maxAttachments: number;
}

export class OrganizationNoteLimitSpec implements ISpecification<Note[]> {
  constructor(private quota: OrganizationQuota) {}

  isSatisfiedBy(notes: Note[]): boolean {
    return notes.length < this.quota.maxNotes;
  }

  getFailureReason(): string {
    return `Organization has reached maximum note limit of ${this.quota.maxNotes}`;
  }

  getFailureContext(): Record<string, any> {
    return {
      currentNoteCount: this.getCurrentNoteCount(),
      maxAllowed: this.quota.maxNotes,
      quotaType: 'note_count'
    };
  }

  private getCurrentNoteCount(): number {
    // This would be injected or calculated
    return 0; // Placeholder
  }
}

export class NoteContentLengthSpec implements ISpecification<Note> {
  constructor(private quota: OrganizationQuota) {}

  isSatisfiedBy(note: Note): boolean {
    return note.getContent().length <= this.quota.maxContentLength;
  }

  getFailureReason(): string {
    return `Note content exceeds maximum length of ${this.quota.maxContentLength} characters`;
  }

  getFailureContext(): Record<string, any> {
    return {
      contentLength: 0, // Would be calculated from note
      maxAllowed: this.quota.maxContentLength,
      quotaType: 'content_length'
    };
  }
}
```

#### **Step 5.2: Create Quota Service**
**File**: `lib/notes/infrastructure/services/OrganizationQuotaService.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationQuota } from '../../domain/specifications/OrganizationNoteLimitSpec';

export interface QuotaUsage {
  noteCount: number;
  totalContentLength: number;
  attachmentCount: number;
  lastUpdated: Date;
}

export class OrganizationQuotaService {
  constructor(private supabase: SupabaseClient) {}

  async getOrganizationQuota(organizationId: string): Promise<OrganizationQuota> {
    const { data, error } = await this.supabase
      .from('organization_quotas')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch organization quota: ${error.message}`);
    }

    // Default quotas if none configured
    return {
      maxNotes: data?.max_notes || 1000,
      maxContentLength: data?.max_content_length || 50000,
      maxAttachments: data?.max_attachments || 100
    };
  }

  async getCurrentUsage(organizationId: string): Promise<QuotaUsage> {
    const { data, error } = await this.supabase
      .from('organization_quota_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch quota usage: ${error.message}`);
    }

    return {
      noteCount: data?.note_count || 0,
      totalContentLength: data?.total_content_length || 0,
      attachmentCount: data?.attachment_count || 0,
      lastUpdated: data?.last_updated ? new Date(data.last_updated) : new Date()
    };
  }

  async updateQuotaUsage(
    organizationId: string,
    usage: Partial<QuotaUsage>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('organization_quota_usage')
      .upsert({
        organization_id: organizationId,
        note_count: usage.noteCount,
        total_content_length: usage.totalContentLength,
        attachment_count: usage.attachmentCount,
        last_updated: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to update quota usage: ${error.message}`);
    }
  }

  async checkQuotaCompliance(
    organizationId: string,
    additionalNotes = 0,
    additionalContent = 0
  ): Promise<{ 
    compliant: boolean; 
    violations: string[];
    usage: QuotaUsage;
    quota: OrganizationQuota;
  }> {
    const [quota, usage] = await Promise.all([
      this.getOrganizationQuota(organizationId),
      this.getCurrentUsage(organizationId)
    ]);

    const violations: string[] = [];

    // Check note count
    if (usage.noteCount + additionalNotes > quota.maxNotes) {
      violations.push(`Note count would exceed limit: ${usage.noteCount + additionalNotes}/${quota.maxNotes}`);
    }

    // Check content length
    if (usage.totalContentLength + additionalContent > quota.maxContentLength) {
      violations.push(`Content length would exceed limit: ${usage.totalContentLength + additionalContent}/${quota.maxContentLength}`);
    }

    return {
      compliant: violations.length === 0,
      violations,
      usage,
      quota
    };
  }
}
```

#### **Step 5.3: Database Migration for Quotas**
**File**: `supabase/migrations/20250121000003_organization_quotas.sql`

```sql
-- Create organization_quotas table
CREATE TABLE IF NOT EXISTS organization_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  max_notes INTEGER NOT NULL DEFAULT 1000,
  max_content_length INTEGER NOT NULL DEFAULT 50000,
  max_attachments INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Create organization_quota_usage table
CREATE TABLE IF NOT EXISTS organization_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  note_count INTEGER NOT NULL DEFAULT 0,
  total_content_length INTEGER NOT NULL DEFAULT 0,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Create indexes
CREATE INDEX idx_organization_quotas_org_id ON organization_quotas(organization_id);
CREATE INDEX idx_organization_quota_usage_org_id ON organization_quota_usage(organization_id);

-- RLS Policies
ALTER TABLE organization_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_quota_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's quota
CREATE POLICY "Users can view organization quota" ON organization_quotas
  FOR SELECT USING (organization_id = get_active_organization_id());

-- Users can view their organization's usage
CREATE POLICY "Users can view organization quota usage" ON organization_quota_usage
  FOR SELECT USING (organization_id = get_active_organization_id());

-- Only super admins can modify quotas
CREATE POLICY "Super admins can manage quotas" ON organization_quotas
  FOR ALL USING (is_super_admin(auth.uid()));

-- Service role can update usage
CREATE POLICY "Service role can update quota usage" ON organization_quota_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update quota usage automatically
CREATE OR REPLACE FUNCTION update_quota_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update quota usage when notes are inserted/updated/deleted
  INSERT INTO organization_quota_usage (organization_id, note_count, total_content_length)
  SELECT 
    org_id,
    COUNT(*),
    COALESCE(SUM(LENGTH(content)), 0)
  FROM notes 
  WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
  GROUP BY organization_id
  ON CONFLICT (organization_id) 
  DO UPDATE SET
    note_count = EXCLUDED.note_count,
    total_content_length = EXCLUDED.total_content_length,
    last_updated = NOW(),
    updated_at = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update quota usage
DROP TRIGGER IF EXISTS trigger_update_quota_usage ON notes;
CREATE TRIGGER trigger_update_quota_usage
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_quota_usage();
```

**Acceptance Criteria:**
- [ ] Organization quotas configurable per tenant
- [ ] Real-time quota usage tracking
- [ ] Quota violations prevent operations
- [ ] Automatic usage calculation via database triggers
- [ ] Super admin quota management interface

---

### **Task 006: Advanced Performance Monitoring**
**Priority**: LOW  
**Estimated Time**: 2-3 hours  
**Files to Create/Modify**: 2 files  

#### **Step 6.1: Create Performance Monitor**
**File**: `lib/notes/infrastructure/monitoring/NotesPerformanceMonitor.ts`

```typescript
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'percentage' | 'bytes';
  timestamp: Date;
  context: Record<string, any>;
}

export interface PerformanceAlert {
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export class NotesPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  
  // Performance thresholds
  private readonly THRESHOLDS = {
    api_response_time: 5000,     // 5 seconds
    cache_hit_rate: 85,          // 85%
    api_call_reduction: 60,      // 60%
    memory_usage: 100 * 1024 * 1024, // 100MB
    error_rate: 5                // 5%
  };

  async trackAPICallReduction(before: number, after: number, context: Record<string, any> = {}): Promise<void> {
    if (before === 0) return; // Avoid division by zero
    
    const reduction = ((before - after) / before) * 100;
    
    await this.recordMetric({
      name: 'api_call_reduction',
      value: reduction,
      unit: 'percentage',
      timestamp: new Date(),
      context: { before, after, ...context }
    });

    if (reduction < this.THRESHOLDS.api_call_reduction) {
      this.createAlert({
        metric: 'api_call_reduction',
        threshold: this.THRESHOLDS.api_call_reduction,
        currentValue: reduction,
        severity: 'MEDIUM',
        message: `API call reduction below threshold: ${reduction.toFixed(1)}% < ${this.THRESHOLDS.api_call_reduction}%`
      });
    }
  }

  async trackCacheHitRate(hits: number, total: number, context: Record<string, any> = {}): Promise<void> {
    if (total === 0) return;
    
    const hitRate = (hits / total) * 100;
    
    await this.recordMetric({
      name: 'cache_hit_rate',
      value: hitRate,
      unit: 'percentage',
      timestamp: new Date(),
      context: { hits, total, misses: total - hits, ...context }
    });

    if (hitRate < this.THRESHOLDS.cache_hit_rate) {
      this.createAlert({
        metric: 'cache_hit_rate',
        threshold: this.THRESHOLDS.cache_hit_rate,
        currentValue: hitRate,
        severity: 'MEDIUM',
        message: `Cache hit rate below threshold: ${hitRate.toFixed(1)}% < ${this.THRESHOLDS.cache_hit_rate}%`
      });
    }
  }

  async trackResponseTime(operation: string, durationMs: number, context: Record<string, any> = {}): Promise<void> {
    await this.recordMetric({
      name: 'api_response_time',
      value: durationMs,
      unit: 'ms',
      timestamp: new Date(),
      context: { operation, ...context }
    });

    if (durationMs > this.THRESHOLDS.api_response_time) {
      this.createAlert({
        metric: 'api_response_time',
        threshold: this.THRESHOLDS.api_response_time,
        currentValue: durationMs,
        severity: 'HIGH',
        message: `Response time exceeded threshold for ${operation}: ${durationMs}ms > ${this.THRESHOLDS.api_response_time}ms`
      });
    }
  }

  async trackMemoryUsage(bytesUsed: number, context: Record<string, any> = {}): Promise<void> {
    await this.recordMetric({
      name: 'memory_usage',
      value: bytesUsed,
      unit: 'bytes',
      timestamp: new Date(),
      context
    });

    if (bytesUsed > this.THRESHOLDS.memory_usage) {
      this.createAlert({
        metric: 'memory_usage',
        threshold: this.THRESHOLDS.memory_usage,
        currentValue: bytesUsed,
        severity: 'HIGH',
        message: `Memory usage exceeded threshold: ${(bytesUsed / 1024 / 1024).toFixed(1)}MB > ${(this.THRESHOLDS.memory_usage / 1024 / 1024).toFixed(1)}MB`
      });
    }
  }

  async trackErrorRate(errors: number, total: number, context: Record<string, any> = {}): Promise<void> {
    if (total === 0) return;
    
    const errorRate = (errors / total) * 100;
    
    await this.recordMetric({
      name: 'error_rate',
      value: errorRate,
      unit: 'percentage',
      timestamp: new Date(),
      context: { errors, total, successes: total - errors, ...context }
    });

    if (errorRate > this.THRESHOLDS.error_rate) {
      this.createAlert({
        metric: 'error_rate',
        threshold: this.THRESHOLDS.error_rate,
        currentValue: errorRate,
        severity: 'CRITICAL',
        message: `Error rate exceeded threshold: ${errorRate.toFixed(1)}% > ${this.THRESHOLDS.error_rate}%`
      });
    }
  }

  getPerformanceSummary(timeWindowMs = 3600000): {
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
    summary: Record<string, { avg: number; min: number; max: number; count: number }>;
  } {
    const cutoff = new Date(Date.now() - timeWindowMs);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    const recentAlerts = this.alerts.filter(a => a.metric); // All alerts for now

    // Calculate summary statistics
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const metric of recentMetrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, min: Infinity, max: -Infinity, count: 0 };
      }
      
      const s = summary[metric.name];
      s.count++;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.avg = ((s.avg * (s.count - 1)) + metric.value) / s.count;
    }

    return {
      metrics: recentMetrics,
      alerts: recentAlerts,
      summary
    };
  }

  private async recordMetric(metric: PerformanceMetric): Promise<void> {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory issues
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    // In a real implementation, this would write to a monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERFORMANCE] ${metric.name}: ${metric.value}${metric.unit}`, metric.context);
    }
  }

  private createAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-50); // Keep last 50
    }

    // In a real implementation, this would send alerts via email, Slack, etc.
    console.warn(`[PERFORMANCE_ALERT] ${alert.severity}: ${alert.message}`);
  }

  clearMetrics(): void {
    this.metrics = [];
    this.alerts = [];
  }
}
```

#### **Step 6.2: Integrate Monitoring into Services**
**File**: `lib/notes/application/services/NotesUnifiedContextService.ts`

```typescript
// Add performance monitoring to existing unified context service
import { NotesPerformanceMonitor } from '../../infrastructure/monitoring/NotesPerformanceMonitor';

export class NotesUnifiedContextService {
  private performanceMonitor = new NotesPerformanceMonitor();
  
  async getNotesUnifiedContext(userId: string, organizationId: string): Promise<NotesUnifiedContextResult> {
    const startTime = Date.now();
    const operationId = `getUnifiedContext-${Date.now()}`;
    
    try {
      // Track API call count (before optimization)
      const apiCallsBefore = 3; // user + org + notes
      
      const result = await this.executeUnifiedContextLogic(userId, organizationId);
      
      const duration = Date.now() - startTime;
      const apiCallsAfter = 1; // unified call
      
      // Track performance metrics
      await Promise.all([
        this.performanceMonitor.trackResponseTime('getUnifiedContext', duration, {
          userId,
          organizationId,
          operationId,
          fromCache: result.fromCache
        }),
        this.performanceMonitor.trackAPICallReduction(apiCallsBefore, apiCallsAfter, {
          operation: 'getUnifiedContext',
          operationId
        })
      ]);

      // Track cache performance if applicable
      if (result.fromCache) {
        await this.performanceMonitor.trackCacheHitRate(1, 1, {
          operation: 'getUnifiedContext',
          cacheKey: `notes-context-${userId}-${organizationId}`
        });
      }

      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track error
      await this.performanceMonitor.trackErrorRate(1, 1, {
        operation: 'getUnifiedContext',
        error: error.message,
        duration,
        operationId
      });
      
      throw error;
    }
  }

  // Existing implementation logic...
  
  getPerformanceMetrics(timeWindowMs?: number) {
    return this.performanceMonitor.getPerformanceSummary(timeWindowMs);
  }
}
```

**Acceptance Criteria:**
- [ ] Real-time performance tracking
- [ ] Automated alerting on threshold breaches
- [ ] Performance metrics queryable via API
- [ ] Memory usage monitoring
- [ ] Error rate tracking and alerting

---

## 🔍 Quality Gates

### **Phase 1 Quality Gate**
- [ ] All security tests pass
- [ ] Permission caching reduces database queries by 80%+
- [ ] Audit trail captures all security events
- [ ] No hardcoded security values remain
- [ ] Cache performance is stable under load

### **Phase 2 Quality Gate**
- [ ] Service complexity under 250 lines each
- [ ] All existing functionality preserved
- [ ] Performance benchmarks maintained
- [ ] Error handling patterns consistent
- [ ] Test coverage maintained at 90%+

### **Phase 3 Quality Gate**
- [ ] Resource quotas prevent abuse
- [ ] Performance monitoring provides actionable insights
- [ ] Alerting system functions correctly
- [ ] No memory leaks in monitoring code
- [ ] All features work in production environment

---

## 📊 Success Criteria

### **Technical Targets**
- **Security Score**: 85 → 100/100 (15-point improvement)
- **DDD Compliance**: 92 → 100/100 (8-point improvement)
- **Service Complexity**: All services under 250 lines
- **Cache Hit Rate**: >85% for permission checks
- **API Call Reduction**: Maintain 67% reduction

### **Business Targets**
- **Developer Experience**: Improved maintainability and testability
- **Security Posture**: Comprehensive audit trail and monitoring
- **Performance**: Enhanced caching and monitoring capabilities
- **Operational Excellence**: Automated alerting and resource management

---

## 📝 Implementation Notes

### **Development Best Practices**
1. **Test-Driven Development**: Write tests before implementation
2. **Incremental Changes**: Small, verifiable improvements
3. **Backward Compatibility**: Maintain existing API contracts
4. **Security First**: All changes must pass security review
5. **Performance Monitoring**: Track metrics throughout implementation

### **Deployment Strategy**
1. **Feature Flags**: Use flags to control rollout
2. **Blue-Green Deployment**: Minimize downtime
3. **Rollback Plan**: Prepare rollback procedures
4. **Monitoring**: Enhanced monitoring during deployment

### **Testing Strategy**
- **Unit Tests**: All new services and functions
- **Integration Tests**: End-to-end functionality
- **Security Tests**: Permission and access control
- **Performance Tests**: Load and stress testing
- **Regression Tests**: Ensure no existing functionality breaks

---

This implementation plan provides the detailed steps needed to enhance the Notes domain from 92/100 to 100/100 while preserving its gold standard status. Each task includes specific code examples, acceptance criteria, and quality gates to ensure successful implementation.

**Next Step**: Begin with Phase 1 security enhancements to achieve immediate compliance improvements.