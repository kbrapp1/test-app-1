# Deploying add functions
1. be in the local directory
2. link the proper project | npx supabase link --project-ref [prod-supabase-project-id]
3. Deploy all edge functions | e.g. npx supabase functions deploy
4. or deply individual functions | e.g npx supabase functions deploy invite-member
5. Link back to dev product | npx supabase link --project-ref [dev-supabase-project-id]