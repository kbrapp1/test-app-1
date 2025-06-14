# Chatbot Widget UI Management Implementation Guide

## Overview
This guide provides a step-by-step implementation plan for building administrative UI interfaces to manage chatbot intents, entities, and business rules. Following DDD architecture principles from @golden-rule.mdc.

## Phase 1: Foundation & Database Schema

### [ ] 1.1 Database Schema Design
**Location**: `supabase/migrations/`
**Estimated Time**: 30 minutes

Create migration files for chatbot configuration tables:

```sql
-- 001_chatbot_intents.sql
CREATE TABLE chatbot_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  examples TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chatbot_id, name)
);

-- 002_chatbot_entities.sql  
CREATE TABLE chatbot_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('string', 'array', 'object', 'number', 'boolean')),
  enum_values TEXT[],
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chatbot_id, name)
);

-- 003_chatbot_business_rules.sql
CREATE TABLE chatbot_business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### [ ] 1.2 Domain Entities
**Location**: `lib/chatbot-widget/domain/entities/`
**Estimated Time**: 45 minutes

Create domain entities for configuration management:

```typescript
// IntentConfiguration.ts
export class IntentConfiguration {
  constructor(
    public readonly id: string,
    public readonly chatbotId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly examples: string[],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(data: CreateIntentConfigurationData): IntentConfiguration {
    return new IntentConfiguration(
      data.id || crypto.randomUUID(),
      data.chatbotId,
      data.name,
      data.description,
      data.examples || [],
      data.isActive ?? true,
      new Date(),
      new Date()
    );
  }

  updateExamples(examples: string[]): IntentConfiguration {
    return new IntentConfiguration(
      this.id,
      this.chatbotId,
      this.name,
      this.description,
      examples,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }
}
```

### [ ] 1.3 Repository Interfaces
**Location**: `lib/chatbot-widget/domain/repositories/`
**Estimated Time**: 30 minutes

Define repository contracts:

```typescript
// IIntentConfigurationRepository.ts
export interface IIntentConfigurationRepository {
  findByChatbotId(chatbotId: string): Promise<IntentConfiguration[]>;
  findById(id: string): Promise<IntentConfiguration | null>;
  save(intent: IntentConfiguration): Promise<IntentConfiguration>;
  delete(id: string): Promise<void>;
  findActiveIntents(chatbotId: string): Promise<IntentConfiguration[]>;
}
```

## Phase 2: Application Layer Services

### [ ] 2.1 Application Services
**Location**: `lib/chatbot-widget/application/services/`
**Estimated Time**: 1 hour

Create application services for configuration management:

```typescript
// IntentConfigurationService.ts
export class IntentConfigurationService {
  constructor(
    private readonly intentRepository: IIntentConfigurationRepository,
    private readonly entityRepository: IEntityConfigurationRepository
  ) {}

  async getIntents(chatbotId: string): Promise<IntentConfigurationDto[]> {
    const intents = await this.intentRepository.findByChatbotId(chatbotId);
    return intents.map(intent => IntentConfigurationMapper.toDto(intent));
  }

  async createIntent(data: CreateIntentDto): Promise<IntentConfigurationDto> {
    const intent = IntentConfiguration.create({
      chatbotId: data.chatbotId,
      name: data.name,
      description: data.description,
      examples: data.examples
    });
    
    const savedIntent = await this.intentRepository.save(intent);
    return IntentConfigurationMapper.toDto(savedIntent);
  }

  async generateOpenAISchema(chatbotId: string): Promise<OpenAIFunctionSchema> {
    const [intents, entities] = await Promise.all([
      this.intentRepository.findActiveIntents(chatbotId),
      this.entityRepository.findActiveEntities(chatbotId)
    ]);

    return {
      name: "classify_intent_and_persona",
      parameters: {
        type: "object",
        properties: {
          primaryIntent: {
            type: "string",
            enum: intents.map(i => i.name),
            description: "Primary intent classification"
          },
          entities: this.buildEntitySchema(entities)
        }
      }
    };
  }
}
```

### [ ] 2.2 DTOs and Mappers
**Location**: `lib/chatbot-widget/application/dto/` and `lib/chatbot-widget/application/mappers/`
**Estimated Time**: 45 minutes

Create data transfer objects and mappers:

```typescript
// IntentConfigurationDto.ts
export interface IntentConfigurationDto {
  id: string;
  chatbotId: string;
  name: string;
  description: string;
  examples: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// IntentConfigurationMapper.ts
export class IntentConfigurationMapper {
  static toDto(entity: IntentConfiguration): IntentConfigurationDto {
    return {
      id: entity.id,
      chatbotId: entity.chatbotId,
      name: entity.name,
      description: entity.description,
      examples: entity.examples,
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  static toDomain(dto: IntentConfigurationDto): IntentConfiguration {
    return new IntentConfiguration(
      dto.id,
      dto.chatbotId,
      dto.name,
      dto.description,
      dto.examples,
      dto.isActive,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }
}
```

## Phase 3: Infrastructure Layer

### [ ] 3.1 Supabase Repository Implementations
**Location**: `lib/chatbot-widget/infrastructure/persistence/supabase/`
**Estimated Time**: 1.5 hours

Implement concrete repositories:

```typescript
// IntentConfigurationSupabaseRepository.ts
export class IntentConfigurationSupabaseRepository implements IIntentConfigurationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByChatbotId(chatbotId: string): Promise<IntentConfiguration[]> {
    const { data, error } = await this.supabase
      .from('chatbot_intents')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch intents: ${error.message}`);
    
    return data.map(row => this.mapRowToEntity(row));
  }

  async save(intent: IntentConfiguration): Promise<IntentConfiguration> {
    const row = this.mapEntityToRow(intent);
    
    const { data, error } = await this.supabase
      .from('chatbot_intents')
      .upsert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to save intent: ${error.message}`);
    
    return this.mapRowToEntity(data);
  }

  private mapRowToEntity(row: any): IntentConfiguration {
    return new IntentConfiguration(
      row.id,
      row.chatbot_id,
      row.name,
      row.description,
      row.examples || [],
      row.is_active,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
```

### [ ] 3.2 Composition Root Updates
**Location**: `lib/chatbot-widget/infrastructure/composition/`
**Estimated Time**: 30 minutes

Update composition root to wire new dependencies:

```typescript
// ChatbotWidgetCompositionRoot.ts
export class ChatbotWidgetCompositionRoot {
  private static _intentConfigurationService: IntentConfigurationService | null = null;

  static getIntentConfigurationService(): IntentConfigurationService {
    if (!this._intentConfigurationService) {
      const supabase = createClient(/* config */);
      const intentRepository = new IntentConfigurationSupabaseRepository(supabase);
      const entityRepository = new EntityConfigurationSupabaseRepository(supabase);
      
      this._intentConfigurationService = new IntentConfigurationService(
        intentRepository,
        entityRepository
      );
    }
    return this._intentConfigurationService;
  }
}
```

## Phase 4: Presentation Layer - Server Actions

### [ ] 4.1 Server Actions
**Location**: `lib/chatbot-widget/presentation/actions/`
**Estimated Time**: 45 minutes

Create server actions for UI interactions:

```typescript
// intent-configuration.ts
'use server';

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

export async function getIntents(chatbotId: string) {
  try {
    const service = ChatbotWidgetCompositionRoot.getIntentConfigurationService();
    return await service.getIntents(chatbotId);
  } catch (error) {
    throw new Error(`Failed to fetch intents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createIntent(data: CreateIntentDto) {
  try {
    const service = ChatbotWidgetCompositionRoot.getIntentConfigurationService();
    return await service.createIntent(data);
  } catch (error) {
    throw new Error(`Failed to create intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateIntent(id: string, data: UpdateIntentDto) {
  try {
    const service = ChatbotWidgetCompositionRoot.getIntentConfigurationService();
    return await service.updateIntent(id, data);
  } catch (error) {
    throw new Error(`Failed to update intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

## Phase 5: Presentation Layer - React Hooks

### [ ] 5.1 React Query Hooks
**Location**: `lib/chatbot-widget/presentation/hooks/`
**Estimated Time**: 1 hour

Create React Query hooks for data management:

```typescript
// useIntentConfiguration.ts
export function useIntents(chatbotId: string) {
  return useQuery({
    queryKey: ['chatbot-intents', chatbotId],
    queryFn: () => getIntents(chatbotId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!chatbotId
  });
}

export function useCreateIntent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createIntent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-intents', data.chatbotId] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-schema', data.chatbotId] });
    }
  });
}

export function useUpdateIntent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIntentDto }) => 
      updateIntent(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-intents', data.chatbotId] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-schema', data.chatbotId] });
    }
  });
}
```

## Phase 6: UI Components

### [ ] 6.1 Intent Management Panel
**Location**: `lib/chatbot-widget/presentation/components/admin/`
**Estimated Time**: 2 hours

Create the main intent management interface:

```typescript
// IntentManagementPanel.tsx
export function IntentManagementPanel({ chatbotId }: { chatbotId: string }) {
  const { data: intents, isLoading } = useIntents(chatbotId);
  const createIntent = useCreateIntent();
  const updateIntent = useUpdateIntent();
  const deleteIntent = useDeleteIntent();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIntent, setEditingIntent] = useState<IntentConfigurationDto | null>(null);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Intent Classification
        </CardTitle>
        <CardDescription>
          Manage how your chatbot understands and categorizes user intentions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Intent List */}
          <div className="space-y-3">
            {intents?.map(intent => (
              <IntentCard
                key={intent.id}
                intent={intent}
                onEdit={setEditingIntent}
                onToggle={(checked) => updateIntent.mutate({ 
                  id: intent.id, 
                  data: { isActive: checked } 
                })}
                onDelete={() => deleteIntent.mutate(intent.id)}
              />
            ))}
          </div>

          {/* Add Intent Button */}
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Intent
          </Button>
        </div>

        {/* Create Intent Dialog */}
        <CreateIntentDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          chatbotId={chatbotId}
          onSuccess={() => setShowCreateDialog(false)}
        />

        {/* Edit Intent Dialog */}
        <EditIntentDialog
          intent={editingIntent}
          onOpenChange={(open) => !open && setEditingIntent(null)}
          onSuccess={() => setEditingIntent(null)}
        />
      </CardContent>
    </Card>
  );
}
```

### [ ] 6.2 Intent Card Component
**Location**: `lib/chatbot-widget/presentation/components/admin/`
**Estimated Time**: 45 minutes

Create reusable intent card component:

```typescript
// IntentCard.tsx
interface IntentCardProps {
  intent: IntentConfigurationDto;
  onEdit: (intent: IntentConfigurationDto) => void;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
}

