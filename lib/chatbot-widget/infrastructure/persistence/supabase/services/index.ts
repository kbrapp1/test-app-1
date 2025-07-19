/**
 * Services Index - Lead Infrastructure Services
 * 
 * Barrel export for all lead-related infrastructure services
 * Provides clean imports for service composition
 */

// Core CRUD operations
export { LeadCrudService } from './LeadCrudService';

// Query and search operations
export { LeadQueryService, type LeadFilters, type QualificationStatus } from './LeadQueryService';

// Analytics and reporting
export { LeadAnalyticsService, type FunnelMetrics, type StatusCounts } from './LeadAnalyticsService';

// Bulk operations and data management
export { LeadBulkOperationsService, type BulkUpdateOptions, type DuplicateLeadGroup } from './LeadBulkOperationsService';

// Export and data extraction
export { LeadExportService, type ExportFilters } from './LeadExportService';

// Filter conversion utilities
export { LeadFilterConverter } from './LeadFilterConverter';

// Existing services (maintaining backward compatibility)
export { LeadOperationsService } from './LeadOperationsService';