'use client';

import React from 'react';
import { useUserProfile } from '@/lib/auth/providers/UserProfileProvider';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';

interface PerformanceMonitorGateProps {
  metrics: PerformanceMetrics;
  className?: string;
  allowedEnvironments?: ('development' | 'staging' | 'production')[];
  requireSuperAdmin?: boolean;
  isOpen?: boolean;
  autoRefresh?: boolean;
}

export const PerformanceMonitorGate: React.FC<PerformanceMonitorGateProps> = ({
  metrics,
  className,
  allowedEnvironments = ['development', 'staging'],
  requireSuperAdmin = false,
  isOpen = false,
  autoRefresh = true
}) => {
  const { profile } = useUserProfile();
  
  // Environment check
  const currentEnv = process.env.NODE_ENV as 'development' | 'staging' | 'production';
  const isAllowedEnvironment = allowedEnvironments.includes(currentEnv);
  
  // Access control logic
  const hasAccess = (() => {
    if (!profile) return false;
    
    // In production, always require super admin
    if (currentEnv === 'production') {
      return isSuperAdmin(profile);
    }
    
    // In development/staging, check requireSuperAdmin flag
    if (requireSuperAdmin) {
      return isSuperAdmin(profile);
    }
    
    // In non-production environments, allow access by default
    return true;
  })();
  
  // Gate logic
  if (!isAllowedEnvironment || !hasAccess) {
    return null; // Hide component completely
  }
  
  return (
    <PerformanceMonitor 
      metrics={metrics} 
      className={className}
      isOpen={isOpen}
      autoRefresh={autoRefresh}
    />
  );
}; 