export function IntentCard({ intent, onEdit, onToggle, onDelete }: IntentCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-medium">{intent.name}</h4>
          <Badge variant={intent.isActive ? "default" : "secondary"}>
            {intent.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {intent.description}
        </p>
        
        {intent.examples.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {intent.examples.slice(0, 3).map((example, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                "{example}"
              </Badge>
            ))}
            {intent.examples.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{intent.examples.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch 
          checked={intent.isActive} 
          onCheckedChange={onToggle}
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(intent)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onDelete}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### [ ] 6.3 Create/Edit Intent Dialogs
**Location**: `lib/chatbot-widget/presentation/components/admin/`
**Estimated Time**: 1.5 hours

Create dialog components for intent management:

```typescript
// CreateIntentDialog.tsx
export function CreateIntentDialog({ 
  open, 
  onOpenChange, 
  chatbotId, 
  onSuccess 
}: CreateIntentDialogProps) {
  const createIntent = useCreateIntent();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    examples: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createIntent.mutateAsync({
        chatbotId,
        name: formData.name,
        description: formData.description,
        examples: formData.examples.filter(ex => ex.trim())
      });
      
      onSuccess();
      setFormData({ name: '', description: '', examples: [''] });
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Intent</DialogTitle>
          <DialogDescription>
            Define a new intent that your chatbot can recognize and respond to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Intent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., pricing_inquiry"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe when this intent should be triggered..."
              required
            />
          </div>

          <div>
            <Label>Example Phrases</Label>
            <div className="space-y-2">
              {formData.examples.map((example, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={example}
                    onChange={(e) => {
                      const newExamples = [...formData.examples];
                      newExamples[index] = e.target.value;
                      setFormData(prev => ({ ...prev, examples: newExamples }));
                    }}
                    placeholder="Example user message..."
                  />
                  {formData.examples.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newExamples = formData.examples.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, examples: newExamples }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  examples: [...prev.examples, ''] 
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Example
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createIntent.isPending}>
              {createIntent.isPending ? 'Creating...' : 'Create Intent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Phase 7: Integration & Testing

### [ ] 7.1 Update OpenAI Service Integration
**Location**: `lib/chatbot-widget/infrastructure/providers/openai/`
**Estimated Time**: 1 hour

Modify the OpenAI service to use dynamic configuration:

```typescript
// OpenAIIntentClassificationService.ts - Update classifyIntentEnhanced method
async classifyIntentEnhanced(
  message: string,
  messageHistory: ChatMessage[],
  sessionId?: string
): Promise<IntentResult> {
  // Get dynamic configuration from database
  const configService = ChatbotWidgetCompositionRoot.getIntentConfigurationService();
  const schema = await configService.generateOpenAISchema(this.chatbotId);
  
  // Use dynamic schema instead of hardcoded one
  const functions = [schema];
  
  // Rest of the method remains the same...
}
```

### [ ] 7.2 Add Configuration Page Route
**Location**: `app/(protected)/ai-playground/chatbot-widget/`
**Estimated Time**: 30 minutes

Create new page for configuration management:

```typescript
// configuration/page.tsx
export default function ChatbotConfigurationPage() {
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('');
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Chatbot Configuration</h1>
        <p className="text-gray-600 mt-2">
          Manage intents, entities, and business rules for your chatbot
        </p>
      </div>

      <ChatbotSelector 
        value={selectedChatbotId}
        onChange={setSelectedChatbotId}
      />

      {selectedChatbotId && (
        <Tabs defaultValue="intents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="intents">Intents</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="rules">Business Rules</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="intents">
            <IntentManagementPanel chatbotId={selectedChatbotId} />
          </TabsContent>

          <TabsContent value="entities">
            <EntityManagementPanel chatbotId={selectedChatbotId} />
          </TabsContent>

          <TabsContent value="rules">
            <BusinessRulesPanel chatbotId={selectedChatbotId} />
          </TabsContent>

          <TabsContent value="analytics">
            <ConfigurationAnalytics chatbotId={selectedChatbotId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
```

### [ ] 7.3 Write Tests
**Location**: `lib/chatbot-widget/` (various test files)
**Estimated Time**: 2 hours

Create comprehensive tests:

```typescript
// __tests__/IntentConfigurationService.test.ts
describe('IntentConfigurationService', () => {
  let service: IntentConfigurationService;
  let mockRepository: jest.Mocked<IIntentConfigurationRepository>;

  beforeEach(() => {
    mockRepository = {
      findByChatbotId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findActiveIntents: jest.fn()
    };
    service = new IntentConfigurationService(mockRepository, mockEntityRepository);
  });

  it('should create intent with valid data', async () => {
    const createData = {
      chatbotId: 'test-id',
      name: 'test_intent',
      description: 'Test intent',
      examples: ['test example']
    };

    mockRepository.save.mockResolvedValue(
      IntentConfiguration.create(createData)
    );

    const result = await service.createIntent(createData);

    expect(result.name).toBe('test_intent');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should generate OpenAI schema from active intents', async () => {
    const mockIntents = [
      IntentConfiguration.create({ 
        chatbotId: 'test', 
        name: 'greeting', 
        description: 'Greeting intent',
        examples: []
      })
    ];

    mockRepository.findActiveIntents.mockResolvedValue(mockIntents);

    const schema = await service.generateOpenAISchema('test');

    expect(schema.parameters.properties.primaryIntent.enum).toContain('greeting');
  });
});
```

## Phase 8: Documentation & Deployment

### [ ] 8.1 Update Documentation
**Location**: `docs/chatbot-widget/`
**Estimated Time**: 45 minutes

Create user documentation for the new features:

```markdown
# Chatbot Configuration Management

## Overview
The chatbot configuration interface allows you to customize how your chatbot understands and responds to user messages without code changes.

## Intent Management
- **Purpose**: Define what user intentions your chatbot can recognize
- **Examples**: greeting, pricing_inquiry, demo_request, support_request
- **Best Practices**: 
  - Use clear, descriptive names
  - Provide 3-5 example phrases per intent
  - Keep descriptions concise but specific

## Entity Extraction
- **Purpose**: Define what information to extract from conversations
- **Types**: string, array, object, number, boolean
- **Examples**: budget, timeline, company_size, industry

## Business Rules
- **Purpose**: Automate actions based on conversation context
- **Conditions**: Intent + entity combinations
- **Actions**: Route to sales, send email, create task, update lead score
```

### [ ] 8.2 Migration Scripts
**Location**: `scripts/`
**Estimated Time**: 30 minutes

Create migration scripts for existing chatbots:

```typescript
// migrate-existing-chatbots.ts
async function migrateExistingChatbots() {
  const supabase = createClient(/* config */);
  
  // Get all existing chatbots
  const { data: chatbots } = await supabase
    .from('chatbots')
    .select('id');

  for (const chatbot of chatbots) {
    // Create default intents
    await createDefaultIntents(chatbot.id);
    await createDefaultEntities(chatbot.id);
    await createDefaultBusinessRules(chatbot.id);
  }
}

async function createDefaultIntents(chatbotId: string) {
  const defaultIntents = [
    {
      name: 'greeting',
      description: 'User greeting or initial contact',
      examples: ['hello', 'hi there', 'good morning']
    },
    {
      name: 'pricing_inquiry', 
      description: 'Questions about pricing or costs',
      examples: ['how much does it cost', 'what are your prices', 'pricing information']
    }
    // ... more defaults
  ];

  // Insert into database
}
```

## Success Criteria

### [ ] 9.1 Functional Requirements
- [ ] Admin can create, edit, and delete intents through UI
- [ ] Admin can manage entities and their validation rules
- [ ] Admin can create visual business rules with conditions and actions
- [ ] Changes are immediately reflected in chatbot behavior
- [ ] All operations maintain data consistency
- [ ] UI provides real-time feedback and error handling

### [ ] 9.2 Technical Requirements
- [ ] Follows DDD architecture patterns from @golden-rule.mdc
- [ ] All components are under 200-250 lines
- [ ] Proper error handling and loading states
- [ ] Comprehensive test coverage (>80%)
- [ ] Type-safe throughout the stack
- [ ] Optimistic updates with React Query
- [ ] Proper cache invalidation

### [ ] 9.3 Performance Requirements
- [ ] Configuration changes apply within 2 seconds
- [ ] UI remains responsive during operations
- [ ] Database queries are optimized with proper indexes
- [ ] No memory leaks in React components
- [ ] Proper pagination for large datasets

## Estimated Total Time: 12-15 hours

This implementation provides a complete, production-ready UI management system for chatbot configuration while maintaining clean architecture principles and ensuring scalability for future enhancements. 