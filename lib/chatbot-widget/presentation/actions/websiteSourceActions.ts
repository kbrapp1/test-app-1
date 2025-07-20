/**
 * Unified Website Source Actions Entry Point
 * 
 * AI INSTRUCTIONS:
 * - Maintains backward compatibility while using refactored components
 * - Re-exports all website source actions from specialized files
 * - Preserves existing API for components that import this file
 * - Follows DDD layer separation with clean presentation layer
 * - Note: This is a barrel export file, not a server actions file
 */

// CRUD Operations
export {
  addWebsiteSource,
  removeWebsiteSource,
  updateWebsiteSource,
  type ActionResult,
  type WebsiteSourceFormData
} from './websiteSourceCrudActions';

// Processing Operations  
export {
  crawlWebsiteSource,
  getCrawledPages
} from './websiteSourceProcessingActions';

// Cleanup Operations
export {
  cleanupWebsiteSources
} from './websiteSourceCleanupActions';

// Application Services (for advanced use cases)
export { WebsiteSourceProgressService } from '../../application/services/WebsiteSourceProgressService';