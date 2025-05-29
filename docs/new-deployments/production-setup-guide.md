# Production Environment Setup Guide

This guide covers the complete process for setting up a new production environment for the test-app-1 project.

## Overview

**Assumptions:**
- New Supabase production project needs to be created
- GitHub has `main` (dev) and `release` (prod) branches
- Vercel will deploy `release` branch to production URL
- Dev environment is working and will be used as the source of truth

## 1. GitHub Branch Setup

### 1.1 Create Release Branch
```bash
# From main branch
git checkout main
git pull origin main
git checkout -b release
git push -u origin release
```

### 1.2 Branch Protection Rules
- **Main branch:** Require PR reviews, restrict direct pushes
- **Release branch:** Require PR reviews, only allow merges from main

## 2. Supabase Production Project Setup

### 2.1 Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and region (match dev for consistency)
4. Name: `[project-name]-prod` (e.g., `test-app-1-prod`)
5. Generate strong database password
6. **Save the project ID** - you'll need it throughout setup

### 2.2 Schema Migration
Run migrations from your local dev environment:

```bash
# Ensure you're connected to the new prod project
supabase link --project-ref [NEW_PROD_PROJECT_ID]

# Run all migrations to set up schema
supabase db push

# Verify schema was created properly
supabase db diff
```

### 2.3 Insert Required Reference Data
Run these SQL commands in Supabase SQL Editor:

```sql
-- Insert default roles
INSERT INTO public.roles (id, name, description) VALUES
('c8fd23d4-fe5a-46cb-bef3-d6a8fe320c41', 'admin', 'Full administrative access'),
('913e1d79-7be7-4fba-bd39-c558b527c660', 'member', 'Standard member access'),
('2593414b-7af3-40f5-ae1b-f8b6245691a0', 'viewer', 'Read-only access');

-- Insert your organization
INSERT INTO public.organizations (id, name, slug) VALUES
('[GENERATE_UUID]', '[YOUR_ORG_NAME]', '[your-org-slug]');

-- Note: Save the organization ID for later steps
```

## 3. Storage Configuration

### 3.1 Create Storage Buckets
In Supabase Dashboard → Storage:

1. **Create "assets" bucket:**
   - Name: `assets`
   - Public: `false`
   - File size limit: Set appropriate limit (e.g., 50MB)
   - Allowed MIME types: Add your supported formats

2. **Configure Storage RLS Policies:**
   ```sql
   -- Allow org members to read objects under their org path
   CREATE POLICY "Org members can read their org objects" ON storage.objects
   FOR SELECT TO authenticated
   USING ((split_part(name, '/'::text, 1))::uuid = public.get_active_organization_id());

   -- Allow org members to upload objects under their org path  
   CREATE POLICY "Org members can upload objects under their org path" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK ((split_part(name, '/'::text, 1))::uuid = public.get_active_organization_id());

   -- Allow org members to update their org objects
   CREATE POLICY "Org members can update their org objects" ON storage.objects
   FOR UPDATE TO authenticated
   USING ((split_part(name, '/'::text, 1))::uuid = public.get_active_organization_id());

   -- Allow org members to delete their org objects
   CREATE POLICY "Org members can delete their org objects" ON storage.objects
   FOR DELETE TO authenticated
   USING ((split_part(name, '/'::text, 1))::uuid = public.get_active_organization_id());
   ```

## 4. Edge Functions Setup

### 4.1 Create Edge Functions (New Deployments)
**For new from-scratch deployments, Edge Functions must be created manually first.**

#### 4.1.1 Create Required Edge Functions Directory Structure
```bash
# Create Edge Functions directory structure
mkdir -p supabase/functions/_shared
mkdir -p supabase/functions/set-active-org-claim
mkdir -p supabase/functions/invite-member
mkdir -p supabase/functions/complete-onboarding-membership
mkdir -p supabase/functions/admin-resend-invitation
mkdir -p supabase/functions/admin-reset-password
mkdir -p supabase/functions/switch-organization
```

