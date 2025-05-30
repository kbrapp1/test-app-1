'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Users, Shield, Clock, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { 
  OrganizationProvider, 
  useOrganization, 
  useOrganizationOptions
} from '@/lib/organization/application/providers/OrganizationProvider';

import {
  OrganizationSwitcher,
  OrganizationDisplay,
  OrganizationGuard
} from '@/lib/organization/presentation/components/OrganizationSwitcher';

// Demo components that use the new application layer
function OrganizationContextDemo() {
  const {
    currentContext,
    activeOrganizationId,
    accessibleOrganizations,
    isLoading,
    isSwitching,
    error,
    refreshContext,
    clearContext,
    checkAccess
  } = useOrganization();

  const { options } = useOrganizationOptions();
  const [accessCheckResult, setAccessCheckResult] = useState<{ orgId: string; hasAccess: boolean } | null>(null);

  const handleCheckAccess = async () => {
    if (options.length > 0) {
      const orgId = options[0].id;
      const hasAccess = await checkAccess(orgId);
      setAccessCheckResult({ orgId, hasAccess });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Organization Switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Context Demo
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshContext}
                size="sm"
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <OrganizationSwitcher />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Context */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Current Context
              </h3>
              <div className="p-3 bg-muted rounded-md space-y-2 text-sm">
                <div>
                  <strong>Active Organization:</strong>{' '}
                  {activeOrganizationId ? (
                    <Badge variant="default">{activeOrganizationId}</Badge>
                  ) : (
                    <Badge variant="secondary">None</Badge>
                  )}
                </div>
                {currentContext?.last_accessed_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <strong>Last Accessed:</strong>{' '}
                    {new Date(currentContext.last_accessed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Organization Display */}
            <div className="space-y-3">
              <h3 className="font-semibold">Organization Display Component</h3>
              <div className="p-3 border rounded-md">
                <OrganizationDisplay showRole={true} />
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {isLoading && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              Loading organization data...
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              Error: {error}
            </div>
          )}
          {isSwitching && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              Switching organization...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accessible Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Accessible Organizations ({accessibleOrganizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {options.map((option) => (
              <Card key={option.id} className={option.isActive ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{option.name}</h4>
                      {option.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      Role: {option.role}
                    </p>
                    <div className="text-xs text-muted-foreground font-mono">
                      {option.id}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Organization Guard Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Guard Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Guard: Requires Any Organization</h4>
            <OrganizationGuard fallback={<div className="p-3 bg-red-50 border border-red-200 rounded-md">❌ No organization access</div>}>
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                ✅ You have organization access!
              </div>
            </OrganizationGuard>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Guard: Requires Specific Organization (First Available)</h4>
            {options.length > 0 && (
              <OrganizationGuard 
                requiredOrganization={options[0].id}
                fallback={<div className="p-3 bg-red-50 border border-red-200 rounded-md">❌ No access to {options[0].name}</div>}
              >
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  ✅ You have access to {options[0].name}!
                </div>
              </OrganizationGuard>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={clearContext}
              variant="destructive"
              size="sm"
              disabled={isLoading || !activeOrganizationId}
            >
              Clear Context
            </Button>
            <Button
              onClick={handleCheckAccess}
              variant="outline"
              size="sm"
              disabled={isLoading || options.length === 0}
            >
              Check Access (First Org)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Access Check Result */}
      {accessCheckResult && (
        <Card>
          <CardHeader>
            <CardTitle>Access Check Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-md space-y-2 text-sm">
              <div>
                <strong>Organization:</strong>{' '}
                {accessCheckResult.orgId}
              </div>
              <div>
                <strong>Access:</strong>{' '}
                {accessCheckResult.hasAccess ? '✅ Access Granted' : '❌ Access Denied'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading organization context...</p>
      </div>
    </div>
  );
}

// Main page component
export default function TestOrganizationContextPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🏢 Organization Context Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Testing the new React hooks, context providers, and UI components for organization management.
        </p>
      </div>

      <OrganizationContextDemo />
    </div>
  );
} 