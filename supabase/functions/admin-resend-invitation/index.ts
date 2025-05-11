import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
// @ts-ignore: Deno-specific import
import { corsHeaders } from '../_shared/cors.ts'

console.log("Function admin-resend-invitation starting up.");

interface ResendRequestBody {
  email: string;
  organizationId: string; // The organization the user is being re-invited TO
  roleId: string;
}

// @ts-ignore: Deno.serve is available in Deno runtime environment
Deno.serve(async (req: Request) => {
  console.log("admin-resend-invitation: Received request");

  if (req.method === 'OPTIONS') {
    console.log("admin-resend-invitation: Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  // Initialize Supabase Admin Client - will be used for auth check and main operation
  const supabaseAdminClient: SupabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } } 
  );
  console.log("admin-resend-invitation: Admin client initialized.");

  try {
    // 1. Parse request body first to get target organizationId for auth check
    if (req.headers.get("content-type") !== "application/json") {
      return new Response(JSON.stringify({ error: 'Invalid content type, expected application/json' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const body: ResendRequestBody = await req.json();
    const { email, organizationId, roleId } = body;

    if (!email || !organizationId || !roleId) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, organizationId, and roleId are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Security Check: Ensure the caller is an admin of the target organizationId
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("admin-resend-invitation: Missing or malformed Authorization header.");
      return new Response(JSON.stringify({ error: 'Missing or malformed Authorization header.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const token = authHeader.replace('Bearer ', '');

    // Validate the token and get the calling user's details using the admin client
    const { data: { user: callingUser }, error: callingUserError } = await supabaseAdminClient.auth.getUser(token);

    if (callingUserError || !callingUser) {
      console.error("admin-resend-invitation: Invalid token or user not found.", callingUserError?.message);
      return new Response(JSON.stringify({ error: 'Invalid token or calling user not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log(`admin-resend-invitation: Calling user ID: ${callingUser.id}`);

    // Check if the calling user is an admin in the target organization_id
    const { data: adminCheck, error: adminCheckError } = await supabaseAdminClient
      .from('organization_memberships')
      .select('*, roles!inner(name)') // Assuming you have a roles table joined
      .eq('user_id', callingUser.id)
      .eq('organization_id', organizationId) // Check against the target org from request body
      .single();

    if (adminCheckError || !adminCheck || (adminCheck.roles as { name: string }).name !== 'admin') {
      console.warn(`admin-resend-invitation: Authorization failed. User ${callingUser.id} is not an admin of org ${organizationId}. Error: ${adminCheckError?.message}`);
      return new Response(
        JSON.stringify({ error: "Forbidden: Caller is not an administrator of the target organization." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`admin-resend-invitation: Authorization successful. User ${callingUser.id} is an admin of org ${organizationId}.`);

    // ---- End Security Check ----

    console.log(`admin-resend-invitation: Attempting to resend invitation for email: ${email}, orgId: ${organizationId}, roleId: ${roleId}`);

    // Directly attempt to invite the user. Error handling below will manage specific cases like 'email_exists'.
    const origin = req.headers.get('Origin') || Deno.env.get("PUBLIC_APP_URL");
    const redirectTo = `${origin}/onboarding`;
    console.log("admin-resend-invitation: Using redirectTo:", redirectTo);
    console.log("admin-resend-invitation: Origin header:", req.headers.get('Origin'));
    console.log("admin-resend-invitation: PUBLIC_APP_URL env var:", Deno.env.get("PUBLIC_APP_URL"));

    const { data: inviteData, error: inviteError } = await supabaseAdminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectTo,
        data: { 
          invited_to_org_id: organizationId,
          assigned_role_id: roleId,
        }
      }
    );

    if (inviteError) {
      console.error(`admin-resend-invitation: Raw error object from inviteUserByEmail for ${email}:`, JSON.stringify(inviteError, null, 2));
      console.error(`admin-resend-invitation: Error inviting user ${email}:`, inviteError.message);

      const specificAuthError = inviteError as any; // Cast to any to access potential 'status' and 'code'
      
      // Check for the specific "email_exists" (422) error from Supabase Auth
      if (specificAuthError.name === 'AuthApiError' && 
          specificAuthError.status === 422 && 
          specificAuthError.code === 'email_exists') { // Ensure this 'code' matches the exact string from Supabase error
          console.log(`admin-resend-invitation: User ${email} already exists and email is confirmed. Suggesting password reset flow.`);
          return new Response(JSON.stringify({
            success: false, 
            message: "This user's email is already registered and confirmed. They should use the 'Forgot Password' option on the login page if they need to set or reset their password.",
            code: "USER_ALREADY_CONFIRMED"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Using 200 to clearly deliver a specific message to the client
          });
      }

      // Fallback for other errors from inviteUserByEmail
      const status = specificAuthError.status || 500;
      return new Response(JSON.stringify({ error: `Failed to resend invitation: ${inviteError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status, 
      });
    }

    // If inviteUserByEmail was successful
    console.log(`admin-resend-invitation: Invitation resent successfully for ${email}. User ID: ${inviteData.user?.id}`);
    return new Response(JSON.stringify({ success: true, message: `Invitation successfully resent to ${email}.`, userId: inviteData.user?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const err = error as any;
    console.error("admin-resend-invitation: Unhandled error:", err.message, err.stack);
    if (err instanceof SyntaxError && err.message.includes("JSON")) {
       return new Response(JSON.stringify({ error: 'Invalid JSON in request body.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error.', details: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("Function admin-resend-invitation deployed and listening (locally)."); 