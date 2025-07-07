# Chatbot Widget - Design Architecture

## Executive Summary

The chatbot-widget domain represents a sophisticated implementation of Domain-Driven Design (DDD) principles within the Next.js 15 enterprise application. This comprehensive design document covers the domain's bounded contexts, architectural patterns, AI integration strategies, and technical implementation details across all DDD layers.

## Table of Contents

1. [Domain Boundaries & Bounded Context](#domain-boundaries--bounded-context)
2. [Domain Layer Architecture](#domain-layer-architecture)
3. [Application Layer Design](#application-layer-design)
4. [Infrastructure Layer Integration](#infrastructure-layer-integration)
5. [Presentation Layer Patterns](#presentation-layer-patterns)
6. [AI Integration Architecture](#ai-integration-architecture)
7. [Error Handling & Security](#error-handling--security)
8. [Performance & Scalability](#performance--scalability)

## Domain Boundaries & Bounded Context

### Core Domain Identity

```
Domain Name: Chatbot Widget
Bounded Context: AI-powered conversational interface with lead management
Primary Responsibility: End-to-end conversational AI workflows
Ubiquitous Language: ChatSession, Lead, ConversationFlow, KnowledgeBase, PersonaGeneration
```

### Strategic Design Patterns

The domain follows sophisticated DDD patterns with clear separation of concerns:

```
lib/chatbot-widget/
├── domain/           # Pure business logic & domain models
│   ├── entities/     # Domain entities with business methods
│   ├── value-objects/ # Immutable domain concepts
│   ├── services/     # Domain services for business logic
│   ├── repositories/ # Repository interfaces
│   └── errors/       # Domain-specific errors
├── application/      # Use cases & orchestration services
│   ├── use-cases/    # Application-specific business rules
│   ├── services/     # Application coordination services
│   ├── dto/          # Data transfer objects
│   └── commands/     # Command objects and handlers
├── infrastructure/   # External integrations & persistence
│   ├── persistence/  # Supabase repositories
│   ├── providers/    # External API clients (OpenAI, etc.)
│   └── composition/  # Dependency injection
└── presentation/     # UI components & React hooks
    ├── components/   # React components
    ├── hooks/        # React hooks
    ├── actions/      # Next.js server actions
    └── types/        # Presentation types
```

## Domain Layer Architecture

### Core Entities

#### 1. ChatbotConfig (Aggregate Root)

**Primary Aggregate**: Central configuration entity managing the complete chatbot setup.

```typescript
// Location: lib/chatbot-widget/domain/entities/ChatbotConfig.ts
export class ChatbotConfig {
  private constructor(
    private readonly _id: string,
    private readonly _organizationId: string,
    private readonly _name: string,
    private readonly _aiConfiguration: AIConfiguration,
    private readonly _knowledgeBase: KnowledgeBase,
    private readonly _personalitySettings: PersonalitySettings,
    private readonly _operatingHours: OperatingHours,
    private readonly _isActive: boolean,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  // Business Methods
  updatePersonality(settings: PersonalitySettings): ChatbotConfig
  updateKnowledgeBase(knowledgeBase: KnowledgeBase): ChatbotConfig
  activate(): ChatbotConfig
  deactivate(): ChatbotConfig
  
  // Factory Methods
  static create(params: ChatbotConfigCreationParams): ChatbotConfig
  static reconstruct(data: ChatbotConfigData): ChatbotConfig
}
```

**Key Characteristics**:
- Immutable entity following @golden-rule patterns
- Coordinates value objects: PersonalitySettings, KnowledgeBase, OperatingHours, AIConfiguration
- Business validation and rule enforcement
- Factory methods for creation and reconstruction

**Business Rules**:
- Organization ID validation (required, non-empty)
- Name length constraints (≤100 characters)
- Operating hours timezone requirement
- AI configuration defaults management

#### 2. ChatSession (Rich Entity)

**Conversation Management**: Sophisticated session entity with conversational context.

```typescript
// Location: lib/chatbot-widget/domain/entities/ChatSession.ts
export class ChatSession {
  private constructor(
    private readonly _id: string,
    private readonly _organizationId: string,
    private readonly _chatbotConfigId: string,
    private readonly _sessionContext: SessionContext,
    private readonly _leadQualificationState: LeadQualificationState,
    private readonly _isActive: boolean,
    private readonly _lastActivityAt: Date,
    private readonly _createdAt: Date
  ) {}

  // Business Methods
  addMessage(message: ChatMessage): ChatSession
  updateContext(context: SessionContext): ChatSession
  qualifyLead(qualificationData: QualificationData): ChatSession
  checkForTimeout(timeoutMinutes: number): boolean
  
  // Context Management
  accumulateEntities(entities: ExtractedEntities): ChatSession
  updateConversationPhase(phase: ConversationPhase): ChatSession
}
```

**Key Features**:
- Rich context accumulation through `SessionContext` value object
- Lead qualification state management via `LeadQualificationState`
- Activity tracking with automatic timeout detection
- Conversation flow progression with phase tracking
- Entity accumulation system for business intelligence

#### 3. ChatMessage (Event-Driven Entity)

**Message Processing**: Rich message entity with comprehensive metadata.

```typescript
// Location: lib/chatbot-widget/domain/entities/ChatMessage.ts
export class ChatMessage {
  private constructor(
    private readonly _id: string,
    private readonly _sessionId: string,
    private readonly _content: string,
    private readonly _role: MessageRole,
    private readonly _timestamp: Date,
    private readonly _aiMetadata?: MessageAIMetadata,
    private readonly _contextMetadata?: MessageContextMetadata,
    private readonly _processingMetrics?: MessageProcessingMetrics
  ) {}

  // Factory Methods
  static createUserMessage(params: UserMessageParams): ChatMessage
  static createBotMessage(params: BotMessageParams): ChatMessage
  static createSystemMessage(params: SystemMessageParams): ChatMessage
  
  // Business Methods
  addAIMetadata(metadata: MessageAIMetadata): ChatMessage
  addProcessingMetrics(metrics: MessageProcessingMetrics): ChatMessage
  calculateCost(): number
}
```

**Advanced Features**:
- Collision-resistant ID generation with timestamp-based uniqueness
- Composed value objects for comprehensive metadata tracking
- Cost tracking and token management
- Processing step accumulation for debugging

#### 4. Lead (Business Entity)

**Lead Management**: Complete lead lifecycle management entity.

```typescript
// Location: lib/chatbot-widget/domain/entities/Lead.ts
export class Lead {
  private constructor(
    private readonly _id: string,
    private readonly _organizationId: string,
    private readonly _sessionId: string,
    private readonly _contactInfo: ContactInfo,
    private readonly _qualificationData: QualificationData,
    private readonly _leadScore: number,
    private readonly _status: LeadStatus,
    private readonly _source: LeadSource,
    private readonly _capturedAt: Date
  ) {}

  // Business Methods
  markAsContacted(contactedAt: Date, contactedBy: string): Lead
  markAsConverted(convertedAt: Date, conversionValue?: number): Lead
  updateQualificationData(data: QualificationData): Lead
  assignToUser(assignedUserId: string): Lead
}
```

### Value Objects Architecture

#### AI Configuration System

**AIConfiguration**: Sophisticated configuration coordination pattern.

```typescript
// Location: lib/chatbot-widget/domain/value-objects/ai-configuration/
interface AIConfiguration {
  readonly openai: OpenAIConfiguration;
  readonly context: ContextConfiguration;
  readonly intent: IntentConfiguration;
  readonly entity: EntityConfiguration;
  readonly conversation: ConversationConfiguration;
  readonly leadScoring: LeadScoringConfiguration;
  readonly monitoring: MonitoringConfiguration;
}
```

**Composition Strategy**:
- **OpenAIConfiguration**: Model settings and parameters
- **ContextConfiguration**: Token window management
- **IntentConfiguration**: Intent classification settings
- **EntityConfiguration**: Entity extraction configuration
- **ConversationConfiguration**: Flow management settings
- **LeadScoringConfiguration**: Scoring algorithm parameters
- **MonitoringConfiguration**: Performance tracking settings

**Design Patterns**:
- Composition over inheritance
- Immutable updates with factory methods
- Default configuration management
- Validation delegation to specialized services

#### Session Management Value Objects

**SessionContext**: Multi-dimensional conversation tracking.

```typescript
// Location: lib/chatbot-widget/domain/value-objects/conversation-management/
interface SessionContext {
  readonly conversationSummary: string;
  readonly currentPhase: ConversationPhase;
  readonly accumulatedEntities: AccumulatedEntities;
  readonly conversationObjectives: ConversationObjectives;
  readonly userBehaviorPatterns: UserBehaviorPattern[];
  readonly responseQuality: ResponseQuality;
}

interface AccumulatedEntities {
  // Individual entities with metadata
  readonly visitorName?: EntityWithMetadata<string>;
  readonly companyName?: EntityWithMetadata<string>;
  readonly jobTitle?: EntityWithMetadata<string>;
  readonly email?: EntityWithMetadata<string>;
  readonly phoneNumber?: EntityWithMetadata<string>;
  
  // Array entities (accumulative)
  readonly decisionMakers: string[];
  readonly painPoints: string[];
  readonly integrationNeeds: string[];
  readonly currentSolutions: string[];
  readonly budget: string[];
  readonly timeline: string[];
}
```

### Domain Services

#### AI Configuration Services

**Responsibility**: Specialized AI behavior management.

```typescript
// Key Services:
1. DynamicPromptService         # Template-driven prompt generation
2. PersonaGenerationService     # Context-aware persona creation
3. ConversationAnalysisService  # Intent and entity analysis
4. KnowledgeBaseService         # Content optimization and retrieval
5. PromptCoordinationService    # Content deduplication and priority management
```

**DynamicPromptService**: Template-driven prompt generation with coordination.

```typescript
// Location: lib/chatbot-widget/domain/services/ai-configuration/DynamicPromptService.ts
export class DynamicPromptService {
  generateSystemPrompt(
    config: ChatbotConfig,
    context: ConversationContext,
    knowledgeContent: KnowledgeContent[]
  ): PromptGenerationResult;
  
  coordinatePromptSections(
    sections: PromptSection[],
    options: PromptCoordinationOptions
  ): CoordinatedPromptResult;
}
```

#### Content Processing Services

**Content Management**: Advanced content handling and validation.

```typescript
// Services:
1. ContentValidationService        # Multi-layered validation
2. UserContentSanitizationService  # Security-focused content cleaning
3. ContentDeduplicationService     # Intelligent content deduplication
4. UrlNormalizationService         # URL standardization
```

#### Session Management Services

**Session Orchestration**: Complete session lifecycle management.

```typescript
// Core Services:
1. SessionContextService              # Context data management
2. SessionStateService               # State transition management
3. SessionLeadQualificationService   # Lead qualification workflow
4. ChatSessionValidationService      # Session validation rules
```

## Application Layer Design

### Use Cases (CQRS Pattern)

#### Primary Use Cases

```typescript
// Application Use Cases:
1. ProcessChatMessageUseCase    # Complete message processing orchestration
2. InitializeChatSessionUseCase # Session creation and setup
3. CaptureLeadUseCase          # Lead capture workflow
4. ConfigureChatbotUseCase     # Configuration management
5. CrawlWebsiteUseCase         # Knowledge base content acquisition
6. ValidateContentUseCase      # Content validation workflow
7. SanitizeUserContentUseCase  # Content sanitization
```

#### ProcessChatMessageUseCase Deep Dive

**Orchestration Pattern**: 5-step workflow with comprehensive logging.

```typescript
// Location: lib/chatbot-widget/application/use-cases/ProcessChatMessageUseCase.ts
export class ProcessChatMessageUseCase {
  async execute(command: SendMessageCommand): Promise<ProcessMessageResult> {
    // Step 1: Initialize workflow
    const initResult = await this.initializeWorkflow(command);
    
    // Step 2: Process user message
    const processResult = await this.processUserMessage(initResult);
    
    // Step 3: Analyze conversation context
    const analysisResult = await this.analyzeConversationContext(processResult);
    
    // Step 4: Generate AI response
    const responseResult = await this.generateAIResponse(analysisResult);
    
    // Step 5: Finalize and collect metrics
    return await this.finalizeProcessing(responseResult);
  }
}
```

**Workflow Steps**:
1. **Initialize**: Workflow validation and prerequisites
2. **Process**: User message processing and session updates
3. **Analyze**: Conversation context analysis with AI integration
4. **Generate**: AI response generation with enhanced context
5. **Finalize**: Metrics calculation and result assembly

### Application Services

#### Service Architecture

**Layered Service Organization**: Clean separation between coordination and domain logic.

```typescript
// Service Categories:
1. Message Processing Services
   - MessageProcessingWorkflowService
   - UnifiedResponseProcessorService
   
2. Conversation Management Services
   - ConversationContextManagementService
   - ConversationMetricsService
   - AiConversationService
   
3. Lead Management Services
   - LeadManagementService
   - LeadCaptureDecisionService
   
4. Context Injection Services
   - ContextInjectionApplicationService
   - ContextInjectionServiceFacade
```

#### Knowledge Base Management

**Comprehensive Content Management**: Multi-layered content processing.

```typescript
// Services:
1. KnowledgeBaseFormApplicationService  # Form data processing
2. WebsiteKnowledgeApplicationService   # Website content management
3. VectorKnowledgeApplicationService    # Vector search integration
4. EmbeddingApplicationService          # Embedding generation and management
```

## Infrastructure Layer Integration

### Composition Root Pattern

**ChatbotWidgetCompositionRoot**: Centralized dependency injection.

```typescript
// Location: lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot.ts
export class ChatbotWidgetCompositionRoot {
  static getProcessChatMessageUseCase(): ProcessChatMessageUseCase;
  static getInitializeChatSessionUseCase(): InitializeChatSessionUseCase;
  static getCaptureLeadUseCase(): CaptureLeadUseCase;
  static getConfigureChatbotUseCase(): ConfigureChatbotUseCase;
  
  // Health monitoring
  static getHealthStatus(): CompositionHealthStatus;
  static getCacheStatistics(): CacheStatistics;
}
```

**Composition Services**:
1. **RepositoryCompositionService**: Data access layer
2. **DomainServiceCompositionService**: Domain service factory
3. **ApplicationServiceCompositionService**: Application service coordination
4. **AIConfigurationCompositionService**: AI service configuration
5. **ErrorTrackingCompositionService**: Error handling services

### Persistence Layer (Supabase Integration)

#### Repository Implementation

**ChatbotConfigSupabaseRepository**: Domain repository interface implementation.

```typescript
// Location: lib/chatbot-widget/infrastructure/persistence/supabase/ChatbotConfigSupabaseRepository.ts
export class ChatbotConfigSupabaseRepository implements IChatbotConfigRepository {
  async findById(id: string): Promise<ChatbotConfig | null>;
  async findByOrganizationId(orgId: string): Promise<ChatbotConfig[]>;
  async save(config: ChatbotConfig): Promise<void>;
  async delete(id: string): Promise<void>;
  
  // Analytics support
  async getConfigStatistics(orgId: string): Promise<ConfigStatistics>;
  async getUsageMetrics(configId: string): Promise<UsageMetrics>;
}
```

**Design Patterns**:
- Repository interface implementation
- Mapper pattern for data transformation
- Error boundary with custom domain errors
- Service delegation for complex operations

#### Data Mapping Strategy

**ChatbotConfigMapper**: Bidirectional domain/persistence mapping.

```typescript
// Location: lib/chatbot-widget/infrastructure/persistence/supabase/mappers/ChatbotConfigMapper.ts
export class ChatbotConfigMapper {
  static toDomain(record: ChatbotConfigRecord): ChatbotConfig;
  static toPersistence(config: ChatbotConfig): ChatbotConfigRecord;
  static toDto(config: ChatbotConfig): ChatbotConfigDto;
  static fromDto(dto: ChatbotConfigDto): ChatbotConfig;
}
```

### AI Integration Architecture

#### OpenAI Provider Integration

**OpenAIProvider**: Comprehensive AI service integration.

```typescript
// Location: lib/chatbot-widget/infrastructure/providers/openai/OpenAIProvider.ts
export class OpenAIProvider implements IAIConversationService {
  async generateResponse(params: GenerateResponseParams): Promise<AIResponse>;
  async generateEmbedding(content: string): Promise<number[]>;
  async classifyIntent(message: string, context: ConversationContext): Promise<IntentResult>;
  async extractEntities(message: string): Promise<ExtractedEntities>;
  
  // Token and cost management
  async estimateTokens(messages: ChatMessage[]): Promise<TokenEstimate>;
  calculateCost(tokens: number, model: string): number;
}
```

**Features**:
- Multiple model support (GPT-4o, GPT-4o-mini)
- Token counting and cost tracking
- Embedding generation via `OpenAIEmbeddingService`
- Intent classification via `OpenAIIntentClassificationService`

#### Template Engine

**PromptTemplateEngine**: Dynamic prompt generation system.

```typescript
// Location: lib/chatbot-widget/infrastructure/providers/templating/PromptTemplateEngine.ts
export class PromptTemplateEngine {
  compileTemplate(templateSource: string): CompiledTemplate;
  renderTemplate(template: CompiledTemplate, context: TemplateContext): string;
  
  // Template management
  registerHelper(name: string, helper: TemplateHelper): void;
  loadTemplate(templatePath: string): Promise<CompiledTemplate>;
}
```

## Presentation Layer Patterns

### React Hooks Architecture

#### useChatbotConfiguration

**Comprehensive Configuration Management**: Unified hook for chatbot configuration.

```typescript
// Location: lib/chatbot-widget/presentation/hooks/useChatbotConfiguration.ts
export function useChatbotConfiguration(options: ConfigurationOptions = {}) {
  // React Query integration
  const configQuery = useQuery({
    queryKey: ['chatbot-config', options.organizationId],
    queryFn: () => fetchChatbotConfig(options.organizationId),
  });
  
  // Form state management
  const { formData, updateFormData, validateForm, resetForm } = useFormState();
  
  // CRUD operations
  const createConfigMutation = useMutation({
    mutationFn: createChatbotConfig,
    onSuccess: () => queryClient.invalidateQueries(['chatbot-config']),
  });
  
  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    error: configQuery.error,
    formData,
    updateFormData,
    createConfig: createConfigMutation.mutate,
    // ... other operations
  };
}
```

**Features**:
- React Query integration for server state
- Form state management with validation
- CRUD operations with optimistic updates
- Error handling and loading states
- Multi-configuration support

### Component Architecture

**Clean Component Organization**: Feature-based component structure.

```typescript
// Organization:
presentation/
├── components/admin/
│   ├── knowledge-base/          # Knowledge management UI
│   │   ├── KnowledgeBaseSection.tsx
│   │   ├── FaqManagementCard.tsx
│   │   ├── CompanyInformationCard.tsx
│   │   └── ContentGuidelines.tsx
│   ├── configuration/           # Configuration management
│   ├── lead-management/         # Lead management UI
│   ├── simulation/              # Chat simulation
│   └── widget-management/       # Widget embed management
├── hooks/                       # Reusable state management
├── actions/                     # Server actions
└── types/                      # Presentation type definitions
```

### Server Actions

**Next.js Integration**: Type-safe server actions with domain integration.

```typescript
// Action Categories:
1. configActions                 # Configuration management
2. contentValidationActions      # Content validation workflows
3. simulationActions            # Chat simulation
4. updateKnowledgeBaseActions   # Knowledge base management
5. websiteSourcesActions        # Website content management
```

## AI Integration Architecture

### Semantic Knowledge Integration

**Knowledge Retrieval**: Vector-based semantic search integration.

```typescript
// Architecture Components:
1. Embedding Generation         # OpenAI text-embedding-ada-002
2. Vector Storage              # Supabase vector extension
3. Relevance Scoring           # Cosine similarity ranking
4. Context Injection           # Knowledge content integration
```

### Conversation Intelligence

**Enhanced Context Management**: Multi-dimensional conversation analysis.

```typescript
// Features:
1. Intent Classification       # Multi-intent detection with confidence scoring
2. Entity Extraction          # Comprehensive entity accumulation system
3. Sentiment Analysis         # Emotional tone and engagement tracking
4. Conversation Flow          # Phase tracking and objective management
```

### Dynamic Prompt Assembly

**Template-Based Prompt Generation**: Sophisticated prompt coordination.

```typescript
// Process Flow:
1. Section Generation         # Service-specific content creation
2. Coordination              # Priority-based content deduplication
3. Template Processing       # Variable substitution and formatting
4. Context Integration       # Knowledge base content injection
```

## Error Handling & Security

### Domain Error Hierarchy

**ChatbotWidgetDomainErrors**: Comprehensive error classification.

```typescript
// Error Categories:
1. Base Errors               # DomainError, BusinessRuleViolationError
2. Conversation Errors       # Message processing, context management
3. AI Processing Errors      # Model errors, knowledge retrieval
4. Infrastructure Errors     # External services, persistence
5. Business Domain Errors    # Configuration, integration errors
```

### Multi-Tenant Security

**Organization-Level Isolation**: Comprehensive security boundaries.

```typescript
// Security Measures:
1. Row Level Security        # Database-level access control
2. Input Validation         # Multi-layered content validation
3. Content Sanitization     # XSS and injection prevention
4. API Rate Limiting        # Request throttling and abuse prevention
```

### AI Security

**Prompt Injection Prevention**: Secure AI interaction patterns.

```typescript
// Protection Strategies:
1. Input Sanitization       # Before AI processing
2. Output Validation        # After AI response generation
3. Template-Based Assembly  # Prevent injection attacks
4. Content Filtering        # Inappropriate response detection
```

## Performance & Scalability

### Token Management

**Context Window Optimization**: Intelligent token budget management.

```typescript
// Strategies:
1. Dynamic Context Window   # Conversation complexity-based sizing
2. Message Prioritization   # Context retention algorithms
3. Automatic Summarization  # Long conversation compression
4. Critical Message Preservation # Important context retention
```

### Caching Strategy

**Multi-Level Caching**: Performance optimization across layers.

```typescript
// Cache Types:
1. Knowledge Cache          # Vector embeddings and search results
2. Session Cache           # Active session context data
3. Configuration Cache     # Chatbot configuration data
4. Template Cache          # Compiled prompt templates
```

### Database Optimization

**Supabase Integration**: Optimized data access patterns.

```typescript
// Optimizations:
1. Row Level Security      # Multi-tenant isolation
2. Query Optimization      # Efficient patterns with proper indexing
3. Batch Operations        # Bulk data processing
4. Connection Pooling      # Concurrent access management
```

## Key Design Patterns & Architectural Decisions

### Domain-Driven Design Patterns

1. **Aggregate Root Pattern**: ChatbotConfig as central aggregate
2. **Entity Pattern**: Rich entities with business behavior
3. **Value Object Pattern**: Immutable data structures
4. **Domain Service Pattern**: Complex business logic encapsulation
5. **Repository Pattern**: Data access abstraction

### Clean Architecture Patterns

1. **Dependency Inversion**: Infrastructure depends on domain
2. **Use Case Pattern**: Application-specific business rules
3. **Composition Root**: Centralized dependency injection
4. **Mapper Pattern**: Layer boundary data transformation

### Advanced Patterns

1. **CQRS**: Command Query Responsibility Segregation
2. **Event-Driven Architecture**: Domain events for side effects
3. **Template Method**: Workflow orchestration
4. **Strategy Pattern**: Configurable behavior selection
5. **Factory Pattern**: Complex object creation

## Future Architecture Evolution

### Planned Enhancements

1. **Domain Events**: Cross-domain communication patterns
2. **Event Sourcing**: Audit trail and state reconstruction
3. **Advanced Analytics**: ML-powered conversation insights
4. **Real-time Features**: WebSocket integration for live chat

### Scalability Roadmap

1. **Microservice Migration**: Service extraction strategies
2. **Message Queue Integration**: Asynchronous processing
3. **CDN Integration**: Global content distribution
4. **Edge Computing**: Reduced latency conversation processing

---

## Conclusion

The chatbot-widget domain represents a sophisticated implementation of enterprise-grade DDD architecture with advanced AI integration. The architecture successfully balances complexity management through clean layer separation while providing rich conversational AI capabilities.

Key architectural strengths:
- **Clean DDD Implementation**: Clear bounded contexts and layer separation
- **Comprehensive AI Integration**: Advanced prompt engineering and conversation intelligence
- **Robust Error Handling**: Multi-layered error management and security
- **Performance Optimization**: Token management and multi-level caching
- **Scalable Design**: Future-ready architecture for enterprise growth

The domain serves as an excellent example of how modern AI applications can be structured using DDD principles while maintaining clean architecture boundaries and supporting complex business workflows from conversation management to lead capture and analysis.