#### 4.1.2 Create Shared Helper Files
**File: `supabase/functions/_shared/cors.ts`**
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
```

**File: `supabase/functions/_shared/errors.ts`**
```typescript
// General Errors
export const INTERNAL_SERVER_ERROR = { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.', error: 'internal_server_error' };
export const USER_JWT_NOT_FOUND = { code: 'USER_JWT_NOT_FOUND', message: 'User JWT not found or invalid.', error: 'user_jwt_not_found' };
export const MISSING_REQUIRED_PARAMS = { code: 'MISSING_REQUIRED_PARAMS', message: 'Missing required parameters.', error: 'missing_required_params' };

// Org/User specific errors
export const USER_NOT_ADMIN = { code: 'USER_NOT_ADMIN', message: 'User is not an admin of the organization.', error: 'user_not_admin' };
export const ORGANIZATION_NOT_FOUND = { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.', error: 'organization_not_found' };
export const USER_METADATA_MISSING = { code: 'USER_METADATA_MISSING', message: 'User metadata is missing necessary invitation details.', error: 'user_metadata_missing' };
export const ORG_ID_OR_ROLE_ID_MISSING = { code: 'ORG_ID_OR_ROLE_ID_MISSING', message: 'Organization ID or Role ID is missing in user metadata.', error: 'org_id_or_role_id_missing' };
export const MEMBERSHIP_INSERT_FAILED = { code: 'MEMBERSHIP_INSERT_FAILED', message: 'Failed to insert organization membership.', error: 'membership_insert_failed' };
export const USER_APP_METADATA_UPDATE_FAILED = { code: 'USER_APP_METADATA_UPDATE_FAILED', message: 'Failed to update user app metadata.', error: 'user_app_metadata_update_failed' };
```

#### 4.1.3 Critical Auth Hook Function
**File: `supabase/functions/set-active-org-claim/index.ts`**
```typescript
/// <reference types="https://deno.land/x/deno/cli/types/index.d.ts" />

import { serve, ConnInfo } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

interface AuthHookRequest {
  type?: string;
  event?: string;
  user_id: string;
  claims: any;
  authentication_method?: string;
}

console.log('Set Active Org Claim Edge Function initializing...');

const HOOK_SECRET_WITH_PREFIX = Deno.env.get('CUSTOM_AUTH_HOOK_SECRET');

serve(async (req: Request, connInfo: ConnInfo) => {
  try {
    const requestBodyText = await req.text();
    console.log(`Received requestBodyText: ${requestBodyText}`);
    const headers = Object.fromEntries(req.headers);

    if (HOOK_SECRET_WITH_PREFIX) {
      const secretWithoutPrefix = HOOK_SECRET_WITH_PREFIX.replace(/^v1,whsec_/, '');
      const wh = new Webhook(secretWithoutPrefix);
      try {
        wh.verify(requestBodyText, headers);
        console.log('Auth Hook payload verified successfully.');
      } catch (error) {
        console.error('Auth Hook payload verification failed:', (error as Error).message);
        return new Response(JSON.stringify({
          error: 'Unauthorized: Invalid hook signature'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.warn('CUSTOM_AUTH_HOOK_SECRET not set. Skipping verification.');
    }

    const payload: AuthHookRequest = JSON.parse(requestBodyText);
    const userId = payload.user_id;
    console.log(`Processing user ID: ${userId}`);

    const supabaseAdminClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let activeOrganizationId: string | null = null;
    
    // First, check if user already has an active organization in their metadata
    const { data: userData } = await supabaseAdminClient.auth.admin.getUserById(userId);
    const existingOrgId = userData?.user?.user_metadata?.active_organization_id;
    
    if (existingOrgId) {
      console.log(`User has active organization in metadata: ${existingOrgId}`);
      
      // Check if user has access (either membership or super admin)
      const { data: profile } = await supabaseAdminClient
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .single();
      
      const isSuperAdmin = profile?.is_super_admin || false;
      
      if (isSuperAdmin) {
        console.log(`User is super admin, allowing access to: ${existingOrgId}`);
        activeOrganizationId = existingOrgId;
      } else {
        // Check membership
        const { data: membership } = await supabaseAdminClient
          .from('organization_memberships')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('organization_id', existingOrgId)
          .single();
        
        if (membership) {
          console.log(`User has membership in: ${existingOrgId}`);
          activeOrganizationId = existingOrgId;
        } else {
          console.log(`User no longer has access to: ${existingOrgId}, falling back`);
        }
      }
    }
    
    // If no valid existing organization, fall back to membership-based selection
    if (!activeOrganizationId) {
      console.log('No valid existing organization, selecting from memberships...');
      
      const { data: memberships } = await supabaseAdminClient
        .from('organization_memberships')
        .select('organization_id, role_id, roles(name)')
        .eq('user_id', userId);

      if (memberships && memberships.length > 0) {
        const adminMembership = memberships.find((m: any) => m.roles?.name === 'admin');
        activeOrganizationId = adminMembership ? 
          adminMembership.organization_id : 
          memberships[0].organization_id;
        console.log(`Selected from memberships: ${activeOrganizationId}`);
      }
    }

    const baseClaims = payload.claims || {};
    const updatedClaims = {
      ...baseClaims,
      custom_claims: activeOrganizationId
        ? { active_organization_id: activeOrganizationId }
        : {},
    };

    console.log('Responding with claims:', JSON.stringify({ claims: updatedClaims }, null, 2));
    return new Response(JSON.stringify({ claims: updatedClaims }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const error = e as Error;
    console.error('Error in Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

console.log('Set Active Org Claim Edge Function started.');
```

#### 4.1.4 Organization Switching Function
**File: `supabase/functions/switch-organization/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed'
    }), { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Authorization header required'
      }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid authentication'
      }), { status: 401, headers: corsHeaders });
    }

    const { organization_id }: SwitchOrganizationRequest = await req.json();
    
    if (!organization_id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'organization_id is required'
      }), { status: 400, headers: corsHeaders });
    }

    // Verify user has access (or is super admin)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.is_super_admin || false;

    if (!isSuperAdmin) {
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
        }), { status: 403, headers: corsHeaders });
      }
    }

    // Update user_metadata
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
      return new Response(JSON.stringify({
        success: false,
        message: `Failed to update user metadata: ${userMetadataError.message}`
      }), { status: 500, headers: corsHeaders });
    }

    // Update app_metadata (JWT claims)
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
      return new Response(JSON.stringify({
        success: false,
        message: `Failed to update app metadata: ${appMetadataError.message}`
      }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Organization switched successfully',
      organization_id: organization_id,
      user_id: user.id
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      message: `Internal server error: ${errorMessage}`
    }), { status: 500, headers: corsHeaders });
  }
});
```

#### 4.1.5 Copy Other Required Functions
**For the remaining functions, copy from your existing working project:**

- `invite-member/index.ts` - User invitation functionality
- `complete-onboarding-membership/index.ts` - Onboarding completion  
- `admin-resend-invitation/index.ts` - Admin invitation resend
- `admin-reset-password/index.ts` - Admin password reset

**Or create minimal versions and enhance later based on your needs.**

### 4.2 Deploy All Edge Functions
```bash
# Option 1: Deploy ALL functions at once (recommended for clean setup)
supabase functions deploy --project-ref [PROD_PROJECT_ID]

