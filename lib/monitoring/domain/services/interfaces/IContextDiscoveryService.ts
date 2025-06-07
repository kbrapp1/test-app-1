import { PageContext } from '../../repositories/PageContextRepository';

/**
 * Domain interface for context discovery operations
 * Abstracts infrastructure-specific discovery mechanisms
 */
export interface IContextDiscoveryService {
  /**
   * Discover domains and their contexts from the codebase
   */
  discoverDomains(): Promise<PageContext[]>;

  /**
   * Discover specific domain context by name
   */
  discoverDomainContext(domainName: string): Promise<PageContext | null>;
} 