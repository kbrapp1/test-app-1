/**
 * Knowledge Base Value Object
 * 
 * Domain layer value object representing chatbot knowledge and content.
 * Immutable object that encapsulates knowledge management and validation.
 */

export interface KnowledgeBaseProps {
  companyInfo: string;
  productCatalog: string;
  faqs: FAQ[];
  supportDocs: string;
  complianceGuidelines: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
}

export class KnowledgeBase {
  private constructor(private readonly props: KnowledgeBaseProps) {
    this.validateProps(props);
  }

  static create(props: KnowledgeBaseProps): KnowledgeBase {
    return new KnowledgeBase(props);
  }

  static createEmpty(): KnowledgeBase {
    return new KnowledgeBase({
      companyInfo: '',
      productCatalog: '',
      faqs: [],
      supportDocs: '',
      complianceGuidelines: '',
    });
  }

  private validateProps(props: KnowledgeBaseProps): void {
    if (!Array.isArray(props.faqs)) {
      throw new Error('FAQs must be an array');
    }
    
    // Validate FAQ structure
    props.faqs.forEach((faq, index) => {
      if (!faq.id?.trim()) {
        throw new Error(`FAQ at index ${index} must have an ID`);
      }
      if (!faq.question?.trim()) {
        throw new Error(`FAQ at index ${index} must have a question`);
      }
      if (!faq.answer?.trim()) {
        throw new Error(`FAQ at index ${index} must have an answer`);
      }
      if (!faq.category?.trim()) {
        throw new Error(`FAQ at index ${index} must have a category`);
      }
    });
  }

  // Getters
  get companyInfo(): string { return this.props.companyInfo; }
  get productCatalog(): string { return this.props.productCatalog; }
  get faqs(): FAQ[] { return [...this.props.faqs]; }
  get supportDocs(): string { return this.props.supportDocs; }
  get complianceGuidelines(): string { return this.props.complianceGuidelines; }

  // Business methods
  updateCompanyInfo(info: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      companyInfo: info,
    });
  }

  updateProductCatalog(catalog: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      productCatalog: catalog,
    });
  }

  updateSupportDocs(docs: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      supportDocs: docs,
    });
  }

  updateComplianceGuidelines(guidelines: string): KnowledgeBase {
    return new KnowledgeBase({
      ...this.props,
      complianceGuidelines: guidelines,
    });
  }

  addFAQ(faq: FAQ): KnowledgeBase {
    // Check for duplicate ID
    if (this.props.faqs.some(existing => existing.id === faq.id)) {
      throw new Error(`FAQ with ID ${faq.id} already exists`);
    }

    return new KnowledgeBase({
      ...this.props,
      faqs: [...this.props.faqs, faq],
    });
  }

  updateFAQ(faqId: string, updates: Partial<Omit<FAQ, 'id'>>): KnowledgeBase {
    const faqIndex = this.props.faqs.findIndex(faq => faq.id === faqId);
    if (faqIndex === -1) {
      throw new Error(`FAQ with ID ${faqId} not found`);
    }

    const updatedFAQs = [...this.props.faqs];
    updatedFAQs[faqIndex] = { ...updatedFAQs[faqIndex], ...updates };

    return new KnowledgeBase({
      ...this.props,
      faqs: updatedFAQs,
    });
  }

  removeFAQ(faqId: string): KnowledgeBase {
    const filteredFAQs = this.props.faqs.filter(faq => faq.id !== faqId);
    
    return new KnowledgeBase({
      ...this.props,
      faqs: filteredFAQs,
    });
  }

  activateFAQ(faqId: string): KnowledgeBase {
    return this.updateFAQ(faqId, { isActive: true });
  }

  deactivateFAQ(faqId: string): KnowledgeBase {
    return this.updateFAQ(faqId, { isActive: false });
  }

  getActiveFAQs(): FAQ[] {
    return this.props.faqs.filter(faq => faq.isActive);
  }

  getFAQsByCategory(category: string): FAQ[] {
    return this.props.faqs.filter(faq => faq.category === category && faq.isActive);
  }

  searchFAQs(query: string): FAQ[] {
    const lowerQuery = query.toLowerCase();
    return this.props.faqs.filter(faq => 
      faq.isActive && (
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery) ||
        faq.category.toLowerCase().includes(lowerQuery)
      )
    );
  }

  getCategories(): string[] {
    const categories = new Set(this.props.faqs.map(faq => faq.category));
    return Array.from(categories).sort();
  }

  isEmpty(): boolean {
    return !this.props.companyInfo.trim() &&
           !this.props.productCatalog.trim() &&
           !this.props.supportDocs.trim() &&
           !this.props.complianceGuidelines.trim() &&
           this.props.faqs.length === 0;
  }

  toPlainObject(): KnowledgeBaseProps {
    return { ...this.props };
  }
} 