/**
 * Organization Application Service
 * 
 * AI INSTRUCTIONS:
 * - Coordinate use cases and handle UI concerns
 * - Contains switchToOrganization logic from original service
 * - Keep under 250 lines following @golden-rule
 * - Delegate business logic to domain service
 */

import { createClient } from '@/lib/supabase/client';
import { Organization } from '../../domain/value-objects/Organization';
import { OrganizationRepository } from '../../infrastructure/persistence/supabase/OrganizationRepository';
import { GetUserOrganizationsUseCase } from '../use-cases/GetUserOrganizationsUseCase';
import { UserProfile } from '../../domain/services/OrganizationDomainService';

export class OrganizationApplicationService {
  private supabase = createClient();
  private organizationRepository = new OrganizationRepository();
  private getUserOrganizationsUseCase = new GetUserOrganizationsUseCase(this.organizationRepository);

  /**
   * Get organizations for a user
   */
  async getUserOrganizations(profile: UserProfile): Promise<Organization[]> {
    return this.getUserOrganizationsUseCase.execute(profile);
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    return this.organizationRepository.getOrganizationById(organizationId);
  }

  /**
   * Switch to a specific organization
   * NOTE: This contains UI logic that should ideally be in presentation layer
   * but keeping it here for now to match original functionality
   */
  async switchToOrganization(organizationId: string): Promise<void> {
    const { data: { user }, error: getUserError } = await this.supabase.auth.getUser();
    
    if (getUserError || !user) {
      console.error('User authentication failed:', getUserError);
      throw new Error('User not authenticated');
    }

    // Show initial progress notification
    this.showProgressNotification('Switching Organization', 'Updating permissions...');

    try {
      // Call the Edge Function to properly handle organization switching
      const { data, error } = await this.supabase.functions.invoke('switch-organization', {
        body: {
          organization_id: organizationId
        }
      });

      if (error) {
        console.error('Edge Function failed:', error);
        throw new Error(`Failed to switch organization: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Edge Function returned error:', data?.message);
        throw new Error(`Failed to switch organization: ${data?.message || 'Unknown error'}`);
      }

      // ✅ SIMPLE & RELIABLE: Page refresh handles all cache invalidation
      // No need for complex cache clearing - fresh page = fresh everything
      // This is more reliable than trying to coordinate multiple cache systems
      
      console.log(`[ORG_SWITCH] Organization switch successful: ${organizationId}`);

      // Store in localStorage for immediate UI feedback
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_organization_id', organizationId);
        
        // Store success info to show toast after refresh
        const targetOrg = await this.getOrganizationById(organizationId);
        if (targetOrg) {
          localStorage.setItem('org_switch_success', JSON.stringify({
            organizationId,
            organizationName: targetOrg.name,
            timestamp: Date.now()
          }));
        }
      }

      this.showSuccessNotification('Organization Updated', 'Refreshing interface...');
      
      // Refresh session and page
      await this.refreshSessionAndPage(organizationId);

    } catch (error: unknown) {
      console.error('Error switching organization:', error);
      
      this.showErrorNotification('Switch Failed', 'Please try again');
      
      // Fallback to localStorage and direct metadata update
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_organization_id', organizationId);
      }

      // Try direct user metadata update as last resort
      try {
        await this.supabase.auth.updateUser({
          data: { active_organization_id: organizationId }
        });
      } catch (directError) {
        console.error('Direct update error:', directError);
      }
      
      throw error;
    }
  }

  /**
   * Show progress notification to user
   */
  private showProgressNotification(title: string, description: string): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('showNotification', {
        detail: {
          type: 'info',
          title,
          description,
          duration: 2000
        }
      });
      window.dispatchEvent(event);
    }
  }

  private showSuccessNotification(title: string, message: string): void {
    if (typeof window === 'undefined') return;

    const progressToast = document.getElementById('org-switch-progress');
    if (progressToast) {
      progressToast.innerHTML = this.createNotificationHTML(title, message, 'success');
    }
  }

  private showErrorNotification(title: string, message: string): void {
    if (typeof window === 'undefined') return;

    const progressToast = document.getElementById('org-switch-progress');
    if (progressToast) {
      progressToast.innerHTML = this.createNotificationHTML(title, message, 'error');
      
      // Remove error notification after 3 seconds
      setTimeout(() => {
        const errorToast = document.getElementById('org-switch-progress');
        if (errorToast) errorToast.remove();
      }, 3000);
    }
  }

  private createNotificationHTML(title: string, message: string, type: 'progress' | 'success' | 'error'): string {
    const colors = {
      progress: { border: '#e2e8f0', icon: 'spinner', iconColor: '#3b82f6' },
      success: { border: '#10b981', icon: '✓', iconColor: '#10b981' },
      error: { border: '#ef4444', icon: '!', iconColor: '#ef4444' }
    };

    const color = colors[type];
    const spinnerStyle = type === 'progress' ? `
      width: 20px; 
      height: 20px; 
      border: 2px solid #e2e8f0; 
      border-top: 2px solid #3b82f6; 
      border-radius: 50%; 
      animation: spin 1s linear infinite;
    ` : `
      width: 20px; 
      height: 20px; 
      background: ${color.iconColor}; 
      border-radius: 50%; 
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    `;

    return `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: white; 
        border: 1px solid ${color.border}; 
        border-radius: 8px; 
        padding: 16px 20px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        min-width: 280px;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <div style="${spinnerStyle}">${type === 'progress' ? '' : color.icon}</div>
        <div>
          <div style="font-weight: 500; color: #1f2937;">${title}</div>
          <div style="color: #6b7280; font-size: 13px;">${message}</div>
        </div>
      </div>
      ${type === 'progress' ? `
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      ` : ''}
    `;
  }

  private async refreshSessionAndPage(organizationId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // Security validation: Ensure organizationId is provided for session refresh
    if (!organizationId) {
      throw new Error('Organization ID required for secure session refresh');
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session refresh timeout')), 5000);
      });
      
      const refreshPromise = this.supabase.auth.refreshSession();
      
      try {
        await Promise.race([refreshPromise, timeoutPromise]);
      } catch {
        // Force page refresh as fallback
        window.location.reload();
        return;
      }
      
      // Refresh the page with the new session
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error: unknown) {
      console.error('Unexpected error in session refresh:', error);
      // Fallback to logout if anything goes wrong
      await this.supabase.auth.signOut();
      window.location.href = '/login';
    }
  }
} 