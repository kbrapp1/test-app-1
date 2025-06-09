import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/auth';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  feature_flags?: Record<string, boolean>;
}

/**
 * Organization Service - Infrastructure Layer
 * 
 * Single Responsibility: Handle all organization data operations
 * Encapsulates Supabase operations for organizations
 */
export class OrganizationService {
  private supabase = createClient();

  /**
   * Fetch organizations based on user permissions
   * Super admins get all organizations, regular users get their memberships
   */
  async getUserOrganizations(profile: Profile): Promise<Organization[]> {
    if (profile.is_super_admin) {
      return this.getAllOrganizations();
    }
    return this.getUserMembershipOrganizations(profile.id);
  }

  /**
   * Fetch all organizations (super admin only)
   */
  private async getAllOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch organizations for a specific user based on memberships
   */
  private async getUserMembershipOrganizations(userId: string): Promise<Organization[]> {
    const { data: memberships, error: membershipError } = await this.supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', userId);

    if (membershipError) throw membershipError;

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const orgIds = memberships.map(m => m.organization_id);
    const { data: organizations, error: orgsError } = await this.supabase
      .from('organizations')
      .select('id, name, slug')
      .in('id', orgIds)
      .order('name');

    if (orgsError) throw orgsError;
    return organizations || [];
  }

  /**
   * Switch to a specific organization by updating user's metadata and refreshing session
   */
  async switchToOrganization(organizationId: string): Promise<void> {
    const { data: { user }, error: getUserError } = await this.supabase.auth.getUser();
    
    if (getUserError || !user) {
      console.error('User authentication failed:', getUserError);
      throw new Error('User not authenticated');
    }

    // Show initial progress notification
    if (typeof window !== 'undefined') {
      const progressToast = document.createElement('div');
      progressToast.id = 'org-switch-progress';
      progressToast.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: white; 
          border: 1px solid #e2e8f0; 
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
          <div style="
            width: 20px; 
            height: 20px; 
            border: 2px solid #e2e8f0; 
            border-top: 2px solid #3b82f6; 
            border-radius: 50%; 
            animation: spin 1s linear infinite;
          "></div>
          <div>
            <div style="font-weight: 500; color: #1f2937;">Switching Organization</div>
            <div style="color: #6b7280; font-size: 13px;">Updating permissions...</div>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(progressToast);
    }

    try {
      // Call the Edge Function to properly handle organization switching
      const { data, error } = await this.supabase.functions.invoke('switch-organization', {
        body: {
          organization_id: organizationId
        }
      });

      if (error) {
        console.error('Edge Function failed:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to switch organization: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Edge Function returned error:', data?.message);
        throw new Error(`Failed to switch organization: ${data?.message || 'Unknown error'}`);
      }

      // Update progress notification
      if (typeof window !== 'undefined') {
        const progressToast = document.getElementById('org-switch-progress');
        if (progressToast) {
          progressToast.innerHTML = `
            <div style="
              position: fixed; 
              top: 20px; 
              right: 20px; 
              background: white; 
              border: 1px solid #10b981; 
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
              <div style="
                width: 20px; 
                height: 20px; 
                background: #10b981; 
                border-radius: 50%; 
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
              ">✓</div>
              <div>
                <div style="font-weight: 500; color: #1f2937;">Organization Updated</div>
                <div style="color: #6b7280; font-size: 13px;">Refreshing interface...</div>
              </div>
            </div>
          `;
        }
      }

      // Also store in localStorage for immediate UI feedback
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_organization_id', organizationId);
        
        // Store success info to show toast after refresh
        const targetOrgName = await this.getOrganizationById(organizationId);
        if (targetOrgName) {
          localStorage.setItem('org_switch_success', JSON.stringify({
            organizationId,
            organizationName: targetOrgName.name,
            timestamp: Date.now()
          }));
        }
      }

    } catch (error: any) {
      console.error('Error calling Edge Function:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Update progress notification to show error
      if (typeof window !== 'undefined') {
        const progressToast = document.getElementById('org-switch-progress');
        if (progressToast) {
          progressToast.innerHTML = `
            <div style="
              position: fixed; 
              top: 20px; 
              right: 20px; 
              background: white; 
              border: 1px solid #ef4444; 
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
              <div style="
                width: 20px; 
                height: 20px; 
                background: #ef4444; 
                border-radius: 50%; 
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
              ">!</div>
              <div>
                <div style="font-weight: 500; color: #1f2937;">Switch Failed</div>
                <div style="color: #6b7280; font-size: 13px;">Please try again</div>
              </div>
            </div>
          `;
          
          // Remove error notification after 3 seconds
          setTimeout(() => {
            const errorToast = document.getElementById('org-switch-progress');
            if (errorToast) errorToast.remove();
          }, 3000);
        }
      }
      
      // Fallback to localStorage and direct metadata update
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_organization_id', organizationId);
      }

      // Try direct user metadata update as last resort
      try {
        const { error: directUpdateError } = await this.supabase.auth.updateUser({
          data: {
            active_organization_id: organizationId
          }
        });

        if (directUpdateError) {
          console.error('Direct update also failed:', directUpdateError);
        }
      } catch (directError) {
        console.error('Direct update error:', directError);
      }
      
      throw error; // Re-throw to let caller handle
    }

