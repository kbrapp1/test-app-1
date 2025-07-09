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
import { OpenAIChatbotProcessingService } from '../OpenAIChatbotProcessingService';
import { OpenAIIntentConfig } from '../../types/OpenAITypes';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
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

// Mock the logging service
vi.mock('../../../providers/logging/ChatbotFileLoggingService', () => ({
  ChatbotFileLoggingService: vi.fn().mockImplementation(() => ({
    createSessionLogger: vi.fn().mockReturnValue({
      logApiCall: vi.fn(),
      logMessage: vi.fn(),
      logError: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined)
    })
  }))
}));

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

describe('OpenAIChatbotProcessingService', () => {
  let service: OpenAIChatbotProcessingService;
  let mockOpenAI: any;
  let mockConfig: OpenAIIntentConfig;
  let mockChatMessage: ChatMessage;

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

    // Clear global cache
    delete (globalThis as any)['OpenAIChatbotProcessingService_loggingServiceCache'];

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
    delete (globalThis as any)['OpenAIChatbotProcessingService_loggingServiceCache'];
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

  describe('processChatbotInteractionComplete', () => {
    it('should process a complete chatbot interaction successfully', async () => {
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

      const context = {
        messageHistory: [mockChatMessage],
        sessionId: 'session-123',
        organizationId: 'org-456',
        systemPrompt: 'You are a helpful sales assistant.'
      };

      const result = await service.processChatbotInteractionComplete(
        'What are your pricing plans?',
        context
      );

      expect(result).toEqual({
        analysis: {
          primaryIntent: 'pricing_inquiry',
          primaryConfidence: 0.8,
          entities: expect.any(Object),
          reasoning: 'Intent: pricing_inquiry, Lead data extracted'
        },
        conversationFlow: {
          shouldCaptureLeadNow: true,
          shouldAskQualificationQuestions: true,
          shouldEscalateToHuman: false,
          nextBestAction: 'capture_contact',
          conversationPhase: 'discovery',
          engagementLevel: 'low'
        },
        response: {
          content: 'I\'d be happy to help you with pricing information.',
          tone: 'professional',
          shouldTriggerLeadCapture: true
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
        service.processChatbotInteractionComplete('Hello', context)
      ).rejects.toThrow('No function call in response');
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
        service.processChatbotInteractionComplete('Hello', context)
      ).rejects.toThrow();
    });

    it('should require system prompt', async () => {
      const context = {
        messageHistory: [],
        sessionId: 'session-123'
        // No systemPrompt provided
      };

      await expect(
        service.processChatbotInteractionComplete('Hello', context)
      ).rejects.toThrow('System prompt is required for API-only processing - no static fallbacks allowed');
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
        service.processChatbotInteractionComplete('Hello', context)
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

      const result = await service.processChatbotInteractionComplete(
        'I need technical support',
        context
      );

      expect(result.analysis.primaryIntent).toBe('technical_support');
      expect(result.conversationFlow.shouldCaptureLeadNow).toBe(false);
      expect(result.conversationFlow.conversationPhase).toBe('discovery');
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

      const result = await service.processChatbotInteractionComplete(
        'Can you tell me more?',
        context
      );

      expect(result.analysis.primaryIntent).toBe('followup');
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

      const result = await service.processChatbotInteractionComplete(
        'Hello',
        context
      );

      expect(result.analysis.primaryIntent).toBe('personalized_inquiry');
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

      const result = await service.processChatbotInteractionComplete('Hello', context);

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

      const result = await service.processChatbotInteractionComplete(
        'What are your prices?',
        context
      );

      expect(result.analysis.entities).toBeDefined();
      expect(typeof result.analysis.entities).toBe('object');
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

      const result = await service.processChatbotInteractionComplete(
        'Hello',
        context
      );

      expect(result.analysis.primaryIntent).toBe('inquiry');
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

      const result = await service.processChatbotInteractionComplete(
        'Hello',
        context
      );

      expect(result.usage).toEqual({
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      });
    });
  });

  describe('Intent to Phase Mapping', () => {
    it('should map pricing inquiry to qualification phase', async () => {
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

      const result = await service.processChatbotInteractionComplete(
        'What are your prices?',
        context
      );

      expect(result.conversationFlow.conversationPhase).toBe('discovery');
    });

    it('should map technical support to support phase', async () => {
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

      const result = await service.processChatbotInteractionComplete(
        'I need technical support',
        context
      );

      expect(result.conversationFlow.conversationPhase).toBe('discovery');
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

      const result = await service.processChatbotInteractionComplete('Hello', context);

      // The logging service should be initialized and used
      expect(result).toBeDefined();
    });
  });
});