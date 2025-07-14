import { PageContext } from '../../domain/repositories/PageContextRepository';
import { IContextDiscoveryService } from '../../domain/services/interfaces/IContextDiscoveryService';
import { DomainOrchestrationService } from '../../application/services/DomainOrchestrationService';

export class DomainDiscoveryService implements IContextDiscoveryService {
  /**
   * Auto-discover ALL domains by scanning lib/* directories + global components
   * Zero manual configuration required
   */
  async discoverDomains(): Promise<PageContext[]> {
    try {
      const [libDomains, globalDomains] = await Promise.all([
        DomainOrchestrationService.orchestrateLibDomainDiscovery(),
        DomainOrchestrationService.orchestrateGlobalComponentDiscovery()
      ]);

      return [...libDomains, ...globalDomains];
    } catch {
      // Graceful fallback in development
      return [];
    }
  }

  /**
   * Discover specific domain context by name
   */
  async discoverDomainContext(domainName: string): Promise<PageContext | null> {
    try {
      const allDomains = await this.discoverDomains();
      return allDomains.find(domain => domain.domain === domainName) || null;
    } catch {
      return null;
    }
  }
} 