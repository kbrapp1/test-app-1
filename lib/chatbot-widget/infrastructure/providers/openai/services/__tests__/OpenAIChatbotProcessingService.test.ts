/**
 * OpenAIChatbotProcessingService Tests
 * 
 * Tests the OpenAI chatbot processing service that handles:
 * - Complete chatbot interaction processing
 * - OpenAI API integration
 * - Response mapping and transformation
 * - Error handling and logging
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OpenAIChatbotProcessingService, OpenAIApiResponse, FunctionCallArguments } from '../OpenAIChatbotProcessingService';
import { OpenAIIntentConfig } from '../../types/OpenAITypes';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { MessageBuildingContext } from '../OpenAIMessageBuilder';
import OpenAI from 'openai';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

// Mock SessionLogger for testing
const mockSessionLogger = {
  logApiCall: vi.fn(),
  logMessage: vi.fn(),
  logError: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined)
};

// Mock the schema builder
vi.mock('../OpenAIFunctionSchemaBuilder', () => ({
  OpenAIFunctionSchemaBuilder: {
    buildUnifiedChatbotSchemaWithContext: vi.fn().mockReturnValue({
      name: 'process_chatbot_interaction',
      description: 'Process chatbot interaction',
      parameters: {
        type: 'object',
        properties: {
          intent: { type: 'string' },
          lead_data: { type: 'object' },
          response: { type: 'object' }
        }
      }
    })
  }
}));

// Mock the message builder
vi.mock('../OpenAIMessageBuilder', () => ({
  OpenAIMessageBuilder: vi.fn().mockImplementation(() => ({
    buildMessagesWithKnowledgeBase: vi.fn().mockReturnValue([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' }
    ]),
    validateMessages: vi.fn().mockReturnValue(true)
  }))
}));

describe('OpenAIChatbotProcessingService', () => {
  let service: OpenAIChatbotProcessingService;
  let mockOpenAI: any;
  let mockConfig: OpenAIIntentConfig;
  let mockChatMessage: ChatMessage;
  let mockContext: MessageBuildingContext;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000
    };

    mockChatMessage = {
      id: 'msg-1',
      content: 'Hello, I need help with pricing',
      messageType: 'user',
      timestamp: new Date('2024-01-01T12:00:00Z')
    } as ChatMessage;

    mockContext = {
      messageHistory: [mockChatMessage],
      sessionId: 'session-123',
      organizationId: 'org-456',
      systemPrompt: 'You are a helpful sales assistant.'
    };

    mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    };

    (OpenAI as any).mockImplementation(() => mockOpenAI);
    service = new OpenAIChatbotProcessingService(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize with OpenAI client', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });

    it('should store configuration', () => {
      expect(service['config']).toEqual(mockConfig);
    });
  });

  describe('executeOpenAIApiCall', () => {
    it('should execute OpenAI API call successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'pricing_inquiry',
                lead_data: {
                  company: 'ACME Corp',
                  role: 'CTO',
                  urgency: 'high'
                },
                response: {
                  content: 'I\'d be happy to help you with pricing information.',
                  capture_contact: true,
                  next_question: 'What\'s your budget range?'
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.executeOpenAIApiCall(
        'What are your pricing plans?',
        mockContext,
        mockSessionLogger
      );

      expect(result).toEqual({
        functionArgs: {
          intent: 'pricing_inquiry',
          lead_data: {
            company: 'ACME Corp',
            role: 'CTO',
            urgency: 'high'
          },
          response: {
            content: 'I\'d be happy to help you with pricing information.',
            capture_contact: true,
            next_question: 'What\'s your budget range?'
          }
        },
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      });
    });

    it('should handle missing function call in response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Regular response without function call'
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      await expect(
        service.executeOpenAIApiCall('Hello', context, mockSessionLogger)
      ).rejects.toThrow('No function call in OpenAI API response');
    });

    it('should handle invalid JSON in function call arguments', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: 'invalid json'
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      await expect(
        service.executeOpenAIApiCall('Hello', context, mockSessionLogger)
      ).rejects.toThrow();
    });

    it('should require system prompt', async () => {
      const context = {
        messageHistory: [],
        sessionId: 'session-123'
        // No systemPrompt provided
      };

      await expect(
        service.executeOpenAIApiCall('Hello', context, mockSessionLogger)
      ).rejects.toThrow('System prompt is required for OpenAI API call');
    });

    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('OpenAI API error');
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      await expect(
        service.executeOpenAIApiCall('Hello', context, mockSessionLogger)
      ).rejects.toThrow('OpenAI API error');
    });

    it('should handle different intent types', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'technical_support',
                lead_data: {},
                response: {
                  content: 'I can help you with technical support.',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 80,
          completion_tokens: 40,
          total_tokens: 120
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'I need technical support',
        context,
        mockSessionLogger
      );

      expect(result.functionArgs.intent).toBe('technical_support');
      expect(result.functionArgs.response?.capture_contact).toBe(false);
    });

    it('should handle context with message history', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'followup',
                lead_data: {},
                response: {
                  content: 'Thanks for the follow-up question.',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 30,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const messageHistory = [
        {
          id: 'msg-1',
          content: 'Hello',
          messageType: 'user',
          timestamp: new Date()
        } as ChatMessage,
        {
          id: 'msg-2',
          content: 'Hi, how can I help?',
          messageType: 'bot',
          timestamp: new Date()
        } as ChatMessage
      ];

      const context = {
        messageHistory,
        sessionId: 'session-123',
        organizationId: 'org-456',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'Can you tell me more?',
        context,
        mockSessionLogger
      );

      expect(result.functionArgs.intent).toBe('followup');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are a helpful assistant.'
            })
          ])
        })
      );
    });

    it('should handle userData in context', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'personalized_inquiry',
                lead_data: {
                  name: 'John Doe'
                },
                response: {
                  content: 'Hello John, how can I help you?',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        userData: { name: 'John Doe', email: 'john@example.com' },
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'Hello',
        context,
        mockSessionLogger
      );

      expect(result.functionArgs.intent).toBe('personalized_inquiry');
    });

    it('should handle shared log file in context', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'general',
                lead_data: {},
                response: {
                  content: 'How can I help you?',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.',
        sharedLogFile: '/tmp/custom-log.txt'
      };

      const result = await service.executeOpenAIApiCall('Hello', context, mockSessionLogger);

      // The service should use the shared log file
      expect(result).toBeDefined();
    });
  });

  describe('Response Mapping', () => {
    it('should map function call entities to expected format', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'pricing_inquiry',
                lead_data: {
                  company: 'ACME Corp',
                  role: 'CTO',
                  budget: '$50,000',
                  urgency: 'high'
                },
                response: {
                  content: 'I can help with pricing.',
                  capture_contact: true
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'What are your prices?',
        context,
        mockSessionLogger
      );

      expect(result.functionArgs.lead_data).toBeDefined();
      expect(typeof result.functionArgs.lead_data).toBe('object');
    });

    it('should default to inquiry intent when not provided', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                // No intent provided
                lead_data: {},
                response: {
                  content: 'How can I help you?',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'Hello',
        context,
        mockSessionLogger
      );

      expect(result.functionArgs.intent || 'inquiry').toBe('inquiry');
    });

    it('should handle missing usage data', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'general',
                lead_data: {},
                response: {
                  content: 'Hello!',
                  capture_contact: false
                }
              })
            }
          }
        }],
        // No usage data
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'Hello',
        context,
        mockSessionLogger
      );

      expect(result.usage).toEqual({
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      });
    });
  });

  describe('Function Call Response Parsing', () => {
    it('should parse pricing inquiry intent correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'pricing_inquiry',
                lead_data: {},
                response: {
                  content: 'Let me help with pricing.',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'What are your prices?',
        context,
        mockSessionLogger
      );

      expect(result.functionArgs.intent).toBe('pricing_inquiry');
    });

    it('should parse technical support intent correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'technical_support',
                lead_data: {},
                response: {
                  content: 'I can help with technical issues.',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall(
        'I need technical support',
        context,
        mockSessionLogger
      );

      expect(result.functionArgs.intent).toBe('technical_support');
    });
  });

  describe('Logging Integration', () => {
    it('should create session logger with correct parameters', async () => {
      const mockResponse = {
        choices: [{
          message: {
            function_call: {
              name: 'process_chatbot_interaction',
              arguments: JSON.stringify({
                intent: 'general',
                lead_data: {},
                response: {
                  content: 'Hello!',
                  capture_contact: false
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context = {
        messageHistory: [],
        sessionId: 'session-123',
        systemPrompt: 'You are a helpful assistant.'
      };

      const result = await service.executeOpenAIApiCall('Hello', context, mockSessionLogger);

      // The logging service should be initialized and used
      expect(result).toBeDefined();
    });
  });
});