# Option 2: Deploy individual functions (if you need specific control)
# Deploy critical Auth Hook function (MUST have --no-verify-jwt)
supabase functions deploy set-active-org-claim --project-ref [PROD_PROJECT_ID] --no-verify-jwt

# Deploy organization switching function
supabase functions deploy switch-organization --project-ref [PROD_PROJECT_ID]

# Deploy other functions
supabase functions deploy invite-member --project-ref [PROD_PROJECT_ID]
supabase functions deploy complete-onboarding-membership --project-ref [PROD_PROJECT_ID]
supabase functions deploy admin-resend-invitation --project-ref [PROD_PROJECT_ID]
supabase functions deploy admin-reset-password --project-ref [PROD_PROJECT_ID]
```

**Important Notes:**
- **Auth Hook functions** (like `set-active-org-claim`) MUST be deployed with `--no-verify-jwt` because Supabase calls them during authentication before JWT tokens exist
- **Organization switching function** is critical for super admin functionality
- **Deploy all** approach (`supabase functions deploy`) automatically handles JWT verification settings based on your function configuration

### 4.3 Configure Edge Function Secrets
All Edge Functions share the same project-level secrets:

1. Go to **Edge Functions** → **Secrets** in Supabase Dashboard
2. Add required secrets (available to ALL functions):

**Required Secrets:**
- `CUSTOM_AUTH_HOOK_SECRET`: [Value from Auth Hook secret - added in step 5.1]
- `PUBLIC_APP_URL`: `https://[your-vercel-prod-domain.com]` ⚠️ **Critical for invite emails**

