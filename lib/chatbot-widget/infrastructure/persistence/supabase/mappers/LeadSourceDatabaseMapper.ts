/**
 * LeadSource Database Mapper
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: LeadSource value object mapping only
 * - Handle transformation between domain LeadSource and database JSONB
 * - Use domain-specific errors with proper context
 * - Stay under 100 lines
 */

import { LeadSource } from '../../../../domain/value-objects/lead-management/LeadSource';

// JSONB Database Interface for LeadSource
export interface SourceJsonb {
  type: 'chatbot' | 'form' | 'api';
  chatbotName?: string | null;
  referrerUrl?: string | null;
  campaignSource?: string | null;
  medium: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * LeadSource Database Mapper
 * Handles transformation between LeadSource domain value object and database JSONB
 */
export class LeadSourceDatabaseMapper {
  /** Map JSONB source to domain props */
  static mapSource(data: SourceJsonb) {
    // Transform database schema to domain schema
    return {
      channel: 'chatbot_widget' as const,
      campaign: data.campaignSource || undefined,
      referrer: data.referrerUrl || undefined,
      utmSource: undefined, // Not stored in current JSONB schema
      utmMedium: data.medium || undefined,
      utmCampaign: data.campaignSource || undefined,
      pageUrl: data.referrerUrl || 'https://example.com', // Required field, provide fallback
      pageTitle: data.chatbotName || undefined,
    };
  }

  /** Transform domain LeadSource to JSONB */
  static domainSourceToJsonb(source: LeadSource): SourceJsonb {
    const props = source.toPlainObject();
    // Transform domain schema to database schema
    return {
      type: 'chatbot',
      chatbotName: props.pageTitle || null,
      referrerUrl: props.referrer || props.pageUrl || null,
      campaignSource: props.campaign || props.utmCampaign || null,
      medium: props.utmMedium || 'chat',
      ipAddress: null, // Not available in domain
      userAgent: null, // Not available in domain
    };
  }
}