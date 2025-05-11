// @ts-ignore: Deno and esm.sh handle this URL import at runtime
import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore: Deno-specific import
import { corsHeaders } from '../_shared/cors.ts';
// @ts-ignore: Deno-specific import
import { USER_JWT_NOT_FOUND, USER_METADATA_MISSING, ORG_ID_OR_ROLE_ID_MISSING, MEMBERSHIP_INSERT_FAILED, USER_APP_METADATA_UPDATE_FAILED, INTERNAL_SERVER_ERROR } from '../_shared/errors.ts';

interface InvitationMetadata {
  invited_to_org_id?: string;
  assigned_role_id?: string;
  // full_name might also be here if set during invitation
}

interface AppMetadata {
  active_organization_id?: string;
  [key: string]: any; // Allow other app metadata
}

console.log("Function complete-onboarding-membership starting up.");

// @ts-ignore: Deno.serve is available in Deno runtime environment
Deno.serve(async (req: Request) => {
  console.log("complete-onboarding-membership: Received request");

  if (req.method === 'OPTIONS') {
    console.log("complete-onboarding-membership: Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("complete-onboarding-membership: Authorization header missing");
      return new Response(JSON.stringify({ error: USER_JWT_NOT_FOUND.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log("complete-onboarding-membership: Authorization header found");

    // Create a Supabase client with the user's JWT to fetch their metadata
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      console.error("complete-onboarding-membership: Error fetching user:", userError?.message);
      return new Response(JSON.stringify({ error: USER_JWT_NOT_FOUND.error, details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log("complete-onboarding-membership: User fetched successfully:", user.id);

    const userMetadata = user.user_metadata as InvitationMetadata | undefined;
    if (!userMetadata) {
      console.error("complete-onboarding-membership: User metadata not found for user:", user.id);
      return new Response(JSON.stringify({ error: USER_METADATA_MISSING.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    console.log("complete-onboarding-membership: User metadata found:", userMetadata);

    const { invited_to_org_id: organizationId, assigned_role_id: roleId } = userMetadata;

    if (!organizationId || !roleId) {
      console.error("complete-onboarding-membership: Organization ID or Role ID missing in user metadata for user:", user.id, "OrgID:", organizationId, "RoleID:", roleId);
      return new Response(JSON.stringify({ error: ORG_ID_OR_ROLE_ID_MISSING.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    console.log(`complete-onboarding-membership: Extracted orgId: ${organizationId}, roleId: ${roleId} for user: ${user.id}`);

    // Create a Supabase client with the service role key to perform admin operations
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("complete-onboarding-membership: Admin client initialized.");

    // 1. Insert into organization_memberships
    const { error: membershipError } = await supabaseAdminClient
      .from('organization_memberships')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        role_id: roleId,
        // 'role' column is deprecated but might still exist or have a default,
        // ensure role_id is correctly mapped to the intended textual role if needed by other parts of your system
        // or if the 'role' column still has constraints/triggers.
        // For now, we assume role_id is sufficient.
      });

    if (membershipError) {
      console.error("complete-onboarding-membership: Error inserting membership:", (membershipError as any).message);
      // Check for unique constraint violation (user already a member)
      if ((membershipError as any).code === '23505') { // Unique violation
         console.warn("complete-onboarding-membership: User already a member of this organization or unique constraint violated. Proceeding to update app_metadata.");
      } else {
        return new Response(JSON.stringify({ error: MEMBERSHIP_INSERT_FAILED.error, details: (membershipError as any).message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    } else {
      console.log(`complete-onboarding-membership: Membership created successfully for user ${user.id} in org ${organizationId}`);
    }

    // 2. Update user's app_metadata with active_organization_id
    const currentAppMetadata = (user.app_metadata || {}) as AppMetadata;
    const newAppMetadata: AppMetadata = {
      ...currentAppMetadata,
      active_organization_id: organizationId,
      // Preserve other app_metadata like provider and providers
      provider: currentAppMetadata.provider,
      providers: currentAppMetadata.providers,
    };
    
    // Filter out undefined general claims from app_metadata
    if (newAppMetadata.provider === undefined) delete newAppMetadata.provider;
    if (newAppMetadata.providers === undefined) delete newAppMetadata.providers;


    const { data: updatedUser, error: updateAppMetaError } = await supabaseAdminClient.auth.admin.updateUserById(
      user.id,
      { app_metadata: newAppMetadata }
    );

    if (updateAppMetaError) {
      console.error("complete-onboarding-membership: Error updating user app_metadata:", (updateAppMetaError as any).message);
      // If membership creation succeeded but this failed, it's a partial success.
      // Consider how to handle this - for now, return an error.
      return new Response(JSON.stringify({ error: USER_APP_METADATA_UPDATE_FAILED.error, details: (updateAppMetaError as any).message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`complete-onboarding-membership: User app_metadata updated successfully for user ${user.id}. New active_organization_id: ${organizationId}`);
    console.log("complete-onboarding-membership: Updated user object:", updatedUser);


    return new Response(JSON.stringify({ success: true, message: "User added to organization and app metadata updated." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const err = error as any;
    console.error("complete-onboarding-membership: Unhandled error:", err.message, err.stack);
    return new Response(JSON.stringify({ error: INTERNAL_SERVER_ERROR.error, details: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("Function complete-onboarding-membership deployed and listening."); 