**Auto-Available Secrets** (already present):
- `SUPABASE_URL`: Your project's API URL
- `SUPABASE_ANON_KEY`: Anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key
- `SUPABASE_DB_URL`: Database connection URL

**Note:** These secrets are accessible to ALL Edge Functions via `Deno.env.get('SECRET_NAME')`

## 5. Auth Hooks Configuration

### 5.1 Set Up JWT Claims Hook
1. Go to **Authentication** → **Hooks**
2. Click **"Add hook"**
3. Configure:
   - **Hook Type:** "Customize Access Token (JWT) Claims hook"
   - **Enabled:** ✅ Yes
   - **Endpoint:** `https://[SUPA_PROD_PROJECT_ID].supabase.co/functions/v1/set-active-org-claim`
   - **HTTP Method:** POST
   - **Secret:** Auto-generated (copy this value)

4. **Copy the generated secret** and add it to `set-active-org-claim` function environment variables

### 5.2 Test Auth Hook
1. Create a test user
2. Add them to organization membership
3. Test login to verify JWT claims are set

## 6. Environment Variables Setup

### 6.1 Supabase Environment Variables
Get these values from your NEW production Supabase project:

1. Go to **Project Settings** → **API Keys** in your production Supabase project
2. Copy the following values:

- **Anon Key:** [From "Project API keys" section]
- **Service Role Key:** [From "Project API keys" section] ⚠️ Keep secure!

3. Go to **Project Settings** → **Data API**
- **Project (API) URL:** `https://[PROD_PROJECT_ID].supabase.co`

### 6.2 Configure Auth URL Settings
Critical for production authentication to work correctly:

1. Go to **Authentication** → **URL Configuration** in Supabase Dashboard
2. Configure:
   - **Site URL:** `https://[your-prod-domain.com]` (your production Vercel URL)
   - **Redirect URLs:** Add both:
     - `http://localhost:3000 (optional, for local development)
     - `http://localhost:3000/onboarding (optional, for local development)

**Why This is Critical:**
- **Site URL** determines where auth confirmation emails redirect users
- **Redirect URLs** whitelist where users can be redirected after authentication
- Wrong configuration = broken auth flows in production

### 6.3 External Service Keys
Copy/regenerate for production:

- **Replicate API Key** (for AI model inference)
- **ElevenLabs API Key + URL** (for text-to-speech features)
- **Resend API Key** (optional - only if using Resend for email invitations)
- **Any other third-party service keys your app uses**

## 7. Vercel Production Deployment

### 7.1 Create Production Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. **Import Git Repository**
3. Connect to your GitHub repo
4. **Configure:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (if monorepo, adjust accordingly)
   - **Build Command:** `npm run build` or `pnpm build`
   - **Output Directory:** `.next`

### 7.2 Configure Deployment Branch
1. In Vercel project settings → **Git**
2. **Production Branch:** `release`
3. **Preview Branches:** `main` (optional, for staging)

### 7.3 Environment Variables
Add all production environment variables:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://[SUP_PROD_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[PROD_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[PROD_SERVICE_ROLE_KEY]

# App Configuration (Required)
NEXT_PUBLIC_SITE_URL=https://[your-vercel-prod-domain.com]

# AI Services (Required for AI features)
REPLICATE_API_TOKEN=[PROD_REPLICATE_KEY]
ELEVENLABS_API_KEY=[PROD_ELEVENLABS_KEY]
ELEVENLABS_API_URL=[PROD_ELEVENLABS_URL]

