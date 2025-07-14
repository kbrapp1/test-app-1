import { PageContextRepository } from '../../domain/repositories/PageContextRepository';
import { InMemoryPageContextRepository } from '../repositories/InMemoryPageContextRepository';

export class DomainRegistrationBootstrap {
  private static instance: PageContextRepository | null = null;

  static getRepository(): PageContextRepository {
    if (!this.instance) {
      this.instance = this.initializeRepository();
    }
    return this.instance;
  }

  private static initializeRepository(): PageContextRepository {
    // Pure auto-discovery - zero manual configuration
    return new InMemoryPageContextRepository();
  }

  // Force refresh all discovered contexts
  static async refreshContexts(): Promise<void> {
    if (this.instance && 'refresh' in this.instance) {
      const refreshableInstance = this.instance as PageContextRepository & { refresh(): Promise<void> };
      await refreshableInstance.refresh();
    }
  }
} 