    // Since Edge Function succeeded, force session refresh to get fresh JWT with updated claims
    // Page refresh alone doesn't refresh the session - we need to force it
    if (typeof window !== 'undefined') {
      // Store success info to show toast after refresh
      const targetOrgName = await this.getOrganizationById(organizationId);
      if (targetOrgName) {
        localStorage.setItem('org_switch_success', JSON.stringify({
          organizationId,
          organizationName: targetOrgName.name,
          timestamp: Date.now()
        }));
      }
      
      // Show quick success message
      const progressToast = document.getElementById('org-switch-progress');
      if (progressToast) {
        progressToast.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: white; 
            border: 1px solid #10b981; 
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
            <div style="
              width: 20px; 
              height: 20px; 
              background: #10b981; 
              border-radius: 50%; 
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 12px;
            ">✓</div>
            <div>
              <div style="font-weight: 500; color: #1f2937;">Organization Switched</div>
              <div style="color: #6b7280; font-size: 13px;">Updating session...</div>
            </div>
          </div>
        `;
      }
      
      try {
        // Create a timeout promise to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session refresh timeout')), 5000); // 5 second timeout
        });
        
        // Race the session refresh against the timeout
        const refreshPromise = this.supabase.auth.refreshSession();
        
        let refreshResult;
        try {
          refreshResult = await Promise.race([
            refreshPromise,
            timeoutPromise
          ]);
        } catch (timeoutError: any) {
          console.log('Session refresh timed out after 5 seconds - this is a known Supabase issue');
          console.log('Session refresh timed out, but Edge Function succeeded - refreshing page instead...');
          
          // Update progress to show success and page refresh
          const progressToast = document.getElementById('org-switch-progress');
          if (progressToast) {
            progressToast.innerHTML = `
              <div style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                background: white; 
                border: 1px solid #10b981; 
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
                <div style="
                  width: 20px; 
                  height: 20px; 
                  background: #10b981; 
                  border-radius: 50%; 
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 12px;
                ">✓</div>
                <div>
                  <div style="font-weight: 500; color: #1f2937;">Organization Switched</div>
                  <div style="color: #6b7280; font-size: 13px;">Refreshing interface...</div>
                </div>
              </div>
            `;
          }
          
          // Store flag for post-refresh success toast
          localStorage.setItem('org_switch_post_login', JSON.stringify({
            organizationId,
            timestamp: Date.now()
          }));
          
          // Just refresh the page - the auth hook will provide the updated JWT
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return;
        }
        
        const { data, error } = refreshResult as any;
        
        if (error) {
          console.error('Session refresh failed:', error);
          // Fallback to complete session reset - this guarantees a fresh session
          console.log('Session refresh failed, forcing complete session reset...');
          
          // Update progress to show we're resetting session
          if (progressToast) {
            progressToast.innerHTML = `
              <div style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                background: white; 
                border: 1px solid #f59e0b; 
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
                <div style="
                  width: 20px; 
                  height: 20px; 
                  background: #f59e0b; 
                  border-radius: 50%; 
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 12px;
                ">⟳</div>
                <div>
                  <div style="font-weight: 500; color: #1f2937;">Resetting Session</div>
                  <div style="color: #6b7280; font-size: 13px;">Please login again...</div>
                </div>
              </div>
            `;
          }
          
          // Store flag for post-login redirect
          localStorage.setItem('org_switch_post_login', JSON.stringify({
            organizationId,
            timestamp: Date.now()
          }));
          
          // Force complete logout and redirect to login
          await this.supabase.auth.signOut();
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return;
        }
        
        // Update progress message
        if (progressToast) {
          progressToast.innerHTML = `
            <div style="
              position: fixed; 
              top: 20px; 
              right: 20px; 
              background: white; 
              border: 1px solid #10b981; 
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
              <div style="
                width: 20px; 
                height: 20px; 
                background: #10b981; 
                border-radius: 50%; 
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
              ">✓</div>
              <div>
                <div style="font-weight: 500; color: #1f2937;">Session Updated</div>
                <div style="color: #6b7280; font-size: 13px;">Refreshing interface...</div>
              </div>
            </div>
          `;
        }
        
        // Now refresh the page with the new session
        setTimeout(() => {
          window.location.reload();
        }, 500); // Small delay to show the success message
        
        return;
        
      } catch (error: any) {
        console.error('Unexpected error in session refresh logic:', error);
        // If anything else goes wrong, fall back to logout
        await this.supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }
    }
  }

  /**
   * Get the organization details by ID
   */
  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }

    return data;
  }
}

export const organizationService = new OrganizationService(); 