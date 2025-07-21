/**
 * Notes Composition Root - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - REFACTORED: Wire all Notes domain dependencies using dependency injection
 * - Now includes IPermissionService dependency following DAM pattern
 * - Singleton pattern for service instances
 * - Lazy initialization for performance
 * - Follow @golden-rule composition root patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { INotesRepository } from '../../domain/repositories/INotesRepository';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { NotesSupabaseRepository } from '../persistence/supabase/NotesSupabaseRepository';
import { SupabasePermissionService } from '../services/SupabasePermissionService';
import { NotesApplicationService } from '../../application/services/NotesApplicationService';

export class NotesCompositionRoot {
  private static _instance: NotesCompositionRoot;
  private _supabaseClient: SupabaseClient | null = null;
  private _notesRepository: INotesRepository | null = null;
  private _permissionService: IPermissionService | null = null;
  private _notesApplicationService: NotesApplicationService | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): NotesCompositionRoot {
    if (!NotesCompositionRoot._instance) {
      NotesCompositionRoot._instance = new NotesCompositionRoot();
    }
    return NotesCompositionRoot._instance;
  }

  /**
   * Get Supabase client instance
   */
  public getSupabaseClient(): SupabaseClient {
    if (!this._supabaseClient) {
      this._supabaseClient = createClient();
    }
    return this._supabaseClient;
  }

  /**
   * Get Notes repository instance
   */
  public getNotesRepository(): INotesRepository {
    if (!this._notesRepository) {
      const supabase = this.getSupabaseClient();
      this._notesRepository = new NotesSupabaseRepository(supabase);
    }
    return this._notesRepository;
  }

  /**
   * Get Permission service instance
   */
  public getPermissionService(): IPermissionService {
    if (!this._permissionService) {
      const supabase = this.getSupabaseClient();
      this._permissionService = new SupabasePermissionService(supabase);
    }
    return this._permissionService;
  }

  /**
   * Get Notes application service instance with dependency injection
   */
  public getNotesApplicationService(): NotesApplicationService {
    if (!this._notesApplicationService) {
      const repository = this.getNotesRepository();
      const permissionService = this.getPermissionService();
      this._notesApplicationService = new NotesApplicationService(repository, permissionService);
    }
    return this._notesApplicationService;
  }

  /**
   * Reset all cached instances (useful for testing)
   */
  public reset(): void {
    this._supabaseClient = null;
    this._notesRepository = null;
    this._permissionService = null;
    this._notesApplicationService = null;
  }

  /**
   * Factory method for creating composition root with custom dependencies
   * Useful for testing with mocks
   */
  public static createWithDependencies(
    supabaseClient: SupabaseClient,
    notesRepository?: INotesRepository,
    permissionService?: IPermissionService
  ): NotesCompositionRoot {
    const root = new NotesCompositionRoot();
    root._supabaseClient = supabaseClient;
    
    if (notesRepository) {
      root._notesRepository = notesRepository;
    }
    
    if (permissionService) {
      root._permissionService = permissionService;
    }
    
    return root;
  }
} 