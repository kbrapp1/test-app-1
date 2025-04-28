# Deployment Steps

This document outlines important configuration steps when deploying the application, particularly regarding Supabase email confirmation links.

## Supabase Email Confirmation Link Configuration

When deploying to a platform like Vercel, Supabase needs to know the public URL of your deployed site to generate correct email confirmation links (e.g., for user sign-ups). If this is not configured correctly, confirmation links might point to `localhost:3000` instead of your production URL.

Follow these steps to configure it:

1.  **Set Supabase Site URL:**
    *   Go to your Supabase project dashboard.
    *   Navigate to `Authentication` -> `URL Configuration`.
    *   In the **Site URL** field, enter your production deployment URL (e.g., `https://your-app-name.vercel.app`).
    *   Save the changes.

2.  **Set Vercel Environment Variable:**
    *   It's recommended to define your site URL as an environment variable for your frontend application.
    *   Add `NEXT_PUBLIC_SITE_URL="http://localhost:3000"` to your local `.env.local` and `.env.example` files.
    *   In your Vercel project dashboard, go to `Settings` -> `Environment Variables`.
    *   Add a new environment variable:
        *   **Name:** `NEXT_PUBLIC_SITE_URL`
        *   **Value:** Your production deployment URL (e.g., `https://your-app-name.vercel.app`)
        *   Make sure to apply it to the **Production** environment (and Preview/Development if needed, potentially with different URLs).
    *   Save the environment variable.

3.  **Redeploy:**
    *   Trigger a new deployment on Vercel to apply the environment variable changes.

4.  **Test:**
    *   Go to your deployed application URL.
    *   Attempt the user sign-up process.
    *   Check the confirmation email received. The link should now correctly point to your production URL with the appropriate verification token and redirect parameters. 