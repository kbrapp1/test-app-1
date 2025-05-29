import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - Deno Edge Function module resolution
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SwitchOrganizationRequest {
  organization_id: string;
}

interface SwitchOrganizationResponse {
  success: boolean;
  message: string;
  organization_id: string;
  user_id: string;
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

console.log('Switch Organization Edge Function initializing...');

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Authorization header required'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user's auth for validation
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Admin client for metadata updates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid authentication'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    console.log(`Processing organization switch for user: ${user.id}`);

    // Parse request body
    const { organization_id }: SwitchOrganizationRequest = await req.json();
    
    if (!organization_id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'organization_id is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log(`Switching to organization: ${organization_id}`);

    // Verify user has access to this organization (or is super admin)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.is_super_admin || false;

    if (!isSuperAdmin) {
      // Check if user is a member of the target organization
      const { data: membership } = await supabaseAdmin
        .from('organization_memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organization_id)
        .single();

      if (!membership) {
        return new Response(JSON.stringify({
          success: false,
          message: 'User does not have access to this organization'
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
    }

    console.log(`Access verified for user ${user.id} to organization ${organization_id}`);

    // Update user_metadata using admin client
    const { error: userMetadataError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          active_organization_id: organization_id
        }
      }
    );

    if (userMetadataError) {
      console.error('Failed to update user_metadata:', userMetadataError);
      return new Response(JSON.stringify({
        success: false,
        message: `Failed to update user metadata: ${userMetadataError.message}`
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('User metadata updated successfully');

    // Update app_metadata (JWT claims) using admin client
    const { error: appMetadataError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          active_organization_id: organization_id,
          custom_claims: {
            ...user.app_metadata?.custom_claims,
            active_organization_id: organization_id
          }
        }
      }
    );

    if (appMetadataError) {
      console.error('Failed to update app_metadata:', appMetadataError);
      return new Response(JSON.stringify({
        success: false,
        message: `Failed to update app metadata: ${appMetadataError.message}`
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('App metadata and JWT claims updated successfully');

    // Return success response
    const response: SwitchOrganizationResponse = {
      success: true,
      message: 'Organization switched successfully',
      organization_id: organization_id,
      user_id: user.id
    };

    console.log('Organization switch completed successfully');
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in switch-organization function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      message: `Internal server error: ${errorMessage}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

console.log('Switch Organization Edge Function started.'); 