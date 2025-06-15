/**
 * Contact Info Value Object
 * 
 * Domain Value Object: Immutable contact information data
 * Single Responsibility: Contact data validation and operations
 * Following DDD value object patterns
 */

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ContactInfoProps {
  email?: string;
  phone?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  linkedin?: string;
  address?: Address;
}

export class ContactInfo {
  private constructor(private readonly props: ContactInfoProps) {
    this.validateProps(props);
  }

  static create(props: ContactInfoProps): ContactInfo {
    return new ContactInfo(props);
  }

  static fromPersistence(props: ContactInfoProps): ContactInfo {
    return new ContactInfo(props);
  }

  private validateProps(props: ContactInfoProps): void {
    if (!props.email && !props.phone) {
      throw new Error('At least email or phone is required');
    }

    if (props.email && !this.isValidEmail(props.email)) {
      throw new Error('Invalid email format');
    }

    if (props.phone && !this.isValidPhone(props.phone)) {
      throw new Error('Invalid phone format');
    }

    if (props.website && !this.isValidUrl(props.website)) {
      throw new Error('Invalid website URL format');
    }

    if (props.linkedin && !this.isValidLinkedInUrl(props.linkedin)) {
      throw new Error('Invalid LinkedIn URL format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Remove all non-digit characters and check if we have 10-15 digits
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidLinkedInUrl(url: string): boolean {
    return url.includes('linkedin.com') && this.isValidUrl(url);
  }

  // Getters
  get email(): string | undefined { return this.props.email; }
  get phone(): string | undefined { return this.props.phone; }
  get name(): string | undefined { return this.props.name; }
  get firstName(): string | undefined { return this.props.firstName; }
  get lastName(): string | undefined { return this.props.lastName; }
  get company(): string | undefined { return this.props.company; }
  get jobTitle(): string | undefined { return this.props.jobTitle; }
  get website(): string | undefined { return this.props.website; }
  get linkedin(): string | undefined { return this.props.linkedin; }
  get address(): Address | undefined { return this.props.address; }

  // Business methods
  updateEmail(email: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      email,
    });
  }

  updatePhone(phone: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      phone,
    });
  }

  updateName(firstName?: string, lastName?: string, fullName?: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      firstName,
      lastName,
      name: fullName,
    });
  }

  updateCompanyInfo(company?: string, jobTitle?: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      company,
      jobTitle,
    });
  }

  updateSocialInfo(website?: string, linkedin?: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      website,
      linkedin,
    });
  }

  updateAddress(address: Address): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      address,
    });
  }

  // Query methods
  hasEmail(): boolean {
    return !!this.props.email;
  }

  hasPhone(): boolean {
    return !!this.props.phone;
  }

  hasCompanyInfo(): boolean {
    return !!(this.props.company || this.props.jobTitle);
  }

  hasCompleteAddress(): boolean {
    const addr = this.props.address;
    return !!(addr?.street && addr?.city && addr?.state && addr?.zipCode);
  }

  getDisplayName(): string {
    if (this.props.name) {
      return this.props.name;
    }
    
    if (this.props.firstName && this.props.lastName) {
      return `${this.props.firstName} ${this.props.lastName}`;
    }
    
    if (this.props.firstName) {
      return this.props.firstName;
    }
    
    return this.props.email || this.props.phone || 'Unknown Contact';
  }

  getFormattedAddress(): string {
    const addr = this.props.address;
    if (!addr) return '';

    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Export methods
  toPlainObject(): ContactInfoProps {
    return { ...this.props };
  }

  toSummary(): object {
    return {
      displayName: this.getDisplayName(),
      email: this.props.email,
      phone: this.props.phone,
      company: this.props.company,
      jobTitle: this.props.jobTitle,
      hasCompleteInfo: this.hasEmail() && this.hasPhone() && this.hasCompanyInfo(),
    };
  }
} 