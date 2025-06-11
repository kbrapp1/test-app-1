import { describe, it, expect, beforeEach } from 'vitest';
import { OperatingHours, BusinessHours, HolidaySchedule } from '../OperatingHours';

describe('OperatingHours Value Object', () => {
  let validBusinessHours: BusinessHours[];
  let validHolidaySchedule: HolidaySchedule[];

  beforeEach(() => {
    validBusinessHours = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Friday
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', isEnabled: false }, // Saturday
      { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', isEnabled: false }  // Sunday
    ];

    validHolidaySchedule = [
      { date: '2024-12-25', name: 'Christmas Day', isRecurring: true },
      { date: '2024-01-01', name: 'New Year\'s Day', isRecurring: true }
    ];
  });

  describe('constructor validation', () => {
    it('should create valid OperatingHours', () => {
      const operatingHours = new OperatingHours(
        'America/New_York',
        validBusinessHours,
        validHolidaySchedule,
        'We are currently closed.'
      );

      expect(operatingHours.timezone).toBe('America/New_York');
      expect(operatingHours.businessHours).toEqual(validBusinessHours);
      expect(operatingHours.holidaySchedule).toEqual(validHolidaySchedule);
      expect(operatingHours.outsideHoursMessage).toBe('We are currently closed.');
    });

    it('should throw error for empty timezone', () => {
      expect(() => {
        new OperatingHours('', validBusinessHours, validHolidaySchedule, 'Closed');
      }).toThrow('Timezone is required');
    });

    it('should throw error for invalid timezone', () => {
      expect(() => {
        new OperatingHours('Invalid/Timezone', validBusinessHours, validHolidaySchedule, 'Closed');
      }).toThrow('Invalid timezone: Invalid/Timezone');
    });

    it('should throw error for non-array business hours', () => {
      expect(() => {
        // @ts-ignore - Testing runtime validation
        new OperatingHours('UTC', 'invalid', validHolidaySchedule, 'Closed');
      }).toThrow('Business hours must be an array');
    });

    it('should throw error for invalid day of week', () => {
      const invalidBusinessHours = [
        { dayOfWeek: 7, startTime: '09:00', endTime: '17:00', isEnabled: true } // Invalid day
      ];

      expect(() => {
        new OperatingHours('UTC', invalidBusinessHours, validHolidaySchedule, 'Closed');
      }).toThrow('Invalid day of week at index 0: must be 0-6');
    });

    it('should throw error for invalid time format', () => {
      const invalidBusinessHours = [
        { dayOfWeek: 1, startTime: '25:00', endTime: '17:00', isEnabled: true } // Invalid time
      ];

      expect(() => {
        new OperatingHours('UTC', invalidBusinessHours, validHolidaySchedule, 'Closed');
      }).toThrow('Invalid start time format at index 0: must be HH:MM');
    });

    it('should throw error when start time is after end time', () => {
      const invalidBusinessHours = [
        { dayOfWeek: 1, startTime: '18:00', endTime: '17:00', isEnabled: true } // Start after end
      ];

      expect(() => {
        new OperatingHours('UTC', invalidBusinessHours, validHolidaySchedule, 'Closed');
      }).toThrow('Start time must be before end time at index 0');
    });

    it('should throw error for invalid holiday date format', () => {
      const invalidHolidaySchedule = [
        { date: '12-25-2024', name: 'Christmas', isRecurring: true } // Wrong format
      ];

      expect(() => {
        new OperatingHours('UTC', validBusinessHours, invalidHolidaySchedule, 'Closed');
      }).toThrow('Invalid holiday date format at index 0: must be YYYY-MM-DD');
    });

    it('should throw error for empty holiday name', () => {
      const invalidHolidaySchedule = [
        { date: '2024-12-25', name: '', isRecurring: true } // Empty name
      ];

      expect(() => {
        new OperatingHours('UTC', validBusinessHours, invalidHolidaySchedule, 'Closed');
      }).toThrow('Holiday name is required at index 0');
    });
  });

  describe('business logic methods', () => {
    let operatingHours: OperatingHours;

    beforeEach(() => {
      operatingHours = new OperatingHours(
        'UTC',
        validBusinessHours,
        validHolidaySchedule,
        'We are currently closed.'
      );
    });

    describe('isOpenAt', () => {
      it('should return true for business hours on Monday', () => {
        const mondayAt10AM = new Date('2024-01-08T10:00:00Z'); // Monday (not a holiday)
        expect(operatingHours.isOpenAt(mondayAt10AM)).toBe(true);
      });

      it('should return false for outside business hours', () => {
        const mondayAt8AM = new Date('2024-01-08T08:00:00Z'); // Before opening
        expect(operatingHours.isOpenAt(mondayAt8AM)).toBe(false);
      });

      it('should return false for disabled days', () => {
        const saturdayAt11AM = new Date('2024-01-06T11:00:00Z'); // Saturday (disabled)
        expect(operatingHours.isOpenAt(saturdayAt11AM)).toBe(false);
      });

      it('should return false for holidays', () => {
        const christmas = new Date('2024-12-25T10:00:00Z'); // Christmas Day
        expect(operatingHours.isOpenAt(christmas)).toBe(false);
      });
    });

    describe('isCurrentlyOpen', () => {
      it('should use current date when no date provided', () => {
        const result = operatingHours.isCurrentlyOpen();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('getNextOpeningTime', () => {
      it('should return next opening time for closed period', () => {
        const sundayNight = new Date('2024-01-07T22:00:00Z'); // Sunday night
        const nextOpening = operatingHours.getNextOpeningTime(sundayNight);
        
        expect(nextOpening).toBeDefined();
        expect(nextOpening).toBeInstanceOf(Date);
      });

      it('should return null if no opening time found in 2 weeks', () => {
        // Create operating hours with no enabled days
        const allDisabledHours = validBusinessHours.map(h => ({ ...h, isEnabled: false }));
        const closedOperatingHours = new OperatingHours(
          'UTC',
          allDisabledHours,
          [],
          'Always closed'
        );

        const result = closedOperatingHours.getNextOpeningTime();
        expect(result).toBeNull();
      });
    });

    describe('getSummary', () => {
      it('should return "Closed" for no enabled hours', () => {
        const allDisabledHours = validBusinessHours.map(h => ({ ...h, isEnabled: false }));
        const closedOperatingHours = new OperatingHours(
          'UTC',
          allDisabledHours,
          [],
          'Always closed'
        );

        expect(closedOperatingHours.getSummary()).toBe('Closed');
      });

      it('should return formatted summary for enabled hours', () => {
        const summary = operatingHours.getSummary();
        expect(summary).toContain('Mon-Fri: 09:00-17:00');
      });
    });
  });

  describe('immutability methods', () => {
    let operatingHours: OperatingHours;

    beforeEach(() => {
      operatingHours = new OperatingHours(
        'UTC',
        validBusinessHours,
        validHolidaySchedule,
        'We are currently closed.'
      );
    });

    it('should create new instance with updated timezone', () => {
      const updated = operatingHours.withTimezone('America/Los_Angeles');
      
      expect(updated.timezone).toBe('America/Los_Angeles');
      expect(updated.businessHours).toEqual(operatingHours.businessHours);
      expect(updated).not.toBe(operatingHours); // Different instance
    });

    it('should create new instance with updated business hours', () => {
      const newHours = [{ dayOfWeek: 1, startTime: '08:00', endTime: '16:00', isEnabled: true }];
      const updated = operatingHours.withBusinessHours(newHours);
      
      expect(updated.businessHours).toEqual(newHours);
      expect(updated.timezone).toBe(operatingHours.timezone);
      expect(updated).not.toBe(operatingHours);
    });

    it('should create new instance with updated holiday schedule', () => {
      const newHolidays = [{ date: '2024-07-04', name: 'Independence Day', isRecurring: true }];
      const updated = operatingHours.withHolidaySchedule(newHolidays);
      
      expect(updated.holidaySchedule).toEqual(newHolidays);
      expect(updated.timezone).toBe(operatingHours.timezone);
      expect(updated).not.toBe(operatingHours);
    });

    it('should create new instance with updated outside hours message', () => {
      const newMessage = 'Please call during business hours';
      const updated = operatingHours.withOutsideHoursMessage(newMessage);
      
      expect(updated.outsideHoursMessage).toBe(newMessage);
      expect(updated.timezone).toBe(operatingHours.timezone);
      expect(updated).not.toBe(operatingHours);
    });
  });

  describe('equality and comparison', () => {
    it('should return true for equal OperatingHours', () => {
      const operatingHours1 = new OperatingHours(
        'UTC',
        validBusinessHours,
        validHolidaySchedule,
        'Closed'
      );
      
      const operatingHours2 = new OperatingHours(
        'UTC',
        validBusinessHours,
        validHolidaySchedule,
        'Closed'
      );

      expect(operatingHours1.equals(operatingHours2)).toBe(true);
    });

    it('should return false for different timezones', () => {
      const operatingHours1 = new OperatingHours('UTC', validBusinessHours, validHolidaySchedule, 'Closed');
      const operatingHours2 = new OperatingHours('America/New_York', validBusinessHours, validHolidaySchedule, 'Closed');

      expect(operatingHours1.equals(operatingHours2)).toBe(false);
    });
  });

  describe('JSON serialization', () => {
    it('should convert to JSON correctly', () => {
      const operatingHours = new OperatingHours(
        'UTC',
        validBusinessHours,
        validHolidaySchedule,
        'Closed'
      );

      const json = operatingHours.toJSON();
      
      expect(json).toHaveProperty('timezone', 'UTC');
      expect(json).toHaveProperty('businessHours', validBusinessHours);
      expect(json).toHaveProperty('holidaySchedule', validHolidaySchedule);
      expect(json).toHaveProperty('outsideHoursMessage', 'Closed');
    });

    it('should create from JSON correctly', () => {
      const jsonData = {
        timezone: 'America/New_York',
        businessHours: validBusinessHours,
        holidaySchedule: validHolidaySchedule,
        outsideHoursMessage: 'Currently closed'
      };

      const operatingHours = OperatingHours.fromJSON(jsonData);
      
      expect(operatingHours.timezone).toBe('America/New_York');
      expect(operatingHours.businessHours).toEqual(validBusinessHours);
      expect(operatingHours.holidaySchedule).toEqual(validHolidaySchedule);
      expect(operatingHours.outsideHoursMessage).toBe('Currently closed');
    });

    it('should create from JSON with defaults for missing data', () => {
      const incompleteData = { timezone: 'UTC' };
      const operatingHours = OperatingHours.fromJSON(incompleteData);
      
      expect(operatingHours.timezone).toBe('UTC');
      expect(operatingHours.businessHours).toEqual([]);
      expect(operatingHours.holidaySchedule).toEqual([]);
      expect(operatingHours.outsideHoursMessage).toContain('currently closed');
    });
  });

  describe('factory methods', () => {
    it('should create default operating hours', () => {
      const defaultHours = OperatingHours.createDefault();
      
      expect(defaultHours.timezone).toBe('UTC');
      expect(defaultHours.businessHours).toHaveLength(7); // All days of week
      expect(defaultHours.businessHours.filter(h => h.isEnabled)).toHaveLength(5); // Monday-Friday
      expect(defaultHours.holidaySchedule).toEqual([]);
      expect(defaultHours.outsideHoursMessage).toContain('currently closed');
    });
  });
}); 