export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  isEnabled: boolean;
}

export interface HolidaySchedule {
  date: string; // "YYYY-MM-DD" format
  name: string;
  isRecurring: boolean; // for annual holidays
}

export class OperatingHours {
  constructor(
    public readonly timezone: string,
    public readonly businessHours: BusinessHours[],
    public readonly holidaySchedule: HolidaySchedule[],
    public readonly outsideHoursMessage: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.timezone) {
      throw new Error('Timezone is required');
    }

    if (!this.isValidTimezone(this.timezone)) {
      throw new Error(`Invalid timezone: ${this.timezone}`);
    }

    if (!Array.isArray(this.businessHours)) {
      throw new Error('Business hours must be an array');
    }

    this.businessHours.forEach((hours, index) => {
      this.validateBusinessHours(hours, index);
    });

    if (!Array.isArray(this.holidaySchedule)) {
      throw new Error('Holiday schedule must be an array');
    }

    this.holidaySchedule.forEach((holiday, index) => {
      this.validateHoliday(holiday, index);
    });

    if (typeof this.outsideHoursMessage !== 'string') {
      throw new Error('Outside hours message must be a string');
    }
  }

  private validateBusinessHours(hours: BusinessHours, index: number): void {
    if (typeof hours.dayOfWeek !== 'number' || hours.dayOfWeek < 0 || hours.dayOfWeek > 6) {
      throw new Error(`Invalid day of week at index ${index}: must be 0-6`);
    }

    if (!this.isValidTimeFormat(hours.startTime)) {
      throw new Error(`Invalid start time format at index ${index}: must be HH:MM`);
    }

    if (!this.isValidTimeFormat(hours.endTime)) {
      throw new Error(`Invalid end time format at index ${index}: must be HH:MM`);
    }

    if (typeof hours.isEnabled !== 'boolean') {
      throw new Error(`isEnabled must be boolean at index ${index}`);
    }

    if (hours.isEnabled && hours.startTime >= hours.endTime) {
      throw new Error(`Start time must be before end time at index ${index}`);
    }
  }

  private validateHoliday(holiday: HolidaySchedule, index: number): void {
    if (!this.isValidDateFormat(holiday.date)) {
      throw new Error(`Invalid holiday date format at index ${index}: must be YYYY-MM-DD`);
    }

    if (typeof holiday.name !== 'string' || holiday.name.trim().length === 0) {
      throw new Error(`Holiday name is required at index ${index}`);
    }

    if (typeof holiday.isRecurring !== 'boolean') {
      throw new Error(`isRecurring must be boolean at index ${index}`);
    }
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate.toISOString().slice(0, 10) === date;
  }

  /**
   * Check if the current time is within operating hours
   */
  public isCurrentlyOpen(currentDate: Date = new Date()): boolean {
    return this.isOpenAt(currentDate);
  }

  /**
   * Check if open at a specific date/time
   */
  public isOpenAt(date: Date): boolean {
    // Check if it's a holiday
    if (this.isHoliday(date)) {
      return false;
    }

    // Get the day of week in the operating timezone
    const dayOfWeek = this.getDayOfWeekInTimezone(date);
    
    // Find business hours for this day
    const todaysHours = this.businessHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!todaysHours || !todaysHours.isEnabled) {
      return false;
    }

    // Check if current time is within business hours
    const currentTime = this.getTimeInTimezone(date);
    return currentTime >= todaysHours.startTime && currentTime <= todaysHours.endTime;
  }

  /**
   * Get the next opening time
   */
  public getNextOpeningTime(fromDate: Date = new Date()): Date | null {
    const maxDaysToCheck = 14; // Check next 2 weeks
    let checkDate = new Date(fromDate);

    for (let i = 0; i < maxDaysToCheck; i++) {
      const dayOfWeek = this.getDayOfWeekInTimezone(checkDate);
      const dayHours = this.businessHours.find(h => h.dayOfWeek === dayOfWeek);

      if (dayHours?.isEnabled && !this.isHoliday(checkDate)) {
        // If it's today and we're before opening time
        if (i === 0) {
          const currentTime = this.getTimeInTimezone(checkDate);
          if (currentTime < dayHours.startTime) {
            return this.createDateTimeInTimezone(checkDate, dayHours.startTime);
          }
        } else {
          // If it's a future day
          return this.createDateTimeInTimezone(checkDate, dayHours.startTime);
        }
      }

      // Move to next day
      checkDate.setDate(checkDate.getDate() + 1);
    }

    return null; // No opening time found in the next 2 weeks
  }

  private isHoliday(date: Date): boolean {
    const dateString = date.toISOString().slice(0, 10);
    const monthDay = dateString.slice(5); // MM-DD format for recurring holidays

    return this.holidaySchedule.some(holiday => {
      if (holiday.isRecurring) {
        return holiday.date.slice(5) === monthDay;
      } else {
        return holiday.date === dateString;
      }
    });
  }

  private getDayOfWeekInTimezone(date: Date): number {
    // Use Intl.DateTimeFormat to get day of week in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      weekday: 'short'
    });
    
    const dayString = formatter.format(date);
    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    
    return dayMap[dayString] || 0;
  }

  private getTimeInTimezone(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return formatter.format(date);
  }

  private createDateTimeInTimezone(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  /**
   * Get a summary of operating hours
   */
  public getSummary(): string {
    const enabledHours = this.businessHours.filter(h => h.isEnabled);
    
    if (enabledHours.length === 0) {
      return 'Closed';
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const groupedHours = new Map<string, number[]>();

    enabledHours.forEach(hours => {
      const timeRange = `${hours.startTime}-${hours.endTime}`;
      if (!groupedHours.has(timeRange)) {
        groupedHours.set(timeRange, []);
      }
      groupedHours.get(timeRange)!.push(hours.dayOfWeek);
    });

    const summaryParts: string[] = [];
    
    groupedHours.forEach((days, timeRange) => {
      days.sort();
      const dayRanges = this.groupConsecutiveDays(days);
      const dayString = dayRanges.map(range => {
        if (range.length === 1) {
          return dayNames[range[0]];
        } else {
          return `${dayNames[range[0]]}-${dayNames[range[range.length - 1]]}`;
        }
      }).join(', ');
      
      summaryParts.push(`${dayString}: ${timeRange}`);
    });

    return summaryParts.join('; ');
  }

  private groupConsecutiveDays(days: number[]): number[][] {
    if (days.length === 0) return [];
    
    const groups: number[][] = [];
    let currentGroup = [days[0]];
    
    for (let i = 1; i < days.length; i++) {
      if (days[i] === days[i - 1] + 1) {
        currentGroup.push(days[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [days[i]];
      }
    }
    
    groups.push(currentGroup);
    return groups;
  }

  /**
   * Create a copy with updated values
   */
  public withTimezone(timezone: string): OperatingHours {
    return new OperatingHours(timezone, this.businessHours, this.holidaySchedule, this.outsideHoursMessage);
  }

  public withBusinessHours(businessHours: BusinessHours[]): OperatingHours {
    return new OperatingHours(this.timezone, businessHours, this.holidaySchedule, this.outsideHoursMessage);
  }

  public withHolidaySchedule(holidaySchedule: HolidaySchedule[]): OperatingHours {
    return new OperatingHours(this.timezone, this.businessHours, holidaySchedule, this.outsideHoursMessage);
  }

  public withOutsideHoursMessage(message: string): OperatingHours {
    return new OperatingHours(this.timezone, this.businessHours, this.holidaySchedule, message);
  }

  /**
   * Check equality with another OperatingHours instance
   */
  public equals(other: OperatingHours): boolean {
    return (
      this.timezone === other.timezone &&
      this.outsideHoursMessage === other.outsideHoursMessage &&
      JSON.stringify(this.businessHours) === JSON.stringify(other.businessHours) &&
      JSON.stringify(this.holidaySchedule) === JSON.stringify(other.holidaySchedule)
    );
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): object {
    return {
      timezone: this.timezone,
      businessHours: this.businessHours,
      holidaySchedule: this.holidaySchedule,
      outsideHoursMessage: this.outsideHoursMessage
    };
  }

  /**
   * Create from JSON data
   */
  public static fromJSON(data: any): OperatingHours {
    return new OperatingHours(
      data.timezone || 'UTC',
      data.businessHours || [],
      data.holidaySchedule || [],
      data.outsideHoursMessage || 'We are currently closed. Please leave a message and we will get back to you.'
    );
  }

  /**
   * Create default operating hours (Monday-Friday 9-5 UTC)
   */
  public static createDefault(): OperatingHours {
    const businessHours: BusinessHours[] = [
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isEnabled: false }, // Sunday
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isEnabled: true },  // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isEnabled: true },  // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isEnabled: true },  // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isEnabled: true },  // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isEnabled: true },  // Friday
      { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isEnabled: false }  // Saturday
    ];

    return new OperatingHours(
      'UTC',
      businessHours,
      [],
      'We are currently closed. Please leave a message and we will get back to you.'
    );
  }
} 