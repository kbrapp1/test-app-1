'use client';

import { useAuthWithSuperAdmin } from '@/lib/auth/super-admin';
import { GenericNetworkMonitorUI } from '@/lib/monitoring/components/GenericNetworkMonitorUI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield } from 'lucide-react';

/**
 * Network Monitor Page - Super Admin Only
 * 
 * Provides universal network monitoring for all HTTP requests
 * Accessible only to super administrators for system monitoring
 */

export default function NetworkMonitorPage() {
  const { isSuperAdmin, loading } = useAuthWithSuperAdmin();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Access denied for non-super admins
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              This page is restricted to super administrators only.
            </p>
            <Badge variant="secondary" className="mx-auto">
              Super Admin Required
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Super admin access granted
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Network Monitor</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Super Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Universal network request monitoring and redundancy detection
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What This Monitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Network Request Types</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Server Actions (Next.js)</li>
                <li>• API Route calls (/api/*)</li>
                <li>• Fetch requests</li>
                <li>• XMLHttpRequest calls</li>
                <li>• External API calls</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Detection Capabilities</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Redundant call patterns</li>
                <li>• Rapid-fire requests</li>
                <li>• Performance statistics</li>
                <li>• Real-time monitoring</li>
                <li>• Call timing analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitor - Full page embedded */}
      <div className="relative">
        <GenericNetworkMonitorUI isFullPage={true} />
      </div>
    </div>
  );
} 