# Optional
NEXT_PUBLIC_APP_ENV=production
RESEND_API_KEY=[PROD_RESEND_KEY] # Only if using Resend for emails
```

### 7.4 Custom Domain (Optional)
1. **Domains** → **Add Domain**
2. Add your production domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

## 8. Database Seed Data

### 8.1 Create Initial Admin User
```sql
-- This should be done through the proper invitation flow, but for initial setup:

-- 1. Create user through Supabase Auth UI or invitation
-- 2. Add to organization membership:
INSERT INTO public.organization_memberships (user_id, organization_id, role_id)
VALUES ('[USER_ID]', '[ORG_ID]', '[ADMIN_ROLE_ID]');

-- 3. Update user app_metadata to include active org:
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"active_organization_id": "[ORG_ID]"}'::jsonb
WHERE id = '[USER_ID]';
```

### 8.2 Create Super Admin User
**Critical Security Step:** Super admin privileges can only be granted via database access for maximum security.

#### 8.2.1 Identify Target User
First, find the user who should become the super admin:

```sql
-- Find all users with their emails and current super admin status
SELECT 
  au.id as user_id,
  au.email,
  au.created_at,
  p.is_super_admin,
  p.full_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;
```

#### 8.2.2 Verify Super Admin Functions Exist
Ensure the super admin database functions are deployed:

```sql
-- Check if super admin functions exist
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('is_super_admin', 'grant_super_admin', 'revoke_super_admin')
ORDER BY p.proname;
```

**Expected Result:** Should show all three functions (is_super_admin, grant_super_admin, revoke_super_admin)

#### 8.2.3 Grant Super Admin Privileges
Use the secure database function to grant super admin privileges:

```sql
-- Grant super admin privileges to the chosen user
SELECT public.grant_super_admin(
  '[USER_UUID_HERE]'::uuid,
  'Initial super admin setup for production system - [DATE] by [YOUR_NAME]'
);
```

**Example:**
```sql
-- Example: Make john@company.com a super admin
SELECT public.grant_super_admin(
  '4b4f3b9e-26dc-48c3-be6e-896a3fc81ef1'::uuid,
  'Initial super admin setup for production system - 2025-01-15 by Setup Team'
);
```

#### 8.2.4 Verify Super Admin Setup
Confirm the super admin was created successfully:

```sql
-- Verify super admin status
SELECT 
  au.email,
  p.is_super_admin,
  p.full_name
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE p.is_super_admin = true;

-- Check audit trail
SELECT 
  saa.action,
  saa.created_at,
  saa.notes,
  au_target.email as target_user,
  au_performed.email as performed_by
FROM public.super_admin_audit saa
JOIN auth.users au_target ON saa.target_user_id = au_target.id
LEFT JOIN auth.users au_performed ON saa.performed_by_user_id = au_performed.id
ORDER BY saa.created_at DESC
LIMIT 5;
```

#### 8.2.5 Test Super Admin Access
Test that super admin can access cross-organizational data:

```sql
-- Test super admin function
SELECT public.is_super_admin('[SUPER_ADMIN_USER_ID]'::uuid);
-- Should return: true

-- Verify super admin can see all organizations
-- (This will be tested in the application UI)
```

### 8.3 Document Super Admin Management
**Critical:** Document the super admin management process for your team:

1. **Who has super admin access:** Document the user(s) with super admin privileges
2. **Database access:** Document who has production database access to manage super admins
3. **Audit procedures:** Regularly review the super_admin_audit table
4. **Emergency procedures:** How to grant emergency super admin access if needed

**Security Notes:**
- ✅ Super admin privileges can ONLY be granted via database functions
- ✅ No API endpoints exist for granting super admin access
- ✅ All super admin changes are logged in the audit table
- ✅ Super admin status persists across user sessions
- ⚠️ Protect database access credentials carefully
- ⚠️ Regular audit of super admin accounts recommended

#### Emergency Super Admin Commands
Keep these handy for emergency situations:

```sql
-- Emergency: Grant super admin (if no current super admins)
SELECT public.grant_super_admin(
  '[EMERGENCY_USER_ID]'::uuid,
  'Emergency super admin grant - [REASON] - [DATE]'
);

-- Emergency: Revoke super admin (if needed)
SELECT public.revoke_super_admin(
  '[USER_ID]'::uuid,
  'Super admin revocation - [REASON] - [DATE]'
);

