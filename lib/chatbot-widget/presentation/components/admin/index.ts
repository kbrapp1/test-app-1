/**
 * Chatbot Widget Admin Components
 * 
 * AI INSTRUCTIONS:
 * - Components are organized by functional responsibility following @golden-rule DDD
 * - Each category handles specific admin concerns with single responsibility
 * - Use these exports for clean component access across the admin interface
 * - Maintain separation of concerns and component boundaries
 */

// Configuration Management
export * from './configuration';

// Simulation & Testing
export * from './simulation';

// Testing Components
export * from './testing';

// Knowledge Base Management
export * from './knowledge-base';

// Lead Management
export * from './lead-management';

// Widget Management
export * from './widget-management';

// Legacy subdirectories (to be reorganized over time)
// These exist for backward compatibility during gradual refactoring
// TODO: Organize these into logical categories above 