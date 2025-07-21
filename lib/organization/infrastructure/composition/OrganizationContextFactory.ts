// Infrastructure Composition: Organization Context Factory
// Single Responsibility: Create properly configured OrganizationContextService instances
// DDD: Composition root for dependency injection

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createClientSide } from '@/lib/supabase/client';
import { createClient as createServerSide } from '@/lib/supabase/server';
import { OrganizationContextService } from '../../domain/services/OrganizationContextService';
import { SupabaseOrganizationContextRepository } from '../persistence/SupabaseOrganizationContextRepository';

export class OrganizationContextFactory {
  /**
   * Create OrganizationContextService for client-side usage
   * Uses client-side Supabase client for browser operations
   */
  static createClientSide(): OrganizationContextService {
    const supabaseClient = createClientSide();
    const repository = new SupabaseOrganizationContextRepository(supabaseClient);
    return new OrganizationContextService(repository);
  }

  /**
   * Create OrganizationContextService for server-side usage
   * Uses server-side Supabase client for server actions
   */
  static async createServerSide(): Promise<OrganizationContextService> {
    const supabaseClient = createServerSide();
    const repository = new SupabaseOrganizationContextRepository(supabaseClient);
    return new OrganizationContextService(repository);
  }

  /**
   * Create OrganizationContextService with custom Supabase client
   * Useful for testing or custom configurations
   */
  static createWithClient(supabaseClient: SupabaseClient): OrganizationContextService {
    const repository = new SupabaseOrganizationContextRepository(supabaseClient);
    return new OrganizationContextService(repository);
  }
}