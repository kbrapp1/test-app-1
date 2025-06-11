export interface ChatbotConfigProps {
  id: string;
  organizationId: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  personalitySettings: PersonalitySettings;
  knowledgeBase: KnowledgeBase;
  operatingHours: OperatingHours;
  leadQualificationQuestions: LeadQualificationQuestion[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalitySettings {
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  communicationStyle: 'direct' | 'conversational' | 'helpful' | 'sales-focused';
  responseLength: 'brief' | 'detailed' | 'adaptive';
  escalationTriggers: string[];
}

export interface KnowledgeBase {
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

export interface OperatingHours {
  timezone: string;
  businessHours: BusinessHours[];
  holidaySchedule: Holiday[];
  outsideHoursMessage: string;
}

export interface BusinessHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
}

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  isRecurring: boolean;
}

export interface LeadQualificationQuestion {
  id: string;
  question: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'multiselect';
  options?: string[];
  isRequired: boolean;
  order: number;
  scoringWeight: number;
}

export class ChatbotConfig {
  private constructor(private readonly props: ChatbotConfigProps) {
    this.validateProps(props);
  }

  static create(props: Omit<ChatbotConfigProps, 'id' | 'createdAt' | 'updatedAt'>): ChatbotConfig {
    const now = new Date();
    return new ChatbotConfig({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ChatbotConfigProps): ChatbotConfig {
    return new ChatbotConfig(props);
  }

  private validateProps(props: ChatbotConfigProps): void {
    if (!props.organizationId?.trim()) {
      throw new Error('Organization ID is required');
    }
    if (!props.name?.trim()) {
      throw new Error('Chatbot name is required');
    }
    if (props.name.length > 100) {
      throw new Error('Chatbot name must be 100 characters or less');
    }
    if (props.leadQualificationQuestions.length === 0) {
      throw new Error('At least one lead qualification question is required');
    }
    
    // Validate operating hours
    if (!props.operatingHours.timezone) {
      throw new Error('Timezone is required for operating hours');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get avatarUrl(): string | undefined { return this.props.avatarUrl; }
  get description(): string | undefined { return this.props.description; }
  get personalitySettings(): PersonalitySettings { return this.props.personalitySettings; }
  get knowledgeBase(): KnowledgeBase { return this.props.knowledgeBase; }
  get operatingHours(): OperatingHours { return this.props.operatingHours; }
  get leadQualificationQuestions(): LeadQualificationQuestion[] { return this.props.leadQualificationQuestions; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  updatePersonality(settings: PersonalitySettings): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      personalitySettings: settings,
      updatedAt: new Date(),
    });
  }

  updateKnowledgeBase(knowledgeBase: KnowledgeBase): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      knowledgeBase,
      updatedAt: new Date(),
    });
  }

  updateOperatingHours(operatingHours: OperatingHours): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      operatingHours,
      updatedAt: new Date(),
    });
  }

  addLeadQualificationQuestion(question: LeadQualificationQuestion): ChatbotConfig {
    const existingQuestions = this.props.leadQualificationQuestions;
    const newQuestions = [...existingQuestions, question];
    
    return new ChatbotConfig({
      ...this.props,
      leadQualificationQuestions: newQuestions,
      updatedAt: new Date(),
    });
  }

  removeLeadQualificationQuestion(questionId: string): ChatbotConfig {
    const filteredQuestions = this.props.leadQualificationQuestions.filter(q => q.id !== questionId);
    
    if (filteredQuestions.length === 0) {
      throw new Error('Cannot remove all lead qualification questions');
    }
    
    return new ChatbotConfig({
      ...this.props,
      leadQualificationQuestions: filteredQuestions,
      updatedAt: new Date(),
    });
  }

  activate(): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  deactivate(): ChatbotConfig {
    return new ChatbotConfig({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  isWithinOperatingHours(timestamp: Date = new Date()): boolean {
    const now = new Date(timestamp.toLocaleString("en-US", { timeZone: this.props.operatingHours.timezone }));
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if it's a holiday
    const dateString = now.toISOString().split('T')[0];
    const isHoliday = this.props.operatingHours.holidaySchedule.some(holiday => 
      holiday.date === dateString || (holiday.isRecurring && holiday.date.slice(5) === dateString.slice(5))
    );
    
    if (isHoliday) {
      return false;
    }
    
    // Check business hours for the day
    const todayHours = this.props.operatingHours.businessHours.find(hours => 
      hours.dayOfWeek === dayOfWeek && hours.isActive
    );
    
    if (!todayHours) {
      return false;
    }
    
    return currentTime >= todayHours.startTime && currentTime <= todayHours.endTime;
  }

  generateSystemPrompt(): string {
    const { personalitySettings, knowledgeBase } = this.props;
    
    let prompt = `You are ${this.props.name}, a helpful assistant for this organization. `;
    
    // Add personality
    switch (personalitySettings.tone) {
      case 'professional':
        prompt += 'Maintain a professional and courteous tone. ';
        break;
      case 'friendly':
        prompt += 'Be warm, friendly, and approachable. ';
        break;
      case 'casual':
        prompt += 'Keep the conversation casual and relaxed. ';
        break;
      case 'formal':
        prompt += 'Use formal language and maintain business etiquette. ';
        break;
    }
    
    // Add communication style
    switch (personalitySettings.communicationStyle) {
      case 'direct':
        prompt += 'Be direct and concise in your responses. ';
        break;
      case 'conversational':
        prompt += 'Engage in natural, conversational dialogue. ';
        break;
      case 'helpful':
        prompt += 'Focus on being helpful and providing value. ';
        break;
      case 'sales-focused':
        prompt += 'Guide conversations toward sales opportunities while being helpful. ';
        break;
    }
    
    // Add company knowledge
    if (knowledgeBase.companyInfo) {
      prompt += `\n\nCompany Information:\n${knowledgeBase.companyInfo}\n`;
    }
    
    // Add FAQs
    if (knowledgeBase.faqs.length > 0) {
      prompt += '\n\nFrequently Asked Questions:\n';
      knowledgeBase.faqs
        .filter(faq => faq.isActive)
        .forEach(faq => {
          prompt += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
        });
    }
    
    // Add compliance guidelines
    if (knowledgeBase.complianceGuidelines) {
      prompt += `\n\nCompliance Guidelines:\n${knowledgeBase.complianceGuidelines}\n`;
    }
    
    // Add lead qualification guidance
    prompt += '\n\nLead Qualification: When appropriate, ask qualifying questions to help identify potential customers. ';
    prompt += 'Be natural about gathering contact information when the visitor shows interest in products or services.';
    
    return prompt;
  }

  toPlainObject(): ChatbotConfigProps {
    return { ...this.props };
  }
} 