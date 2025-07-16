/**
 * Lead Source Value Object
 * 
 * Domain Value Object: Immutable lead source and attribution data
 * Single Responsibility: Lead tracking and attribution management
 * Following DDD value object patterns
 */

export interface LeadSourceProps {
  channel: 'chatbot_widget';
  campaign?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pageUrl: string;
  pageTitle?: string;
}

export class LeadSource {
  private constructor(private readonly props: LeadSourceProps) {
    this.validateProps(props);
  }

  static create(props: LeadSourceProps): LeadSource {
    return new LeadSource(props);
  }

  static fromPersistence(props: LeadSourceProps): LeadSource {
    return new LeadSource(props);
  }

  static createFromChatbotWidget(
    pageUrl: string,
    pageTitle?: string,
    campaign?: string,
    referrer?: string,
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
    }
  ): LeadSource {
    return new LeadSource({
      channel: 'chatbot_widget',
      pageUrl,
      pageTitle,
      campaign,
      referrer,
      utmSource: utmParams?.source,
      utmMedium: utmParams?.medium,
      utmCampaign: utmParams?.campaign,
    });
  }

  private validateProps(props: LeadSourceProps): void {
    if (props.channel !== 'chatbot_widget') {
      throw new Error('Lead source channel must be chatbot_widget');
    }

    if (!props.pageUrl?.trim()) {
      throw new Error('Page URL is required for lead source');
    }

    if (!this.isValidUrl(props.pageUrl)) {
      throw new Error('Page URL must be a valid URL');
    }

    if (props.referrer && !this.isValidUrl(props.referrer)) {
      throw new Error('Referrer must be a valid URL');
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_error) {
      return false;
    }
  }

  // Getters
  get channel(): 'chatbot_widget' { return this.props.channel; }
  get campaign(): string | undefined { return this.props.campaign; }
  get referrer(): string | undefined { return this.props.referrer; }
  get utmSource(): string | undefined { return this.props.utmSource; }
  get utmMedium(): string | undefined { return this.props.utmMedium; }
  get utmCampaign(): string | undefined { return this.props.utmCampaign; }
  get pageUrl(): string { return this.props.pageUrl; }
  get pageTitle(): string | undefined { return this.props.pageTitle; }

  // Business methods
  updateCampaign(campaign: string): LeadSource {
    return LeadSource.create({
      ...this.props,
      campaign,
    });
  }

  updateUtmParams(utmSource?: string, utmMedium?: string, utmCampaign?: string): LeadSource {
    return LeadSource.create({
      ...this.props,
      utmSource,
      utmMedium,
      utmCampaign,
    });
  }

  updatePageInfo(pageUrl: string, pageTitle?: string): LeadSource {
    return LeadSource.create({
      ...this.props,
      pageUrl,
      pageTitle,
    });
  }

  updateReferrer(referrer: string): LeadSource {
    return LeadSource.create({
      ...this.props,
      referrer,
    });
  }

  // Query methods
  hasCampaignInfo(): boolean {
    return !!(this.props.campaign || this.props.utmCampaign);
  }

  hasUtmParams(): boolean {
    return !!(this.props.utmSource || this.props.utmMedium || this.props.utmCampaign);
  }

  hasReferrer(): boolean {
    return !!this.props.referrer;
  }

  isFromSocialMedia(): boolean {
    const socialDomains = [
      'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
      'tiktok.com', 'youtube.com', 'pinterest.com', 'snapchat.com'
    ];

    if (this.props.referrer) {
      try {
        const referrerDomain = new URL(this.props.referrer).hostname.toLowerCase();
        return socialDomains.some(domain => referrerDomain.includes(domain));
      } catch (_error) {
        return false;
      }
    }

    return false;
  }

  isFromSearchEngine(): boolean {
    const searchDomains = [
      'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
      'baidu.com', 'yandex.com', 'ask.com'
    ];

    if (this.props.referrer) {
      try {
        const referrerDomain = new URL(this.props.referrer).hostname.toLowerCase();
        return searchDomains.some(domain => referrerDomain.includes(domain));
      } catch (_error) {
        return false;
      }
    }

    return this.props.utmMedium === 'search' || this.props.utmMedium === 'organic';
  }

  isFromEmailCampaign(): boolean {
    return this.props.utmMedium === 'email' || 
           (this.props.utmSource?.includes('email') ?? false) ||
           (this.props.campaign?.includes('email') ?? false);
  }

  isFromPaidAdvertising(): boolean {
    const paidMediums = ['cpc', 'ppc', 'paid', 'advertising', 'ads'];
    return !!this.props.utmMedium && paidMediums.some(medium => 
      this.props.utmMedium!.toLowerCase().includes(medium)
    );
  }

  getTrafficSource(): 'direct' | 'referral' | 'social' | 'search' | 'email' | 'paid' | 'other' {
    if (this.isFromPaidAdvertising()) return 'paid';
    if (this.isFromEmailCampaign()) return 'email';
    if (this.isFromSearchEngine()) return 'search';
    if (this.isFromSocialMedia()) return 'social';
    if (this.hasReferrer()) return 'referral';
    if (!this.hasReferrer() && !this.hasUtmParams()) return 'direct';
    return 'other';
  }

  getAttributionString(): string {
    const parts: string[] = [];
    
    if (this.props.utmSource) parts.push(`source:${this.props.utmSource}`);
    if (this.props.utmMedium) parts.push(`medium:${this.props.utmMedium}`);
    if (this.props.utmCampaign) parts.push(`campaign:${this.props.utmCampaign}`);
    if (this.props.campaign) parts.push(`camp:${this.props.campaign}`);
    
    if (parts.length === 0 && this.props.referrer) {
      try {
        const domain = new URL(this.props.referrer).hostname;
        parts.push(`referrer:${domain}`);
      } catch (_error) {
        parts.push('referrer:unknown');
      }
    }
    
    return parts.length > 0 ? parts.join('|') : 'direct';
  }

  getDomain(): string {
    try {
      return new URL(this.props.pageUrl).hostname;
    } catch (_error) {
      return 'unknown';
    }
  }

  getPath(): string {
    try {
      return new URL(this.props.pageUrl).pathname;
    } catch (_error) {
      return '/';
    }
  }

  // Export methods
  toPlainObject(): LeadSourceProps {
    return { ...this.props };
  }

  toSummary(): object {
    return {
      channel: this.props.channel,
      trafficSource: this.getTrafficSource(),
      attribution: this.getAttributionString(),
      domain: this.getDomain(),
      path: this.getPath(),
      pageTitle: this.props.pageTitle,
      hasCampaign: this.hasCampaignInfo(),
      hasUtmParams: this.hasUtmParams(),
      hasReferrer: this.hasReferrer(),
    };
  }

  toAnalyticsData(): object {
    return {
      channel: this.props.channel,
      source: this.props.utmSource || 'direct',
      medium: this.props.utmMedium || 'none',
      campaign: this.props.utmCampaign || this.props.campaign || 'none',
      content: this.props.pageTitle || 'unknown',
      term: undefined, // Could be added if we track search terms
      referrer: this.props.referrer,
      landingPage: this.props.pageUrl,
    };
  }
} 