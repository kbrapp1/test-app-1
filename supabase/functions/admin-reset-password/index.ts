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
  // Ensure JSON
  if (req.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ error: 'Invalid content type, expected application/json' }), {
      status: 400,
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
    // Create an admin Supabase client with service role key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin: any = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
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