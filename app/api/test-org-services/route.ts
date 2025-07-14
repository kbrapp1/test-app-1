import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OrganizationContextService } from '@/lib/organization/domain/services/OrganizationContextService';
import { PermissionValidationService } from '@/lib/organization/domain/services/PermissionValidationService';
import { AuditTrailService } from '@/lib/organization/domain/services/AuditTrailService';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contextService = new OrganizationContextService();
    const permissionService = new PermissionValidationService();
    const _auditService = new AuditTrailService();

    // Run all service tests
    const results = {
      user_id: user.id,
      user_email: user.email,
      tests: {} as any
    };

    try {
      results.tests.getCurrentContext = await contextService.getCurrentContext();
    } catch (error: any) {
      results.tests.getCurrentContext = { error: error.message, code: error.code };
    }

    try {
      results.tests.getAccessibleOrganizations = await permissionService.getUserAccessibleOrganizations();
    } catch (error: any) {
      results.tests.getAccessibleOrganizations = { error: error.message, code: error.code };
    }

    try {
      results.tests.getActiveOrganizationId = await permissionService.getActiveOrganizationId();
    } catch (error: any) {
      results.tests.getActiveOrganizationId = { error: error.message, code: error.code };
    }

    try {
      results.tests.getAuditSummary = await _auditService.getAuditSummary();
    } catch (error: any) {
      results.tests.getAuditSummary = { error: error.message, code: error.code };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, organizationId } = await request.json();
    
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contextService = new OrganizationContextService();
    const permissionService = new PermissionValidationService();
    const auditService = new AuditTrailService();

    let result: any;

    switch (action) {
      case 'hasAccess':
        if (!organizationId) {
          return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
        }
        result = await permissionService.hasOrganizationAccess(organizationId);
        break;

      case 'switchOrganization':
        if (!organizationId) {
          return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
        }
        await contextService.switchOrganization(organizationId);
        result = { success: true, message: 'Organization switched successfully' };
        break;

      case 'clearContext':
        await contextService.clearContext();
        result = { success: true, message: 'Context cleared successfully' };
        break;

      case 'updateLastAccessed':
        await contextService.updateLastAccessed();
        result = { success: true, message: 'Last accessed updated successfully' };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error('Test API POST error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        code: error.code 
      },
      { status: 500 }
    );
  }
} 