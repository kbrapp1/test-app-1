/**
 * Operating Hours Infrastructure Mapper
 * 
 * Infrastructure layer mapper for OperatingHours value object.
 * Handles JSONB transformation for business hours and holiday schedules.
 */

import { OperatingHours } from '../../../../domain/value-objects/session-management/OperatingHours';

/**
 * Infrastructure mapper for OperatingHours JSONB data
 * Handles business hours arrays and holiday schedules with proper defaults
 */
export class OperatingHoursMapper {
  
  /**
   * Map JSONB operating hours data to domain value object
   * Infrastructure operation: JSONB to domain object transformation
   */
  static fromJsonb(data: unknown): OperatingHours {
    const hours = data as Record<string, unknown> | null | undefined;
    
    return OperatingHours.create({
      timezone: (hours?.timezone as string) || 'UTC',
      businessHours: this.mapBusinessHours(hours?.businessHours),
      holidaySchedule: this.mapHolidaySchedule(hours?.holidaySchedule),
      outsideHoursMessage: (hours?.outsideHoursMessage as string) || 'We are currently closed. Please leave a message and we will get back to you.',
    });
  }

  /**
   * Map domain OperatingHours to JSONB data
   * Infrastructure operation: domain object to JSONB transformation
   */
  static toJsonb(operatingHours: OperatingHours): unknown {
    return operatingHours.toPlainObject();
  }

  /**
   * Map business hours array with validation and defaults
   * Infrastructure operation: business hours array mapping
   */
  private static mapBusinessHours(data: unknown): Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }> {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((hours: unknown) => {
      const hoursRecord = hours as Record<string, unknown>;
      return {
        dayOfWeek: (hoursRecord?.dayOfWeek as number) || 0,
        startTime: (hoursRecord?.startTime as string) || '09:00',
        endTime: (hoursRecord?.endTime as string) || '17:00',
        isActive: (hoursRecord?.isActive as boolean) !== false, // Default true
      };
    });
  }

  /**
   * Map holiday schedule array with validation and defaults
   * Infrastructure operation: holiday schedule array mapping
   */
  private static mapHolidaySchedule(data: unknown): Array<{
    date: string;
    name: string;
    isRecurring: boolean;
  }> {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((holiday: unknown) => {
      const holidayRecord = holiday as Record<string, unknown>;
      return {
        date: (holidayRecord?.date as string) || '',
        name: (holidayRecord?.name as string) || '',
        isRecurring: (holidayRecord?.isRecurring as boolean) || false,
      };
    });
  }
}