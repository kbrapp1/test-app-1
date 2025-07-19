/**
 * LeadQualificationMapper Tests
 * 
 * Critical infrastructure tests for lead qualification question mapping
 * Tests business logic preservation, validation, and error handling
 */

import { describe, it, expect, vi } from 'vitest';
import { LeadQualificationMapper } from '../LeadQualificationMapper';
import { LeadQualificationQuestion } from '../../../../../domain/entities/ChatbotConfig';

// Mock crypto.randomUUID for consistent testing
const mockUUID = 'lead-12345678-1234-5678-9012-123456789012';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID)
});

describe('LeadQualificationMapper', () => {
  describe('fromJsonb', () => {
    it('should map complete JSONB question array correctly', () => {
      const jsonbData = [
        {
          id: 'q1',
          question: 'What is your company name?',
          type: 'text',
          isRequired: true,
          order: 1,
          scoringWeight: 2
        },
        {
          id: 'q2',
          question: 'What is your email address?',
          type: 'email',
          isRequired: true,
          order: 2,
          scoringWeight: 3
        },
        {
          id: 'q3',
          question: 'What is your industry?',
          type: 'select',
          options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing'],
          isRequired: false,
          order: 3,
          scoringWeight: 1
        },
        {
          id: 'q4',
          question: 'Which features interest you?',
          type: 'multiselect',
          options: ['AI Analytics', 'Real-time Reporting', 'API Integration', 'Custom Dashboards'],
          isRequired: false,
          order: 4,
          scoringWeight: 2
        },
        {
          id: 'q5',
          question: 'What is your phone number?',
          type: 'phone',
          isRequired: false,
          order: 5,
          scoringWeight: 1
        }
      ];

      const questions = LeadQualificationMapper.fromJsonb(jsonbData);

      expect(questions).toHaveLength(5);
      
      // Verify text question
      expect(questions[0]).toEqual({
        id: 'q1',
        question: 'What is your company name?',
        type: 'text',
        options: undefined,
        isRequired: true,
        order: 1,
        scoringWeight: 2
      });

      // Verify email question
      expect(questions[1]).toEqual({
        id: 'q2',
        question: 'What is your email address?',
        type: 'email',
        options: undefined,
        isRequired: true,
        order: 2,
        scoringWeight: 3
      });

      // Verify select question with options
      expect(questions[2]).toEqual({
        id: 'q3',
        question: 'What is your industry?',
        type: 'select',
        options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing'],
        isRequired: false,
        order: 3,
        scoringWeight: 1
      });

      // Verify multiselect question
      expect(questions[3]).toEqual({
        id: 'q4',
        question: 'Which features interest you?',
        type: 'multiselect',
        options: ['AI Analytics', 'Real-time Reporting', 'API Integration', 'Custom Dashboards'],
        isRequired: false,
        order: 4,
        scoringWeight: 2
      });

      // Verify phone question
      expect(questions[4]).toEqual({
        id: 'q5',
        question: 'What is your phone number?',
        type: 'phone',
        options: undefined,
        isRequired: false,
        order: 5,
        scoringWeight: 1
      });
    });

    it('should handle null/undefined JSONB data gracefully', () => {
      const nullQuestions = LeadQualificationMapper.fromJsonb(null);
      const undefinedQuestions = LeadQualificationMapper.fromJsonb(undefined);

      expect(nullQuestions).toEqual([]);
      expect(undefinedQuestions).toEqual([]);
    });

    it('should handle non-array JSONB data gracefully', () => {
      const nonArrayData = {
        id: 'not-an-array',
        question: 'This should not work'
      };

      const questions = LeadQualificationMapper.fromJsonb(nonArrayData);

      expect(questions).toEqual([]);
    });

    it('should handle empty array correctly', () => {
      const questions = LeadQualificationMapper.fromJsonb([]);

      expect(questions).toEqual([]);
    });

    it('should map partial questions with defaults', () => {
      const partialData = [
        {
          question: 'Question without ID'
          // Missing id, type, isRequired, order, scoringWeight
        },
        {
          id: 'q2',
          question: 'Question with some fields',
          type: 'email',
          isRequired: true
          // Missing order, scoringWeight
        },
        {
          // Completely empty object
        }
      ];

      const questions = LeadQualificationMapper.fromJsonb(partialData);

      expect(questions).toHaveLength(3);

      // First question with defaults
      expect(questions[0]).toEqual({
        id: mockUUID, // Generated UUID
        question: 'Question without ID',
        type: 'text', // Default
        options: undefined,
        isRequired: false, // Default
        order: 0, // Default
        scoringWeight: 1 // Default
      });

      // Second question with partial data
      expect(questions[1]).toEqual({
        id: 'q2',
        question: 'Question with some fields',
        type: 'email',
        options: undefined,
        isRequired: true,
        order: 0, // Default
        scoringWeight: 1 // Default
      });

      // Third question with all defaults
      expect(questions[2]).toEqual({
        id: mockUUID, // Generated UUID
        question: '', // Default
        type: 'text', // Default
        options: undefined,
        isRequired: false, // Default
        order: 0, // Default
        scoringWeight: 1 // Default
      });
    });

    it('should handle all question types correctly', () => {
      const questionTypes = ['text', 'email', 'phone', 'select', 'multiselect'] as const;

      questionTypes.forEach((type, index) => {
        const data = [
          {
            id: `q-${type}`,
            question: `Question of type ${type}`,
            type: type,
            options: type.includes('select') ? ['Option 1', 'Option 2'] : undefined,
            isRequired: true,
            order: index + 1,
            scoringWeight: 2
          }
        ];

        const questions = LeadQualificationMapper.fromJsonb(data);

        expect(questions).toHaveLength(1);
        expect(questions[0].type).toBe(type);
        expect(questions[0].question).toBe(`Question of type ${type}`);
        
        if (type.includes('select')) {
          expect(questions[0].options).toEqual(['Option 1', 'Option 2']);
        } else {
          expect(questions[0].options).toBeUndefined();
        }
      });
    });

    it('should handle invalid question type with fallback', () => {
      const invalidTypeData = [
        {
          id: 'q1',
          question: 'Question with invalid type',
          type: 'invalid-type',
          isRequired: true,
          order: 1,
          scoringWeight: 2
        }
      ];

      const questions = LeadQualificationMapper.fromJsonb(invalidTypeData);

      expect(questions[0].type).toBe('text'); // Fallback to default
    });

    it('should handle options field correctly', () => {
      const optionsTestCases = [
        {
          description: 'valid string array options',
          data: { options: ['Option A', 'Option B', 'Option C'] },
          expected: ['Option A', 'Option B', 'Option C']
        },
        {
          description: 'empty array options',
          data: { options: [] },
          expected: []
        },
        {
          description: 'null options',
          data: { options: null },
          expected: undefined
        },
        {
          description: 'undefined options',
          data: { options: undefined },
          expected: undefined
        },
        {
          description: 'non-array options',
          data: { options: 'not-an-array' },
          expected: undefined
        },
        {
          description: 'missing options field',
          data: {},
          expected: undefined
        }
      ];

      optionsTestCases.forEach(testCase => {
        const data = [
          {
            id: 'test-q',
            question: 'Test question',
            type: 'select',
            ...testCase.data
          }
        ];

        const questions = LeadQualificationMapper.fromJsonb(data);

        expect(questions[0].options).toEqual(testCase.expected);
      });
    });

    it('should handle boolean isRequired field correctly', () => {
      const booleanTestCases = [
        { isRequired: true, expected: true },
        { isRequired: false, expected: false },
        { isRequired: 'true', expected: false }, // String should default to false
        { isRequired: 1, expected: false }, // Number should default to false
        { isRequired: null, expected: false }, // Null should default to false
        { isRequired: undefined, expected: false }, // Undefined should default to false
        { /* no isRequired field */ expected: false } // Missing should default to false
      ];

      booleanTestCases.forEach((testCase, index) => {
        const data = [
          {
            id: `test-q-${index}`,
            question: 'Test question',
            type: 'text',
            ...testCase
          }
        ];

        const questions = LeadQualificationMapper.fromJsonb(data);

        expect(questions[0].isRequired).toBe(testCase.expected);
      });
    });

    it('should handle numeric fields correctly', () => {
      const numericTestCases = [
        {
          description: 'valid positive numbers',
          data: { order: 5, scoringWeight: 3 },
          expectedOrder: 5,
          expectedWeight: 3
        },
        {
          description: 'zero values',
          data: { order: 0, scoringWeight: 0 },
          expectedOrder: 0,
          expectedWeight: 0
        },
        {
          description: 'negative numbers',
          data: { order: -1, scoringWeight: -2 },
          expectedOrder: -1,
          expectedWeight: -2
        },
        {
          description: 'decimal numbers',
          data: { order: 2.5, scoringWeight: 1.5 },
          expectedOrder: 2.5,
          expectedWeight: 1.5
        },
        {
          description: 'string numbers',
          data: { order: '3', scoringWeight: '2' },
          expectedOrder: 0, // Fallback
          expectedWeight: 1 // Fallback
        },
        {
          description: 'null values',
          data: { order: null, scoringWeight: null },
          expectedOrder: 0, // Fallback
          expectedWeight: 1 // Fallback
        },
        {
          description: 'missing fields',
          data: {},
          expectedOrder: 0, // Default
          expectedWeight: 1 // Default
        }
      ];

      numericTestCases.forEach((testCase, index) => {
        const data = [
          {
            id: `test-q-${index}`,
            question: 'Test question',
            type: 'text',
            ...testCase.data
          }
        ];

        const questions = LeadQualificationMapper.fromJsonb(data);

        expect(questions[0].order).toBe(testCase.expectedOrder);
        expect(questions[0].scoringWeight).toBe(testCase.expectedWeight);
      });
    });

    it('should handle large question arrays efficiently', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => ({
        id: `large-q-${i}`,
        question: `Large question ${i}`,
        type: i % 2 === 0 ? 'text' : 'select',
        options: i % 2 === 0 ? undefined : [`Option ${i}A`, `Option ${i}B`],
        isRequired: i % 3 === 0,
        order: i,
        scoringWeight: Math.floor(i / 10) + 1
      }));

      const questions = LeadQualificationMapper.fromJsonb(largeArray);

      expect(questions).toHaveLength(100);
      expect(questions[0].id).toBe('large-q-0');
      expect(questions[99].id).toBe('large-q-99');
      expect(questions[50].question).toBe('Large question 50');
    });
  });

  describe('toJsonb', () => {
    it('should convert LeadQualificationQuestion array to JSONB correctly', () => {
      const questions: LeadQualificationQuestion[] = [
        {
          id: 'jsonb-q1',
          question: 'What is your company size?',
          type: 'select',
          options: ['1-10', '11-50', '51-200', '200+'],
          isRequired: true,
          order: 1,
          scoringWeight: 2
        },
        {
          id: 'jsonb-q2',
          question: 'What is your budget range?',
          type: 'text',
          options: undefined,
          isRequired: false,
          order: 2,
          scoringWeight: 3
        }
      ];

      const jsonbData = LeadQualificationMapper.toJsonb(questions);

      expect(jsonbData).toEqual([
        {
          id: 'jsonb-q1',
          question: 'What is your company size?',
          type: 'select',
          options: ['1-10', '11-50', '51-200', '200+'],
          isRequired: true,
          order: 1,
          scoringWeight: 2
        },
        {
          id: 'jsonb-q2',
          question: 'What is your budget range?',
          type: 'text',
          options: undefined,
          isRequired: false,
          order: 2,
          scoringWeight: 3
        }
      ]);
    });

    it('should convert empty array correctly', () => {
      const questions: LeadQualificationQuestion[] = [];
      const jsonbData = LeadQualificationMapper.toJsonb(questions);

      expect(jsonbData).toEqual([]);
    });

    it('should preserve all question types in conversion', () => {
      const allTypesQuestions: LeadQualificationQuestion[] = [
        {
          id: 'text-q',
          question: 'Text question',
          type: 'text',
          options: undefined,
          isRequired: true,
          order: 1,
          scoringWeight: 1
        },
        {
          id: 'email-q',
          question: 'Email question',
          type: 'email',
          options: undefined,
          isRequired: true,
          order: 2,
          scoringWeight: 2
        },
        {
          id: 'phone-q',
          question: 'Phone question',
          type: 'phone',
          options: undefined,
          isRequired: false,
          order: 3,
          scoringWeight: 1
        },
        {
          id: 'select-q',
          question: 'Select question',
          type: 'select',
          options: ['A', 'B', 'C'],
          isRequired: true,
          order: 4,
          scoringWeight: 2
        },
        {
          id: 'multiselect-q',
          question: 'Multiselect question',
          type: 'multiselect',
          options: ['X', 'Y', 'Z'],
          isRequired: false,
          order: 5,
          scoringWeight: 3
        }
      ];

      const jsonbData = LeadQualificationMapper.toJsonb(allTypesQuestions) as LeadQualificationQuestion[];

      expect(jsonbData).toHaveLength(5);
      expect(jsonbData[0].type).toBe('text');
      expect(jsonbData[1].type).toBe('email');
      expect(jsonbData[2].type).toBe('phone');
      expect(jsonbData[3].type).toBe('select');
      expect(jsonbData[4].type).toBe('multiselect');
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through fromJsonb -> toJsonb conversion', () => {
      const originalData = [
        {
          id: 'rt-q1',
          question: 'Round-trip text question',
          type: 'text',
          isRequired: true,
          order: 1,
          scoringWeight: 2
        },
        {
          id: 'rt-q2',
          question: 'Round-trip select question',
          type: 'select',
          options: ['Option 1', 'Option 2', 'Option 3'],
          isRequired: false,
          order: 2,
          scoringWeight: 1
        }
      ];

      const questions = LeadQualificationMapper.fromJsonb(originalData);
      const reconvertedData = LeadQualificationMapper.toJsonb(questions);

      expect(reconvertedData).toEqual([
        {
          id: 'rt-q1',
          question: 'Round-trip text question',
          type: 'text',
          options: undefined,
          isRequired: true,
          order: 1,
          scoringWeight: 2
        },
        {
          id: 'rt-q2',
          question: 'Round-trip select question',
          type: 'select',
          options: ['Option 1', 'Option 2', 'Option 3'],
          isRequired: false,
          order: 2,
          scoringWeight: 1
        }
      ]);
    });

    it('should handle partial data round-trip correctly', () => {
      const partialData = [
        {
          question: 'Partial question'
          // Missing most fields
        }
      ];

      const questions = LeadQualificationMapper.fromJsonb(partialData);
      const reconverted = LeadQualificationMapper.toJsonb(questions);
      const finalQuestions = LeadQualificationMapper.fromJsonb(reconverted);

      // Should maintain consistency with filled defaults
      expect(finalQuestions[0].id).toBe(mockUUID);
      expect(finalQuestions[0].question).toBe('Partial question');
      expect(finalQuestions[0].type).toBe('text');
      expect(finalQuestions[0].isRequired).toBe(false);
      expect(finalQuestions[0].order).toBe(0);
      expect(finalQuestions[0].scoringWeight).toBe(1);
    });

    it('should maintain order across multiple conversions', () => {
      const orderedData = [
        { id: 'q1', question: 'First', type: 'text', order: 5, scoringWeight: 1, isRequired: false },
        { id: 'q2', question: 'Second', type: 'email', order: 2, scoringWeight: 2, isRequired: true },
        { id: 'q3', question: 'Third', type: 'phone', order: 8, scoringWeight: 1, isRequired: false }
      ];

      let currentData = orderedData;
      
      // Multiple round-trips
      for (let i = 0; i < 3; i++) {
        const questions = LeadQualificationMapper.fromJsonb(currentData);
        currentData = LeadQualificationMapper.toJsonb(questions) as typeof orderedData;
      }

      expect(currentData[0].order).toBe(5);
      expect(currentData[1].order).toBe(2);
      expect(currentData[2].order).toBe(8);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed question objects gracefully', () => {
      const malformedData = [
        {
          id: 123, // Should be string
          question: null, // Should be string
          type: 'invalid-type', // Should be valid type
          options: 'not-an-array', // Should be array or undefined
          isRequired: 'yes', // Should be boolean
          order: 'first', // Should be number
          scoringWeight: '5' // Should be number
        }
      ];

      expect(() => {
        LeadQualificationMapper.fromJsonb(malformedData);
      }).not.toThrow();

      const questions = LeadQualificationMapper.fromJsonb(malformedData);

      expect(questions).toHaveLength(1);
      expect(questions[0].id).toBe(''); // Fallback for non-string
      expect(questions[0].question).toBe(''); // Fallback for null
      expect(questions[0].type).toBe('text'); // Fallback for invalid type
      expect(questions[0].options).toBeUndefined(); // Fallback for non-array
      expect(questions[0].isRequired).toBe(false); // Fallback for non-boolean
      expect(questions[0].order).toBe(0); // Fallback for non-number
      expect(questions[0].scoringWeight).toBe(1); // Fallback for non-number
    });

    it('should handle nested malformed data structures', () => {
      const nestedMalformedData = [
        {
          nested: {
            id: 'should-not-be-nested'
          },
          array: [1, 2, 3],
          circular: null
        }
      ];

      // Create circular reference
      (nestedMalformedData[0] as any).circular = nestedMalformedData[0];

      const questions = LeadQualificationMapper.fromJsonb(nestedMalformedData);

      expect(questions).toHaveLength(1);
      expect(questions[0].id).toBe(mockUUID); // Generated because no valid id found
      expect(questions[0].question).toBe(''); // Default
      expect(questions[0].type).toBe('text'); // Default
    });

    it('should handle very large question arrays', () => {
      const veryLargeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: `huge-q-${i}`,
        question: `Question ${i}`,
        type: 'text',
        isRequired: i % 2 === 0,
        order: i,
        scoringWeight: Math.min(i % 5 + 1, 5)
      }));

      const questions = LeadQualificationMapper.fromJsonb(veryLargeArray);

      expect(questions).toHaveLength(10000);
      expect(questions[9999].id).toBe('huge-q-9999');
      expect(questions[9999].order).toBe(9999);
    });

    it('should handle question objects with extra properties', () => {
      const dataWithExtraProps = [
        {
          id: 'q1',
          question: 'Valid question',
          type: 'text',
          isRequired: true,
          order: 1,
          scoringWeight: 2,
          // Extra properties that should be ignored
          extraField: 'should be ignored',
          anotherExtra: { nested: 'object' },
          arrayExtra: [1, 2, 3]
        }
      ];

      const questions = LeadQualificationMapper.fromJsonb(dataWithExtraProps);

      expect(questions).toHaveLength(1);
      expect(questions[0]).toEqual({
        id: 'q1',
        question: 'Valid question',
        type: 'text',
        options: undefined,
        isRequired: true,
        order: 1,
        scoringWeight: 2
      });

      // Verify extra properties are not included
      expect((questions[0] as any).extraField).toBeUndefined();
      expect((questions[0] as any).anotherExtra).toBeUndefined();
      expect((questions[0] as any).arrayExtra).toBeUndefined();
    });

    it('should handle boundary numeric values correctly', () => {
      const boundaryData = [
        {
          id: 'boundary-test',
          question: 'Boundary test',
          type: 'text',
          isRequired: false,
          order: Number.MAX_SAFE_INTEGER,
          scoringWeight: Number.MIN_VALUE
        }
      ];

      const questions = LeadQualificationMapper.fromJsonb(boundaryData);

      expect(questions[0].order).toBe(Number.MAX_SAFE_INTEGER);
      expect(questions[0].scoringWeight).toBe(Number.MIN_VALUE);
    });
  });
});