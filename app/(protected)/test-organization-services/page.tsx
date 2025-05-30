'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OrganizationContextService } from '@/lib/organization/domain/services/OrganizationContextService';
import { PermissionValidationService } from '@/lib/organization/domain/services/PermissionValidationService';
import { AuditTrailService } from '@/lib/organization/domain/services/AuditTrailService';

export default function TestOrganizationServicesPage() {
  const [results, setResults] = useState<Record<string, { success: boolean; data?: any; error?: string; code?: string }>>({});
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const contextService = new OrganizationContextService();
  const permissionService = new PermissionValidationService();
  const auditService = new AuditTrailService();

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName);
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
    } catch (error: any) {
      setResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error.message,
          code: error.code 
        } 
      }));
    } finally {
      setLoading(null);
    }
  };

  const tests = [
    {
      name: 'getCurrentContext',
      label: 'Get Current Context',
      fn: () => contextService.getCurrentContext()
    },
    {
      name: 'getAccessibleOrgs',
      label: 'Get Accessible Organizations',
      fn: () => permissionService.getUserAccessibleOrganizations()
    },
    {
      name: 'getActiveOrgId',
      label: 'Get Active Organization ID',
      fn: () => permissionService.getActiveOrganizationId()
    },
    {
      name: 'hasAccess',
      label: `Check Access to Org: ${orgId}`,
      fn: () => orgId ? permissionService.hasOrganizationAccess(orgId) : Promise.reject(new Error('Enter org ID first')),
      requiresOrgId: true
    },
    {
      name: 'switchOrg',
      label: `Switch to Org: ${orgId}`,
      fn: () => orgId ? contextService.switchOrganization(orgId) : Promise.reject(new Error('Enter org ID first')),
      requiresOrgId: true
    },
    {
      name: 'updateLastAccessed',
      label: 'Update Last Accessed',
      fn: () => contextService.updateLastAccessed()
    },
    {
      name: 'getAuditTrail',
      label: 'Get Recent Audit Trail',
      fn: () => auditService.getAuditTrail({ limit: 5 })
    },
    {
      name: 'getAuditSummary',
      label: 'Get Audit Summary',
      fn: () => auditService.getAuditSummary()
    },
    {
      name: 'clearContext',
      label: 'Clear Context',
      fn: () => contextService.clearContext()
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Organization Services Manual Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="orgId" className="text-sm font-medium">
              Organization ID (for tests that require it):
            </label>
            <Input
              id="orgId"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="Enter organization ID to test..."
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tests.map((test) => (
              <Button
                key={test.name}
                onClick={() => runTest(test.name, test.fn)}
                disabled={loading !== null || (test.requiresOrgId && !orgId)}
                variant={results[test.name]?.success === true ? 'default' : 
                        results[test.name]?.success === false ? 'destructive' : 'outline'}
                className="h-auto py-3 text-wrap"
              >
                {loading === test.name ? '⏳ Running...' : test.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(results).map(([testName, result]: [string, any]) => (
          <Card key={testName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? '✅' : '❌'} {testName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>💡 Testing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Get Accessible Organizations first</strong> - This will show you what org IDs you can use</p>
          <p><strong>2. Copy an org ID</strong> - Paste it into the input field above</p>
          <p><strong>3. Test has access</strong> - Verify you can access the organization</p>
          <p><strong>4. Switch organization</strong> - Change your active organization</p>
          <p><strong>5. Check audit trail</strong> - See the logged activities</p>
          <p><strong>Note:</strong> Some tests may fail initially if you don't have organization permissions set up yet.</p>
        </CardContent>
      </Card>
    </div>
  );
} 