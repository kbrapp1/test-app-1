import { PageContext, PageContextRepository } from '../../domain/repositories/PageContextRepository';

// Check if we're in a Node.js environment (server-side)
const isServerSide = typeof window === 'undefined';

export class InMemoryPageContextRepository implements PageContextRepository {
  private contexts = new Map<string, PageContext>();
  private initialized = false;

  constructor() {
    // No hardcoded contexts - everything auto-discovered
  }

  async register(domain: string, context: PageContext): Promise<void> {
    this.contexts.set(domain, context);
  }

  async getContext(domain: string): Promise<PageContext | null> {
    await this.ensureInitialized();
    return this.contexts.get(domain) || null;
  }

  async getAllContexts(): Promise<Map<string, PageContext>> {
    await this.ensureInitialized();
    return new Map(this.contexts);
  }

  async hasContext(domain: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.contexts.has(domain);
  }

  /**
   * Force refresh all contexts from filesystem (server-side only)
   */
  async refresh(): Promise<void> {
    this.contexts.clear();
    this.initialized = false;
    await this.ensureInitialized();
  }

  /**
   * Auto-discover and populate contexts on first use
   * Server-side: Real filesystem discovery
   * Client-side: Generated fallback contexts (auto-synced)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (isServerSide) {
        // Server-side: Use actual discovery
        const { DomainDiscoveryService } = await import('../discovery/DomainDiscoveryService');
        const discoveredContexts = await DomainDiscoveryService.discoverDomains();
        
        for (const context of discoveredContexts) {
          this.contexts.set(context.domain, context);
        }
      } else {
        // Client-side: Use pre-generated contexts (build-time discovery)
        await this.loadPreGeneratedContexts();
      }
      
      this.initialized = true;
    } catch (error) {
      // Graceful degradation - empty contexts if generation fails
      this.initialized = true;
    }
  }

  /**
   * Load pre-generated contexts from build-time discovery (client-side only)
   */
  private async loadPreGeneratedContexts(): Promise<void> {
    // Import generated contexts (build-time generated)
    const { DISCOVERED_CONTEXTS } = await import('../generated/DiscoveredContexts');
    
    for (const context of DISCOVERED_CONTEXTS) {
      this.contexts.set(context.domain, context);
    }
  }
} 