-- Check current super admins
SELECT au.email, p.full_name, p.is_super_admin
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE p.is_super_admin = true;
```

## 9. Security Configuration

### 9.1 Row Level Security Verification
Verify all RLS policies are working:

```sql
-- Test that get_active_organization_id() works
SELECT public.get_active_organization_id();

-- Verify policies exist for all tables:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 9.2 Email Domain Restrictions
If using email domain verification:

```sql
-- Add allowed domains for your organization
INSERT INTO public.organization_domains (organization_id, domain_name, verified_at)
VALUES ('[ORG_ID]', 'yourdomain.com', NOW());
```

## 10. Testing & Validation

### 10.1 Functional Testing Checklist
- [ ] User registration/login works
- [ ] Auth Hook sets JWT claims correctly
- [ ] Organization-scoped data access works
- [ ] File upload to storage works
- [ ] Edge Functions respond correctly
- [ ] Email invitations work
- [ ] RLS policies enforce proper access

### 10.2 Security Testing
- [ ] Users can only see their organization's data
- [ ] Storage access is properly scoped
- [ ] Admin functions require proper permissions
- [ ] No data leakage between organizations

## 11. Monitoring & Maintenance

### 11.1 Set Up Monitoring
- **Vercel:** Monitor deployment status and performance
- **Supabase:** Monitor database performance and usage
- **Error Tracking:** Set up error reporting (Sentry, LogRocket, etc.)

### 11.2 Backup Strategy
- **Database:** Supabase handles automated backups
- **Storage:** Consider regular storage backups if critical
- **Configuration:** Document all manual configuration steps

## 12. Troubleshooting Common Issues

### 12.1 "No active organization found" Error
**Cause:** Auth Hook not configured or not working
**Solution:**
1. Verify Auth Hook is enabled and pointing to correct endpoint
2. Check Edge Function logs for errors
3. Verify user has organization membership
4. Manually set app_metadata if needed (temporary fix)

### 12.2 Invitation Emails Don't Redirect to /onboarding
**Cause:** Client code prioritizing `VERCEL_URL` over `NEXT_PUBLIC_SITE_URL`
**Solution:**
1. Check Edge Function logs for the "Final 'redirectTo' URL" message
2. Ensure `NEXT_PUBLIC_SITE_URL` is set correctly in Vercel environment variables
3. If still wrong, update client code in `lib/actions/members.ts` to prioritize `NEXT_PUBLIC_SITE_URL` over `VERCEL_URL`

### 12.2 Storage Access Denied
**Cause:** RLS policies not configured correctly
**Solution:**
1. Verify storage RLS policies are created
2. Check that `get_active_organization_id()` returns correct value
3. Ensure file paths follow `{org_id}/...` pattern

### 12.3 Edge Function Errors
**Cause:** Missing environment variables or incorrect configuration
**Solution:**
1. Check function logs in Supabase dashboard
2. Verify all environment variables are set
3. Test function endpoints directly

## 13. Deployment Workflow

### 13.1 Regular Deployments
```bash
# 1. Develop on main branch
git checkout main
# ... make changes ...
git push origin main

# 2. When ready for production
git checkout release
git merge main
git push origin release

# 3. Vercel automatically deploys release branch to production
```

### 13.2 Database Migrations
```bash
# 1. Create migration in dev
supabase migration new [migration_name]

# 2. Test in dev
supabase db reset

# 3. When ready, apply to production
supabase link --project-ref [PROD_PROJECT_ID]
supabase db push
```

---

## Quick Reference

**Critical Components That Must Be Manually Configured:**
1. ✅ Supabase project creation and schema migration
2. ✅ Edge Functions deployment 
3. ✅ Auth Hooks configuration (with secrets)
4. ✅ Storage buckets and RLS policies
5. ✅ Environment variables (Vercel + Supabase)
6. ✅ Initial organization and admin user setup
7. ✅ Vercel project configuration and custom domain

**Always Test After Setup:**
- User login and JWT claims
- Organization-scoped data access
- File upload/download
- Invitation workflow
- Admin functions

Remember: Document any deviations or additional manual steps for your specific use case! 