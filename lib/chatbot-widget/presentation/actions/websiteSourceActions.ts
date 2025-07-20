// Unified Website Source Actions Entry Point
//
// AI INSTRUCTIONS:
// - Maintains backward compatibility while using refactored components
// - Re-exports all website source actions from specialized files

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