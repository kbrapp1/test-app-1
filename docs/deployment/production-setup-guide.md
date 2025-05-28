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

## 4. Edge Functions Deployment

### 4.1 Deploy All Edge Functions
```bash
# Option 1: Deploy ALL functions at once (recommended for clean setup)
supabase functions deploy --project-ref [PROD_PROJECT_ID]

# Option 2: Deploy individual functions (if you need specific control)
# Deploy critical Auth Hook function (MUST have --no-verify-jwt)
supabase functions deploy set-active-org-claim --project-ref [PROD_PROJECT_ID] --no-verify-jwt

# Deploy other functions
supabase functions deploy invite-member --project-ref [PROD_PROJECT_ID]
supabase functions deploy complete-onboarding-membership --project-ref [PROD_PROJECT_ID]
supabase functions deploy admin-resend-invitation --project-ref [PROD_PROJECT_ID]
supabase functions deploy admin-reset-password --project-ref [PROD_PROJECT_ID]
```

**Important Notes:**
- **Auth Hook functions** (like `set-active-org-claim`) MUST be deployed with `--no-verify-jwt` because Supabase calls them during authentication before JWT tokens exist
- **Regular functions** don't need this flag if they expect authenticated requests
- **Deploy all** approach (`supabase functions deploy`) automatically handles JWT verification settings based on your function configuration

### 4.2 Configure Edge Function Secrets
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