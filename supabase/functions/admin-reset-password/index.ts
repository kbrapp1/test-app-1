import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
// @ts-ignore: Deno-specific import
import { corsHeaders } from '../_shared/cors.ts';

interface ResetPasswordRequest {
  email: string;
  redirectTo?: string;
}

// @ts-ignore: Deno.serve is available in the Deno runtime
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Create an admin Supabase client with service role key
  // Moved up so it's available for the auth check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin: any = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  // Ensure JSON
  if (req.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ error: 'Invalid content type, expected application/json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Ensure only admins and super-admins can call this function
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or malformed Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user: callingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !callingUser) {
    return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get active_organization_id from the calling user's JWT app_metadata
  const activeOrgId = callingUser.app_metadata?.active_organization_id;
  if (!activeOrgId) {
    return new Response(JSON.stringify({ error: 'Active organization not found for calling user' }), {
      status: 400, // Or 403 if you prefer
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch user's organization membership to check their role IN THAT ORG
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('organization_memberships')
    .select('roles!inner(name)')
    .eq('user_id', callingUser.id)
    .eq('organization_id', activeOrgId) // Ensure role check is for the active org
    .single();
  if (membershipError || !membership) {
    return new Response(JSON.stringify({ error: 'Failed to verify user role for the active organization' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  // @ts-ignore - roles is an object, not an array here because of .single()
  if (membership.roles.name !== 'admin' && membership.roles.name !== 'super-admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient privileges for active organization' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, redirectTo } = (await req.json()) as ResetPasswordRequest;
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Ensure the target user exists and belongs to the same organization
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    if (profileError || !profile?.id) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const targetUserId = profile.id;
    const { data: targetMembership, error: membershipError2 } = await supabaseAdmin
      .from('organization_memberships')
      .select()
      .eq('user_id', targetUserId)
      .eq('organization_id', activeOrgId)
      .single();
    if (membershipError2 || !targetMembership) {
      return new Response(JSON.stringify({ error: 'Forbidden: target user not in organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Trigger password reset email
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined
    );
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 