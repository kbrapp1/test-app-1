/**
 * Operating Hours Value Object
 * 
 * Domain layer value object representing chatbot operating schedule.
 * Immutable object that encapsulates time-based business rules and validation.
 */

export interface OperatingHoursProps {
  timezone: string;
  businessHours: BusinessHours[];
  holidaySchedule: Holiday[];
  outsideHoursMessage: string;
}

export interface BusinessHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
}

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  isRecurring: boolean;
}

export class OperatingHours {
  private constructor(private readonly props: OperatingHoursProps) {
    this.validateProps(props);
  }

  static create(props: OperatingHoursProps): OperatingHours {
    return new OperatingHours(props);
  }

  static createDefault(timezone: string = 'UTC'): OperatingHours {
    return new OperatingHours({
      timezone,
      businessHours: [
        { dayOfWeek: 0, startTime: '00:00', endTime: '23:59', isActive: true }, // Sunday
        { dayOfWeek: 1, startTime: '00:00', endTime: '23:59', isActive: true }, // Monday
        { dayOfWeek: 2, startTime: '00:00', endTime: '23:59', isActive: true }, // Tuesday
        { dayOfWeek: 3, startTime: '00:00', endTime: '23:59', isActive: true }, // Wednesday
        { dayOfWeek: 4, startTime: '00:00', endTime: '23:59', isActive: true }, // Thursday
        { dayOfWeek: 5, startTime: '00:00', endTime: '23:59', isActive: true }, // Friday
        { dayOfWeek: 6, startTime: '00:00', endTime: '23:59', isActive: true }, // Saturday
      ],
      holidaySchedule: [],
      outsideHoursMessage: 'Thank you for your message. Our team is currently offline. We will get back to you during our business hours.',
    });
  }

  static create24x7(timezone: string = 'UTC'): OperatingHours {
    return new OperatingHours({
      timezone,
      businessHours: [
        { dayOfWeek: 0, startTime: '00:00', endTime: '23:59', isActive: true }, // Sunday
        { dayOfWeek: 1, startTime: '00:00', endTime: '23:59', isActive: true }, // Monday
        { dayOfWeek: 2, startTime: '00:00', endTime: '23:59', isActive: true }, // Tuesday
        { dayOfWeek: 3, startTime: '00:00', endTime: '23:59', isActive: true }, // Wednesday
        { dayOfWeek: 4, startTime: '00:00', endTime: '23:59', isActive: true }, // Thursday
        { dayOfWeek: 5, startTime: '00:00', endTime: '23:59', isActive: true }, // Friday
        { dayOfWeek: 6, startTime: '00:00', endTime: '23:59', isActive: true }, // Saturday
      ],
      holidaySchedule: [],
      outsideHoursMessage: 'I\'m available 24/7 to help you!',
    });
  }

  private validateProps(props: OperatingHoursProps): void {
    if (!props.timezone?.trim()) {
      throw new Error('Timezone is required');
    }

    if (!Array.isArray(props.businessHours)) {
      throw new Error('Business hours must be an array');
    }

    if (!Array.isArray(props.holidaySchedule)) {
      throw new Error('Holiday schedule must be an array');
    }

    // Validate business hours
    props.businessHours.forEach((hours, index) => {
      if (hours.dayOfWeek < 0 || hours.dayOfWeek > 6) {
        throw new Error(`Business hours at index ${index}: dayOfWeek must be 0-6`);
      }
      if (!this.isValidTimeFormat(hours.startTime)) {
        throw new Error(`Business hours at index ${index}: invalid startTime format (use HH:mm)`);
      }
      if (!this.isValidTimeFormat(hours.endTime)) {
        throw new Error(`Business hours at index ${index}: invalid endTime format (use HH:mm)`);
      }
      if (hours.startTime >= hours.endTime) {
        throw new Error(`Business hours at index ${index}: startTime must be before endTime`);
      }
    });

    // Validate holidays
    props.holidaySchedule.forEach((holiday, index) => {
      if (!this.isValidDateFormat(holiday.date)) {
        throw new Error(`Holiday at index ${index}: invalid date format (use YYYY-MM-DD)`);
      }
      if (!holiday.name?.trim()) {
        throw new Error(`Holiday at index ${index}: name is required`);
      }
    });
  }

