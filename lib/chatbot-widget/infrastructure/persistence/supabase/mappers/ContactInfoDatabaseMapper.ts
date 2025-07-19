/**
 * ContactInfo Database Mapper
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: ContactInfo value object mapping only
 * - Handle transformation between domain ContactInfo and database JSONB
 * - Use domain-specific errors with proper context
 * - Stay under 100 lines
 */

import { ContactInfo } from '../../../../domain/value-objects/lead-management/ContactInfo';

// JSONB Database Interface for ContactInfo
export interface ContactInfoJsonb {
  name?: string;
  firstName?: string; 
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  linkedin?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

/**
 * ContactInfo Database Mapper
 * Handles transformation between ContactInfo domain value object and database JSONB
 */
export class ContactInfoDatabaseMapper {
  /** Map JSONB contact info to domain props */
  static mapContactInfo(data: ContactInfoJsonb) {
    return {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      website: data.website,
      linkedin: data.linkedin,
      address: data.address ? {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode,
        country: data.address.country,
      } : undefined,
    };
  }

  /** Transform domain ContactInfo to JSONB */
  static domainContactInfoToJsonb(contactInfo: ContactInfo): ContactInfoJsonb {
    const props = contactInfo.toPlainObject();
    return {
      name: props.name,
      firstName: props.firstName,
      lastName: props.lastName,
      email: props.email,
      phone: props.phone,
      company: props.company,
      jobTitle: props.jobTitle,
      website: props.website,
      linkedin: props.linkedin,
      address: props.address ? {
        street: props.address.street,
        city: props.address.city,
        state: props.address.state,
        zipCode: props.address.zipCode,
        country: props.address.country,
      } : undefined,
    };
  }
}