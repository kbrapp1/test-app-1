/// <reference types="https://deno.land/x/deno/cli/types/index.d.ts" />

// This is a Supabase Edge Function designed to run in a Deno environment.
// Linter errors regarding Deno-specific globals (e.g., `Deno`) or URL imports
// are expected if your local development environment is not configured for Deno.
// The code is correct for its intended runtime.
// @ts-nocheck

import { serve, ConnInfo } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'; // Import standardwebhooks

interface AuthHookRequest {
  type?: string; 
  event?: string;
  user_id: string; // User ID is at the root
  claims: any; 
  authentication_method?: string;
}

interface Membership {
  organization_id: string;
  role: string;
}

console.log('Set Active Org Claim Edge Function initializing...');

// Retrieve the configured Auth Hook secret from environment variables
const HOOK_SECRET_WITH_PREFIX = Deno.env.get('CUSTOM_AUTH_HOOK_SECRET');

serve(async (req: Request, connInfo: ConnInfo) => {
  try {
    const requestBodyText = await req.text();
    console.log(`Received requestBodyText: ${requestBodyText}`); // LOG THE RAW BODY
    const headers = Object.fromEntries(req.headers);

    if (HOOK_SECRET_WITH_PREFIX) {
      const secretWithoutPrefix = HOOK_SECRET_WITH_PREFIX.replace(/^v1,whsec_/, '');
      const wh = new Webhook(secretWithoutPrefix);
      try {
        wh.verify(requestBodyText, headers);
        console.log('Auth Hook payload verified successfully using standardwebhooks.');
      } catch (error) {
        console.error('Auth Hook payload verification failed (standardwebhooks):', (error as Error).message);
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid hook signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('CUSTOM_AUTH_HOOK_SECRET is not set. Skipping hook verification. THIS IS NOT RECOMMENDED FOR PRODUCTION.');
    }

    let payload: AuthHookRequest | null = null;
    try {
      payload = JSON.parse(requestBodyText) as AuthHookRequest;
      console.log('Parsed payload object:', JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error('Failed to parse requestBodyText as JSON:', (parseError as Error).message);
      console.error('requestBodyText that failed parsing was:', requestBodyText);
      return new Response(JSON.stringify({ error: 'Invalid JSON payload from Auth Hook' }), {
        status: 400, // Bad Request
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!payload || !payload.user_id) { // NEW CHECK
      console.log('No user_id at payload root (or payload is null), skipping custom claim.');
      const emptyResponseString = JSON.stringify({ session: {} });
      console.log('Returning empty session object (stringified for return):', emptyResponseString);
      return new Response(emptyResponseString, { 
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = payload.user_id; // Get userId directly from payload.user_id
    console.log(`Processing user ID: ${userId}`);

    const supabaseAdminClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let activeOrganizationId: string | null = null;
    const { data: memberships, error: membershipError } = await supabaseAdminClient
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', userId)
      .returns<Membership[]>();

    if (membershipError) {
      console.error('Error fetching organization memberships:', membershipError);
    } else if (memberships && memberships.length > 0) {
      const adminMembership = memberships.find((m: Membership) => m.role === 'admin');
      if (adminMembership) {
        activeOrganizationId = adminMembership.organization_id;
      } else {
        activeOrganizationId = memberships[0].organization_id;
      }
      console.log(`Selected active_organization_id: ${activeOrganizationId} for user ${userId}`);
    } else {
      console.log(`No organization memberships found for user ${userId}.`);
    }

    // Merge existing claims with our custom_claims field
    const baseClaims = payload.claims || {};
    const updatedClaims = {
      ...baseClaims,
      custom_claims: activeOrganizationId
        ? { active_organization_id: activeOrganizationId }
        : {},
    };
    const responseBody = JSON.stringify({ claims: updatedClaims });
    console.log('Responding with updated claims:', JSON.stringify({ claims: updatedClaims }, null, 2));
    return new Response(responseBody, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const error = e as Error;
    console.error('Error in Edge Function:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

console.log('Set Active Org Claim Edge Function started (using standardwebhooks).');