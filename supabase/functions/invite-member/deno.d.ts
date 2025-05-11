// Type definitions for Deno and related APIs
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Type declarations for imports
declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.21.0" {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
  }

  export interface PostgrestError {
    message: string;
  }

  export interface User {
    id: string;
    app_metadata: {
      [key: string]: any;
    };
    user_metadata: {
      [key: string]: any;
    };
    aud: string;
    email?: string;
    email_confirmed_at?: string;
  }

  export interface Session {
    access_token: string;
    refresh_token: string;
    user: User;
  }

  export interface SupabaseClient {
    auth: {
      getUser(token?: string): Promise<{ data: { user: User | null }, error: Error | null }>;
      getSession(): Promise<{ data: { session: Session | null }, error: Error | null }>;
      admin: {
        inviteUserByEmail(email: string, options?: any): Promise<{ data: any, error: Error | null }>;
        updateUserById(id: string, attributes: any): Promise<{ data: any, error: Error | null }>;
      };
    };
    from(table: string): any;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): SupabaseClient;
} 