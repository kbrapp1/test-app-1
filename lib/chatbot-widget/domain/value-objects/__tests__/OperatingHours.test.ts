import { describe, it, expect, beforeEach } from 'vitest';
import { OperatingHours, BusinessHours, Holiday } from '../session-management/OperatingHours';

describe('OperatingHours Value Object', () => {
  let validBusinessHours: BusinessHours[];
  let validHolidaySchedule: Holiday[];

  beforeEach(() => {
    validBusinessHours = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true }, // Friday
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', isActive: false }, // Saturday
      { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', isActive: false }  // Sunday
    ];

    validHolidaySchedule = [
      { date: '2024-12-25', name: 'Christmas Day', isRecurring: true },
      { date: '2024-01-01', name: 'New Year\'s Day', isRecurring: true }
    ];
  });

  describe('factory methods', () => {
    it('should create valid OperatingHours using factory method', () => {
      const operatingHours = OperatingHours.create({
        timezone: 'America/New_York',
        businessHours: validBusinessHours,
        holidaySchedule: validHolidaySchedule,
        outsideHoursMessage: 'We are currently closed.'
      });

      expect(operatingHours.timezone).toBe('America/New_York');
      expect(operatingHours.businessHours).toEqual(validBusinessHours);
      expect(operatingHours.holidaySchedule).toEqual(validHolidaySchedule);
      expect(operatingHours.outsideHoursMessage).toBe('We are currently closed.');
    });

    it('should create default operating hours', () => {
      const defaultHours = OperatingHours.createDefault();
      
      expect(defaultHours.timezone).toBe('UTC');
      expect(defaultHours.businessHours).toHaveLength(7); // All days of week
      expect(defaultHours.businessHours.filter(h => h.isActive)).toHaveLength(7); // All days active (24/7)
      expect(defaultHours.holidaySchedule).toEqual([]);
      expect(defaultHours.outsideHoursMessage).toContain('currently offline');
    });

    it('should create default with custom timezone', () => {
      const customDefault = OperatingHours.createDefault('America/Los_Angeles');
      expect(customDefault.timezone).toBe('America/Los_Angeles');
    });
  });

  describe('validation', () => {
    it('should throw error for empty timezone', () => {
      expect(() => {
        OperatingHours.create({
          timezone: '',
          businessHours: validBusinessHours,
          holidaySchedule: validHolidaySchedule,
          outsideHoursMessage: 'Closed'
        });
      }).toThrow('Timezone is required');
    });

    it('should throw error for non-array business hours', () => {
      expect(() => {
        OperatingHours.create({
          timezone: 'UTC',
          // @ts-expect-error - Testing runtime validation by intentionally passing invalid type
          businessHours: 'invalid',
          holidaySchedule: validHolidaySchedule,
          outsideHoursMessage: 'Closed'
        });
      }).toThrow('Business hours must be an array');
    });

    it('should throw error for invalid day of week', () => {
      const invalidBusinessHours = [
        { dayOfWeek: 7, startTime: '09:00', endTime: '17:00', isActive: true } // Invalid day
      ];

      expect(() => {
        OperatingHours.create({
          timezone: 'UTC',
          businessHours: invalidBusinessHours,
          holidaySchedule: validHolidaySchedule,
          outsideHoursMessage: 'Closed'
        });
      }).toThrow('Business hours at index 0: dayOfWeek must be 0-6');
    });

    it('should throw error for invalid time format', () => {
      const invalidBusinessHours = [
        { dayOfWeek: 1, startTime: '25:00', endTime: '17:00', isActive: true } // Invalid time
      ];

      expect(() => {
        OperatingHours.create({
          timezone: 'UTC',
          businessHours: invalidBusinessHours,
          holidaySchedule: validHolidaySchedule,
          outsideHoursMessage: 'Closed'
        });
      }).toThrow('Business hours at index 0: invalid startTime format (use HH:mm)');
    });

    it('should throw error when start time is after end time', () => {
      const invalidBusinessHours = [
        { dayOfWeek: 1, startTime: '18:00', endTime: '17:00', isActive: true } // Start after end
      ];

      expect(() => {
        OperatingHours.create({
          timezone: 'UTC',
          businessHours: invalidBusinessHours,
          holidaySchedule: validHolidaySchedule,
          outsideHoursMessage: 'Closed'
        });
      }).toThrow('Business hours at index 0: startTime must be before endTime');
    });

    it('should throw error for invalid holiday date format', () => {
      const invalidHolidaySchedule = [
        { date: '12-25-2024', name: 'Christmas', isRecurring: true } // Wrong format
      ];

      expect(() => {
        OperatingHours.create({
          timezone: 'UTC',
          businessHours: validBusinessHours,
          holidaySchedule: invalidHolidaySchedule,
          outsideHoursMessage: 'Closed'
        });
      }).toThrow('Holiday at index 0: invalid date format (use YYYY-MM-DD)');
    });

    it('should throw error for empty holiday name', () => {
      const invalidHolidaySchedule = [
        { date: '2024-12-25', name: '', isRecurring: true } // Empty name
      ];

      expect(() => {
        OperatingHours.create({
          timezone: 'UTC',
          businessHours: validBusinessHours,
          holidaySchedule: invalidHolidaySchedule,
          outsideHoursMessage: 'Closed'
        });
      }).toThrow('Holiday at index 0: name is required');
    });
  });

  describe('business logic methods', () => {
    let operatingHours: OperatingHours;

    beforeEach(() => {
      operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours: validBusinessHours,
        holidaySchedule: validHolidaySchedule,
        outsideHoursMessage: 'We are currently closed.'
      });
    });

    describe('isWithinOperatingHours', () => {
      it('should return true for business hours on Monday', () => {
        const mondayAt10AM = new Date('2024-01-08T10:00:00Z'); // Monday (not a holiday)
        expect(operatingHours.isWithinOperatingHours(mondayAt10AM)).toBe(true);
      });

      it('should return false for outside business hours', () => {
        const mondayAt8AM = new Date('2024-01-08T08:00:00Z'); // Before opening
        expect(operatingHours.isWithinOperatingHours(mondayAt8AM)).toBe(false);
      });

      it('should return false for inactive days', () => {
        const saturdayAt11AM = new Date('2024-01-06T11:00:00Z'); // Saturday (inactive)
        expect(operatingHours.isWithinOperatingHours(saturdayAt11AM)).toBe(false);
      });

      it('should return false for holidays', () => {
        const christmas = new Date('2024-12-25T10:00:00Z'); // Christmas Day
        expect(operatingHours.isWithinOperatingHours(christmas)).toBe(false);
      });

      it('should use current date when no date provided', () => {
        // This is a basic smoke test - hard to test exact behavior without mocking Date
        const result = operatingHours.isWithinOperatingHours();
        expect(typeof result).toBe('boolean');
      });

      it('should return true for empty business hours (24/7 default)', () => {
        const emptyHoursConfig = OperatingHours.create({
          timezone: 'UTC',
          businessHours: [], // Empty array should default to 24/7
          holidaySchedule: [],
          outsideHoursMessage: 'We are always available!'
        });
        
        const mondayAt3AM = new Date('2024-01-08T03:00:00Z'); // Any time should be open
        const saturdayAt11PM = new Date('2024-01-06T23:00:00Z'); // Any day should be open
        
        expect(emptyHoursConfig.isWithinOperatingHours(mondayAt3AM)).toBe(true);
        expect(emptyHoursConfig.isWithinOperatingHours(saturdayAt11PM)).toBe(true);
      });
    });

    describe('getNextOpenTime', () => {
      it('should return next opening time for closed period', () => {
        const sundayNight = new Date('2024-01-07T22:00:00Z'); // Sunday night
        const nextOpening = operatingHours.getNextOpenTime(sundayNight);
        
        expect(nextOpening).toBeDefined();
        expect(nextOpening).toBeInstanceOf(Date);
      });

      it('should return null if no opening time found in 2 weeks', () => {
        // Create operating hours with no active days
        const allInactiveHours = validBusinessHours.map(h => ({ ...h, isActive: false }));
        const closedOperatingHours = OperatingHours.create({
          timezone: 'UTC',
          businessHours: allInactiveHours,
          holidaySchedule: [],
          outsideHoursMessage: 'Always closed'
        });

        const result = closedOperatingHours.getNextOpenTime();
        expect(result).toBeNull();
      });
    });
  });

  describe('immutability methods', () => {
    let operatingHours: OperatingHours;

    beforeEach(() => {
      operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours: validBusinessHours,
        holidaySchedule: validHolidaySchedule,
        outsideHoursMessage: 'We are currently closed.'
      });
    });

    it('should create new instance with updated timezone', () => {
      const updated = operatingHours.updateTimezone('America/Los_Angeles');
      
      expect(updated.timezone).toBe('America/Los_Angeles');
      expect(updated.businessHours).toEqual(operatingHours.businessHours);
      expect(updated).not.toBe(operatingHours); // Different instance
    });

    it('should create new instance with updated business hours', () => {
      const newHours = [{ dayOfWeek: 1, startTime: '08:00', endTime: '16:00', isActive: true }];
      const updated = operatingHours.updateBusinessHours(newHours);
      
      expect(updated.businessHours).toEqual(newHours);
      expect(updated.timezone).toBe(operatingHours.timezone);
      expect(updated).not.toBe(operatingHours);
    });

    it('should create new instance with updated outside hours message', () => {
      const newMessage = 'Please call during business hours';
      const updated = operatingHours.updateOutsideHoursMessage(newMessage);
      
      expect(updated.outsideHoursMessage).toBe(newMessage);
      expect(updated.timezone).toBe(operatingHours.timezone);
      expect(updated).not.toBe(operatingHours);
    });

    it('should add holiday correctly', () => {
      const newHoliday = { date: '2024-07-04', name: 'Independence Day', isRecurring: true };
      const updated = operatingHours.addHoliday(newHoliday);
      
      expect(updated.holidaySchedule).toContain(newHoliday);
      expect(updated.holidaySchedule).toHaveLength(operatingHours.holidaySchedule.length + 1);
      expect(updated).not.toBe(operatingHours);
    });

    it('should throw error when adding duplicate holiday', () => {
      const duplicateHoliday = { date: '2024-12-25', name: 'Christmas', isRecurring: true };
      
      expect(() => {
        operatingHours.addHoliday(duplicateHoliday);
      }).toThrow('Holiday on 2024-12-25 already exists');
    });

    it('should remove holiday correctly', () => {
      const updated = operatingHours.removeHoliday('2024-12-25');
      
      expect(updated.holidaySchedule).not.toContain(
        expect.objectContaining({ date: '2024-12-25' })
      );
      expect(updated.holidaySchedule).toHaveLength(operatingHours.holidaySchedule.length - 1);
      expect(updated).not.toBe(operatingHours);
    });

    it('should set day active/inactive', () => {
      const updated = operatingHours.setDayActive(6, true); // Make Saturday active
      
      const saturdayHours = updated.businessHours.find(h => h.dayOfWeek === 6);
      expect(saturdayHours?.isActive).toBe(true);
      expect(updated).not.toBe(operatingHours);
    });

    it('should update day hours', () => {
      const updated = operatingHours.updateDayHours(1, '08:00', '18:00'); // Update Monday hours
      
      const mondayHours = updated.businessHours.find(h => h.dayOfWeek === 1);
      expect(mondayHours?.startTime).toBe('08:00');
      expect(mondayHours?.endTime).toBe('18:00');
      expect(updated).not.toBe(operatingHours);
    });
  });

  describe('serialization', () => {
    it('should convert to plain object correctly', () => {
      const operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours: validBusinessHours,
        holidaySchedule: validHolidaySchedule,
        outsideHoursMessage: 'Closed'
      });

      const plainObject = operatingHours.toPlainObject();
      
      expect(plainObject).toHaveProperty('timezone', 'UTC');
      expect(plainObject).toHaveProperty('businessHours', validBusinessHours);
      expect(plainObject).toHaveProperty('holidaySchedule', validHolidaySchedule);
      expect(plainObject).toHaveProperty('outsideHoursMessage', 'Closed');
    });
  });
}); 