  private isValidTimeFormat(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  private isValidDateFormat(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
  }

  // Getters
  get timezone(): string { return this.props.timezone; }
  get businessHours(): BusinessHours[] { return [...this.props.businessHours]; }
  get holidaySchedule(): Holiday[] { return [...this.props.holidaySchedule]; }
  get outsideHoursMessage(): string { return this.props.outsideHoursMessage; }

  // Business methods
  updateTimezone(timezone: string): OperatingHours {
    return new OperatingHours({
      ...this.props,
      timezone,
    });
  }

  updateBusinessHours(businessHours: BusinessHours[]): OperatingHours {
    return new OperatingHours({
      ...this.props,
      businessHours,
    });
  }

  updateOutsideHoursMessage(message: string): OperatingHours {
    return new OperatingHours({
      ...this.props,
      outsideHoursMessage: message,
    });
  }

  addHoliday(holiday: Holiday): OperatingHours {
    // Check for duplicate date
    if (this.props.holidaySchedule.some(existing => existing.date === holiday.date)) {
      throw new Error(`Holiday on ${holiday.date} already exists`);
    }

    return new OperatingHours({
      ...this.props,
      holidaySchedule: [...this.props.holidaySchedule, holiday],
    });
  }

  removeHoliday(date: string): OperatingHours {
    return new OperatingHours({
      ...this.props,
      holidaySchedule: this.props.holidaySchedule.filter(holiday => holiday.date !== date),
    });
  }

  setDayActive(dayOfWeek: number, isActive: boolean): OperatingHours {
    const updatedHours = this.props.businessHours.map(hours =>
      hours.dayOfWeek === dayOfWeek ? { ...hours, isActive } : hours
    );

    return new OperatingHours({
      ...this.props,
      businessHours: updatedHours,
    });
  }

  updateDayHours(dayOfWeek: number, startTime: string, endTime: string): OperatingHours {
    const updatedHours = this.props.businessHours.map(hours =>
      hours.dayOfWeek === dayOfWeek ? { ...hours, startTime, endTime } : hours
    );

    return new OperatingHours({
      ...this.props,
      businessHours: updatedHours,
    });
  }

  isWithinOperatingHours(timestamp: Date = new Date()): boolean {
    const now = new Date(timestamp.toLocaleString("en-US", { timeZone: this.props.timezone }));
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if it's a holiday
    const dateString = now.toISOString().split('T')[0];
    const isHoliday = this.props.holidaySchedule.some(holiday => 
      holiday.date === dateString || (holiday.isRecurring && holiday.date.slice(5) === dateString.slice(5))
    );
    
    if (isHoliday) {
      return false;
    }
    
    // Check business hours for the day
    const todayHours = this.props.businessHours.find(hours => 
      hours.dayOfWeek === dayOfWeek && hours.isActive
    );
    
    if (!todayHours) {
      return false;
    }
    
    return currentTime >= todayHours.startTime && currentTime <= todayHours.endTime;
  }

  getNextOpenTime(fromTimestamp: Date = new Date()): Date | null {
    const maxDaysToCheck = 14; // Prevent infinite loops
    const checkDate = new Date(fromTimestamp);
    
    for (let i = 0; i < maxDaysToCheck; i++) {
      const dayOfWeek = checkDate.getDay();
      const dateString = checkDate.toISOString().split('T')[0];
      
      // Check if it's a holiday
      const isHoliday = this.props.holidaySchedule.some(holiday => 
        holiday.date === dateString || (holiday.isRecurring && holiday.date.slice(5) === dateString.slice(5))
      );
      
      if (!isHoliday) {
        const dayHours = this.props.businessHours.find(hours => 
          hours.dayOfWeek === dayOfWeek && hours.isActive
        );
        
        if (dayHours) {
          const [startHour, startMinute] = dayHours.startTime.split(':').map(Number);
          const openTime = new Date(checkDate);
          openTime.setHours(startHour, startMinute, 0, 0);
          
          // Convert to the configured timezone
          const timezoneOffset = new Date().getTimezoneOffset();
          const targetOffset = new Date(openTime.toLocaleString("en-US", { timeZone: this.props.timezone })).getTimezoneOffset();
          openTime.setMinutes(openTime.getMinutes() + (timezoneOffset - targetOffset));
          
          if (openTime > fromTimestamp) {
            return openTime;
          }
        }
      }
      
      // Move to next day
      checkDate.setDate(checkDate.getDate() + 1);
      checkDate.setHours(0, 0, 0, 0);
    }
    
    return null; // No open time found within the check period
  }

  toPlainObject(): OperatingHoursProps {
    return { ...this.props };
  }
} 