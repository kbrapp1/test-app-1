/**
 * OperatingHoursMapper Tests
 * 
 * Tests for data integrity between database JSONB and domain value objects.
 * Critical for ensuring proper business hours and holiday schedule persistence.
 */

import { describe, it, expect } from 'vitest';
import { OperatingHoursMapper } from '../OperatingHoursMapper';
import { OperatingHours } from '../../../../../domain/value-objects/session-management/OperatingHours';

describe('OperatingHoursMapper', () => {
  describe('fromJsonb', () => {
    it('should create OperatingHours with default values for empty data', () => {
      const result = OperatingHoursMapper.fromJsonb(null);

      expect(result).toBeInstanceOf(OperatingHours);
      expect(result.timezone).toBe('UTC');
      expect(result.businessHours).toEqual([]);
      expect(result.holidaySchedule).toEqual([]);
      expect(result.outsideHoursMessage).toBe('We are currently closed. Please leave a message and we will get back to you.');
    });

    it('should create OperatingHours with default values for undefined data', () => {
      const result = OperatingHoursMapper.fromJsonb(undefined);

      expect(result).toBeInstanceOf(OperatingHours);
      expect(result.timezone).toBe('UTC');
      expect(result.businessHours).toEqual([]);
      expect(result.holidaySchedule).toEqual([]);
    });

    it('should map complete JSONB data to OperatingHours', () => {
      const jsonbData = {
        timezone: 'America/New_York',
        businessHours: [
          {
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '18:00',
            isActive: true
          },
          {
            dayOfWeek: 2,
            startTime: '08:00',
            endTime: '18:00',
            isActive: true
          },
          {
            dayOfWeek: 6,
            startTime: '10:00',
            endTime: '14:00',
            isActive: false
          }
        ],
        holidaySchedule: [
          {
            date: '2023-12-25',
            name: 'Christmas Day',
            isRecurring: true
          },
          {
            date: '2023-07-04',
            name: 'Independence Day',
            isRecurring: true
          }
        ],
        outsideHoursMessage: 'Our office is currently closed. We will respond within 24 hours.'
      };

      const result = OperatingHoursMapper.fromJsonb(jsonbData);

      expect(result.timezone).toBe('America/New_York');
      expect(result.businessHours).toHaveLength(3);
      expect(result.businessHours[0]).toEqual({
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '18:00',
        isActive: true
      });
      expect(result.businessHours[2].isActive).toBe(false);
      expect(result.holidaySchedule).toHaveLength(2);
      expect(result.holidaySchedule[0]).toEqual({
        date: '2023-12-25',
        name: 'Christmas Day',
        isRecurring: true
      });
      expect(result.outsideHoursMessage).toBe('Our office is currently closed. We will respond within 24 hours.');
    });

    it('should handle partial JSONB data with proper defaults', () => {
      const partialData = {
        timezone: 'Europe/London',
        businessHours: [
          {
            dayOfWeek: 3,
            startTime: '09:30'
            // Missing endTime and isActive
          }
        ]
      };

      const result = OperatingHoursMapper.fromJsonb(partialData);

      expect(result.timezone).toBe('Europe/London');
      expect(result.businessHours).toHaveLength(1);
      expect(result.businessHours[0]).toEqual({
        dayOfWeek: 3,
        startTime: '09:30',
        endTime: '17:00', // Default
        isActive: true // Default
      });
      expect(result.holidaySchedule).toEqual([]); // Default
      expect(result.outsideHoursMessage).toBe('We are currently closed. Please leave a message and we will get back to you.'); // Default
    });

    it('should handle non-array business hours gracefully', () => {
      const invalidData = {
        timezone: 'UTC',
        businessHours: 'not_an_array',
        holidaySchedule: null
      };

      const result = OperatingHoursMapper.fromJsonb(invalidData);

      expect(result.timezone).toBe('UTC');
      expect(result.businessHours).toEqual([]); // Falls back to empty array
      expect(result.holidaySchedule).toEqual([]); // Falls back to empty array
    });

    it('should handle missing fields in business hours with defaults', () => {
      const dataWithMissingFields = {
        businessHours: [
          {
            // Missing dayOfWeek - will get default 0
            startTime: '10:00',
            endTime: '16:00'
          }
        ]
      };

      const result = OperatingHoursMapper.fromJsonb(dataWithMissingFields);

      expect(result.businessHours).toHaveLength(1);
      expect(result.businessHours[0]).toEqual({
        dayOfWeek: 0, // Default
        startTime: '10:00',
        endTime: '16:00',
        isActive: true // Default
      });
    });

    it('should handle holiday schedule with valid data only', () => {
      const validData = {
        holidaySchedule: [
          {
            date: '2023-12-25',
            name: 'Christmas',
            isRecurring: true
          }
        ]
      };

      const result = OperatingHoursMapper.fromJsonb(validData);

      expect(result.holidaySchedule).toHaveLength(1);
      expect(result.holidaySchedule[0]).toEqual({
        date: '2023-12-25',
        name: 'Christmas',
        isRecurring: true
      });
    });

    it('should handle isActive defaults correctly', () => {
      const testCases = [
        {
          input: { isActive: true },
          expected: true
        },
        {
          input: { isActive: false },
          expected: false
        },
        {
          input: {}, // Missing isActive
          expected: true // Default
        },
        {
          input: { isActive: null },
          expected: true // Default for falsy but not false
        },
        {
          input: { isActive: 'invalid' },
          expected: true // Default for invalid type
        }
      ];

      testCases.forEach(({ input, expected }, index) => {
        const data = {
          businessHours: [input]
        };
        
        const result = OperatingHoursMapper.fromJsonb(data);
        expect(result.businessHours[0].isActive).toBe(expected);
      });
    });
  });

  describe('toJsonb', () => {
    it('should convert OperatingHours to JSONB format', () => {
      const operatingHours = OperatingHours.create({
        timezone: 'Pacific/Auckland',
        businessHours: [
          {
            dayOfWeek: 1,
            startTime: '08:30',
            endTime: '17:30',
            isActive: true
          },
          {
            dayOfWeek: 5,
            startTime: '09:00',
            endTime: '15:00',
            isActive: false
          }
        ],
        holidaySchedule: [
          {
            date: '2023-12-31',
            name: 'New Year\'s Eve',
            isRecurring: true
          }
        ],
        outsideHoursMessage: 'We are closed. Please email us at support@company.com'
      });

      const result = OperatingHoursMapper.toJsonb(operatingHours);

      expect(result).toEqual({
        timezone: 'Pacific/Auckland',
        businessHours: [
          {
            dayOfWeek: 1,
            startTime: '08:30',
            endTime: '17:30',
            isActive: true
          },
          {
            dayOfWeek: 5,
            startTime: '09:00',
            endTime: '15:00',
            isActive: false
          }
        ],
        holidaySchedule: [
          {
            date: '2023-12-31',
            name: 'New Year\'s Eve',
            isRecurring: true
          }
        ],
        outsideHoursMessage: 'We are closed. Please email us at support@company.com'
      });
    });

    it('should handle minimal OperatingHours with empty arrays', () => {
      const operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours: [],
        holidaySchedule: [],
        outsideHoursMessage: 'Currently closed'
      });

      const result = OperatingHoursMapper.toJsonb(operatingHours);

      expect(result).toEqual({
        timezone: 'UTC',
        businessHours: [],
        holidaySchedule: [],
        outsideHoursMessage: 'Currently closed'
      });
    });
  });

  describe('Round-trip Data Integrity', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const originalData = {
        timezone: 'America/Chicago',
        businessHours: [
          {
            dayOfWeek: 1,
            startTime: '07:00',
            endTime: '19:00',
            isActive: true
          },
          {
            dayOfWeek: 0,
            startTime: '10:00',
            endTime: '16:00',
            isActive: false
          }
        ],
        holidaySchedule: [
          {
            date: '2023-11-23',
            name: 'Thanksgiving',
            isRecurring: true
          },
          {
            date: '2023-06-15',
            name: 'Company Anniversary',
            isRecurring: false
          }
        ],
        outsideHoursMessage: 'Thank you for contacting us. We will respond soon.'
      };

      // JSONB -> Domain -> JSONB
      const domainObject = OperatingHoursMapper.fromJsonb(originalData);
      const backToJsonb = OperatingHoursMapper.toJsonb(domainObject);

      expect(backToJsonb).toEqual(originalData);
    });

    it('should handle round-trip with defaults filled in', () => {
      const minimalData = {
        timezone: 'Asia/Tokyo',
        businessHours: [
          {
            dayOfWeek: 2
            // Missing startTime, endTime, isActive - should get defaults
          }
        ]
      };

      const domainObject = OperatingHoursMapper.fromJsonb(minimalData);
      const backToJsonb = OperatingHoursMapper.toJsonb(domainObject);

      // Should include all properties with defaults
      expect(backToJsonb).toHaveProperty('timezone', 'Asia/Tokyo');
      expect((backToJsonb as any).businessHours[0]).toEqual({
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      });
      expect((backToJsonb as any).holidaySchedule).toEqual([]);
      expect((backToJsonb as any).outsideHoursMessage).toBe('We are currently closed. Please leave a message and we will get back to you.');
    });
  });

  describe('Business Logic Edge Cases', () => {
    it('should handle all days of the week correctly', () => {
      const businessHours = [
        { dayOfWeek: 0, startTime: '08:00', endTime: '17:00', isActive: false }, // Sunday
        { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isActive: true },  // Monday
        { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isActive: true },  // Tuesday
        { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isActive: true },  // Wednesday
        { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isActive: true },  // Thursday
        { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isActive: true },  // Friday
        { dayOfWeek: 6, startTime: '08:00', endTime: '17:00', isActive: false }  // Saturday
      ];

      const data = { businessHours };
      const result = OperatingHoursMapper.fromJsonb(data);

      expect(result.businessHours).toHaveLength(7);
      expect(result.businessHours[0].dayOfWeek).toBe(0);
      expect(result.businessHours[0].isActive).toBe(false); // Weekend
      expect(result.businessHours[1].isActive).toBe(true);  // Weekday
    });

    it('should handle 24-hour format times', () => {
      const data = {
        businessHours: [
          {
            dayOfWeek: 1,
            startTime: '00:00',
            endTime: '23:59',
            isActive: true
          }
        ]
      };

      const result = OperatingHoursMapper.fromJsonb(data);
      
      expect(result.businessHours[0].startTime).toBe('00:00');
      expect(result.businessHours[0].endTime).toBe('23:59');
    });

    it('should handle various timezone formats', () => {
      const timezones = [
        'UTC',
        'GMT',
        'America/New_York',
        'Europe/Berlin',
        'Asia/Shanghai',
        'Australia/Sydney',
        'Pacific/Fiji'
      ];

      timezones.forEach(timezone => {
        const data = { timezone };
        const result = OperatingHoursMapper.fromJsonb(data);
        expect(result.timezone).toBe(timezone);
      });
    });

    it('should handle recurring vs non-recurring holidays', () => {
      const data = {
        holidaySchedule: [
          {
            date: '2023-12-25',
            name: 'Christmas (recurring)',
            isRecurring: true
          },
          {
            date: '2023-04-15',
            name: 'One-time event',
            isRecurring: false
          }
        ]
      };

      const result = OperatingHoursMapper.fromJsonb(data);
      
      expect(result.holidaySchedule[0].isRecurring).toBe(true);
      expect(result.holidaySchedule[1].isRecurring).toBe(false);
    });
  });

  describe('Error Handling and Type Safety', () => {
    it('should handle null and undefined gracefully', () => {
      expect(() => OperatingHoursMapper.fromJsonb(null)).not.toThrow();
      expect(() => OperatingHoursMapper.fromJsonb(undefined)).not.toThrow();
      
      const resultNull = OperatingHoursMapper.fromJsonb(null);
      const resultUndefined = OperatingHoursMapper.fromJsonb(undefined);
      
      expect(resultNull).toBeInstanceOf(OperatingHours);
      expect(resultUndefined).toBeInstanceOf(OperatingHours);
    });

    it('should handle primitive types as input gracefully', () => {
      const primitives = [
        'string',
        123,
        true,
        false
      ];

      primitives.forEach(primitive => {
        expect(() => OperatingHoursMapper.fromJsonb(primitive)).not.toThrow();
        const result = OperatingHoursMapper.fromJsonb(primitive);
        expect(result).toBeInstanceOf(OperatingHours);
        expect(result.timezone).toBe('UTC'); // Should use defaults
      });
    });

    it('should maintain numeric integrity for valid dayOfWeek', () => {
      const data = {
        businessHours: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '15:00' }
        ]
      };

      const result = OperatingHoursMapper.fromJsonb(data);
      
      expect(typeof result.businessHours[0].dayOfWeek).toBe('number');
      expect(typeof result.businessHours[1].dayOfWeek).toBe('number');
      expect(result.businessHours[0].dayOfWeek).toBe(0);
      expect(result.businessHours[1].dayOfWeek).toBe(6);
    });

    it('should preserve string integrity for valid time formats', () => {
      const data = {
        businessHours: [
          {
            dayOfWeek: 1,
            startTime: '08:30', // Standard HH:mm format
            endTime: '17:45'    // Standard HH:mm format
          }
        ]
      };

      const result = OperatingHoursMapper.fromJsonb(data);
      
      expect(typeof result.businessHours[0].startTime).toBe('string');
      expect(typeof result.businessHours[0].endTime).toBe('string');
      expect(result.businessHours[0].startTime).toBe('08:30');
      expect(result.businessHours[0].endTime).toBe('17:45');
    });
  });
});